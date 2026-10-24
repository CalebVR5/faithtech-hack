import "server-only";

// Google Cloud Speech-to-Text v1, Translation v2 (Basic) and Text-to-Speech
// v1beta1 over REST with an API key, so there's no SDK or service-account file
// to set up on each laptop. Free tier at time of writing: 60 min STT,
// 500k translation characters and millions of Standard-voice TTS characters
// per month. Confirm on the pricing pages and set a budget alert.
//
// Spike checklist (plan section 7): confirm each locale and voice in
// languages.ts exists, word time offsets come back for every locale, and SSML
// mark timepoints work for the chosen Standard voices.

import { LANGUAGES } from "@/lib/domain/languages";
import { UNCERTAIN_WORD_CONFIDENCE } from "@/lib/domain/limits";
import { splitSentences } from "@/lib/domain/text";
import { tokenize, type TimedWord } from "@/lib/domain/timing";
import type { Segment, Transcript, TranscriptWord } from "@/lib/domain/types";
import { wavData, wavDurationMs, wavHeader } from "@/lib/media/wav";
import {
  ProviderError,
  type LanguageProvider,
  type SynthesizeInput,
  type SynthesizeOutput,
  type TranscribeInput,
  type TranslateInput,
} from "./types";

const TTS_SAMPLE_RATE = 24_000;
const REQUEST_TIMEOUT_MS = 30_000;

function apiKey(): string {
  const key = process.env.GOOGLE_API_KEY;
  if (!key) throw new ProviderError("Google Cloud is selected but GOOGLE_API_KEY is not set.", 500);
  return key;
}

async function post<T>(url: string, body: unknown, service: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Goog-Api-Key": apiKey() },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (err) {
    if (err instanceof ProviderError) throw err;
    throw new ProviderError(`${service} could not be reached. Your draft is safe; please try again.`, 504);
  }
  if (!res.ok) {
    // Log the provider's status, never the request body (it contains story content).
    const detail = await res.text().catch(() => "");
    console.error(`[gcp] ${service} ${res.status}: ${detail.slice(0, 500)}`);
    throw new GcpRequestError(`${service} returned an error (${res.status}). Your draft is safe; please try again.`, res.status, detail);
  }
  return (await res.json()) as T;
}

/** A provider error that keeps Google's response text, so callers can react to specific refusals. */
class GcpRequestError extends ProviderError {
  constructor(
    message: string,
    readonly httpStatus: number,
    readonly detail: string,
  ) {
    super(message);
  }
}

// latest_long punctuates and keeps spoken numbers as words ("one night", not
// "1 night") far better than the default model, and kept a sentence-initial
// word the default dropped in Mexican Spanish. Some locales (es-PE) don't offer
// it yet; those fall back to the default model. Compared on 2026-10-24.
const PREFERRED_STT_MODEL = "latest_long";
const unsupportedModelLocales = new Set<string>();

function isUnsupportedModel(err: unknown): boolean {
  return err instanceof GcpRequestError && err.httpStatus === 400 && /model is currently not supported/i.test(err.detail);
}

function recognize(wav: Buffer, sampleRate: number, sttLocale: string, model?: string) {
  return post<RecognizeResponse>(
    "https://speech.googleapis.com/v1/speech:recognize",
    {
      config: {
        encoding: "LINEAR16",
        sampleRateHertz: sampleRate,
        languageCode: sttLocale,
        ...(model ? { model } : {}),
        enableWordTimeOffsets: true,
        enableWordConfidence: true,
        enableAutomaticPunctuation: true,
      },
      audio: { content: wav.toString("base64") },
    },
    "Speech-to-Text",
  );
}

/** "1.200s" → 1200 */
function durationToMs(value: string | undefined): number {
  return value ? Math.round(parseFloat(value) * 1000) : 0;
}

interface RecognizeResponse {
  results?: Array<{
    alternatives?: Array<{
      transcript?: string;
      words?: Array<{ word: string; startTime?: string; endTime?: string; confidence?: number }>;
    }>;
  }>;
}

interface TranslateResponse {
  data: { translations: Array<{ translatedText: string }> };
}

interface SynthesizeResponse {
  audioContent: string;
  timepoints?: Array<{ markName: string; timeSeconds: number }>;
}

/** Google's limit is 5,000 bytes of SSML per request; leave room for escaping. */
const SSML_BYTE_BUDGET = 4500;

function ssmlFor(tokens: string[]): string {
  return `<speak>${tokens.map((w, i) => `<mark name="${i}"/>${escapeSsml(w)}`).join(" ")}</speak>`;
}

