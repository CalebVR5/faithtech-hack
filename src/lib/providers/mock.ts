// Offline stand-in for Google Cloud. Results are deterministic and visibly
// labeled so nobody mistakes them for real transcription or translation.

import { fixtureFor } from "@/fixtures/stories";
import { LANGUAGES, type LanguageId } from "@/lib/domain/languages";
import { MAX_RENDER_SECONDS } from "@/lib/domain/limits";
import { proportionalSegments, splitSentences } from "@/lib/domain/text";
import { tokenize } from "@/lib/domain/timing";
import type { Transcript, TranscriptWord } from "@/lib/domain/types";
import { toneWav } from "@/lib/media/wav";
import type { LanguageProvider, SynthesizeInput, TranscribeInput, TranslateInput } from "./types";

const MOCK_SAMPLE_RATE = 24_000;
const MS_PER_CHAR = 65;

// Returned for languages with no sample story, so a mock transcript is never
// in the wrong language. Worded as an obvious placeholder to edit.
const PLACEHOLDER_TRANSCRIPTS: Record<LanguageId, string> = {
  en: "This is a mock transcript for demo mode. Edit these words to tell your story.",
  fr: "Ceci est une transcription fictive du mode démo. Modifiez ces mots pour raconter votre histoire.",
  "es-419": "Esta es una transcripción simulada del modo demo. Edita estas palabras para contar tu historia.",
  "pt-BR": "Esta é uma transcrição simulada do modo demo. Edite estas palavras para contar sua história.",
};

export const mockProvider: LanguageProvider = {
  name: "mock",

  async transcribe({ durationMs, language, sttLocale, scriptText }: TranscribeInput): Promise<Transcript> {
    const text = scriptText?.trim() || fixtureFor(language, sttLocale)?.text || PLACEHOLDER_TRANSCRIPTS[language];
    const locale = LANGUAGES[language].uiLocale;
    const sentences = splitSentences(text, locale);
    const span = Math.max(durationMs, 1000);
    const segments = proportionalSegments(sentences, span);

    const tokens = text.split(/\s+/).filter(Boolean);
    const step = span / tokens.length;
    const words: TranscriptWord[] = tokens.map((text, i) => ({
      text,
      startMs: Math.round(i * step),
      endMs: Math.round((i + 1) * step),
      confidence: i === 3 ? 0.42 : 0.95,
      // One deliberately uncertain word so the correction UI has something to show.
      uncertain: i === 3,
    }));

    return { text, segments, words, locale: sttLocale, provider: "mock", model: scriptText ? "script-echo" : "fixture" };
  },

  async translate({ segments, to }: TranslateInput): Promise<string[]> {
    return segments.map((s) => `[mock ${LANGUAGES[to].translateCode}] ${s}`);
  },

  async synthesize({ text }: SynthesizeInput) {
    // Word timings spread by length over a placeholder tone, like a steady reader.
    const tokens = tokenize(text);
    const durationMs = Math.min(Math.max(text.length * MS_PER_CHAR, 1000), MAX_RENDER_SECONDS * 1000);
    const total = tokens.reduce((n, w) => n + w.length + 1, 0) || 1;
    let cursor = 0;
    const words = tokens.map((w) => {
      const ms = ((w.length + 1) / total) * durationMs;
      const word = { text: w, startMs: Math.round(cursor), endMs: Math.round(cursor + ms) };
      cursor += ms;
      return word;
    });
    return { audio: toneWav(durationMs, MOCK_SAMPLE_RATE), mimeType: "audio/wav" as const, durationMs, words, voice: "mock-tone" };
  },
};