function escapeSsml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export const gcpProvider: LanguageProvider = {
  name: "gcp",

  async transcribe({ wav, sampleRate, sttLocale }: TranscribeInput): Promise<Transcript> {
    let model = unsupportedModelLocales.has(sttLocale) ? "default" : PREFERRED_STT_MODEL;
    let json: RecognizeResponse;
    try {
      json = await recognize(wav, sampleRate, sttLocale, model === "default" ? undefined : model);
    } catch (err) {
      if (!isUnsupportedModel(err)) throw err;
      unsupportedModelLocales.add(sttLocale);
      model = "default";
      json = await recognize(wav, sampleRate, sttLocale);
    }

    const segments: Segment[] = [];
    const words: TranscriptWord[] = [];
    for (const result of json.results ?? []) {
      const alt = result.alternatives?.[0];
      if (!alt?.transcript) continue;
      const altWords = (alt.words ?? []).map((w) => ({
        text: w.word,
        startMs: durationToMs(w.startTime),
        endMs: durationToMs(w.endTime),
        confidence: w.confidence,
        uncertain: w.confidence !== undefined && w.confidence < UNCERTAIN_WORD_CONFIDENCE,
      }));
      words.push(...altWords);
      segments.push({
        text: alt.transcript.trim(),
        startMs: altWords[0]?.startMs ?? 0,
        endMs: altWords.at(-1)?.endMs ?? 0,
      });
    }

    return {
      text: segments.map((s) => s.text).join(" "),
      segments,
      words,
      locale: sttLocale,
      provider: "gcp",
      model: `speech-v1-${model}`,
    };
  },

  async translate({ segments, from, to }: TranslateInput): Promise<string[]> {
    if (segments.length === 0) return [];
    const json = await post<TranslateResponse>(
      "https://translation.googleapis.com/language/translate/v2",
      {
        q: segments,
        source: LANGUAGES[from].translateCode,
        target: LANGUAGES[to].translateCode,
        format: "text",
      },
      "Translation",
    );
    const out = json.data.translations.map((t) => t.translatedText);
    if (out.length !== segments.length) throw new ProviderError("Translation returned an unexpected result.");
    return out;
  },

  async synthesize({ text, language }: SynthesizeInput): Promise<SynthesizeOutput> {
    const config = LANGUAGES[language];
    // A mark before every word gives each one its exact time in the real audio,
    // so captions change when the voice does. Whole sentences are batched to stay
    // under Google's 5,000-byte input limit, then the audio is joined.
    const batches: string[][] = [];
    let current: string[] = [];
    const fits = (tokens: string[]) => Buffer.byteLength(ssmlFor(tokens)) <= SSML_BYTE_BUDGET;
    for (const sentence of splitSentences(text, config.uiLocale)) {
      const tokens = tokenize(sentence);
      if (fits([...current, ...tokens])) {
        current.push(...tokens);
        continue;
      }
      if (current.length) batches.push(current);
      current = [];
      // A single run-on sentence over the limit is split between words.
      for (const token of tokens) {
        if (current.length && !fits([...current, token])) {
          batches.push(current);
          current = [];
        }
        current.push(token);
      }
    }
    if (current.length) batches.push(current);

    const pcm: Buffer[] = [];
    const words: TimedWord[] = [];
    let offsetMs = 0;
    for (const tokens of batches) {
      const json = await post<SynthesizeResponse>(
        "https://texttospeech.googleapis.com/v1beta1/text:synthesize",
        {
          input: { ssml: ssmlFor(tokens) },
          voice: { languageCode: config.ttsLocale, name: config.ttsVoice },
          audioConfig: { audioEncoding: "LINEAR16", sampleRateHertz: TTS_SAMPLE_RATE },
          enableTimePointing: ["SSML_MARK"],
        },
        "Text-to-Speech",
      );
      const audio = Buffer.from(json.audioContent, "base64");
      const durationMs = wavDurationMs(audio);
      const starts = new Map((json.timepoints ?? []).map((t) => [t.markName, Math.round(t.timeSeconds * 1000)]));
      if (starts.size !== tokens.length) {
        // Fail rather than guess: captions must follow the audio actually used.
        throw new ProviderError("Text-to-Speech did not return caption timing for this voice.");
      }
      tokens.forEach((token, i) => {
        const startMs = starts.get(String(i)) ?? 0;
        const endMs = i === tokens.length - 1 ? durationMs : (starts.get(String(i + 1)) ?? durationMs);
        words.push({ text: token, startMs: offsetMs + startMs, endMs: offsetMs + endMs });
      });
      pcm.push(wavData(audio));
      offsetMs += durationMs;
    }

    const data = Buffer.concat(pcm);
    const audio = Buffer.concat([wavHeader(data.length, TTS_SAMPLE_RATE), data]);
    return { audio, mimeType: "audio/wav", durationMs: wavDurationMs(audio), words, voice: config.ttsVoice };
  },
};
