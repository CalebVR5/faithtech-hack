import { resolveSttLocale } from "@/lib/domain/languages";
import { ACCEPTED_AUDIO_TYPES, MAX_RECORDING_SECONDS, MAX_STORY_CHARS, MAX_UPLOAD_BYTES } from "@/lib/domain/limits";
import { getLanguageProvider } from "@/lib/providers";
import { normalizeAudio } from "@/lib/server/ffmpeg";
import { requireCapture, requireStory } from "@/lib/server/guards";
import { handleRouteError, hasCloudConsent, json, jsonError } from "@/lib/server/http";
import { getOrCreateSessionId } from "@/lib/server/session";
import { putFile } from "@/lib/server/temp-store";
import { reserve } from "@/lib/server/usage";

/** Sample rate kept for narration; transcription uses 16 kHz. */
const NARRATION_SAMPLE_RATE = 48_000;

// Accepts one short recording and returns a draft transcript for the author to
// correct. The raw upload is never stored. With keep=true, a converted copy
// (metadata stripped) is kept for up to an hour so it can narrate a video; the
// consent screen says so, and deleting the story removes it.
export async function POST(request: Request) {
  try {
    const sessionId = await getOrCreateSessionId(request);
    const form = await request.formData();
    const story = requireStory(sessionId, form.get("storyId"));
    requireCapture(story);
    const audio = form.get("audio");

    if (!hasCloudConsent(form.get("cloudProcessingAccepted"))) {
      return jsonError(403, "Transcription needs your permission to send the recording to the speech service.", "transcription-consent-needed");
    }
    if (!(audio instanceof File)) return jsonError(400, "No recording was attached.");

    const baseType = audio.type.split(";")[0].trim().toLowerCase();
    if (!(ACCEPTED_AUDIO_TYPES as readonly string[]).includes(baseType)) {
      return jsonError(415, "That file type isn't supported. Try recording in the app or uploading a common audio file.", "unsupported-type");
    }
    if (audio.size > MAX_UPLOAD_BYTES) {
      return jsonError(413, `That file is too large. Recordings can be up to ${MAX_RECORDING_SECONDS} seconds.`, "too-large");
    }

    const input = Buffer.from(await audio.arrayBuffer());
    const normalized = await normalizeAudio(input);
    if (normalized.durationMs > (MAX_RECORDING_SECONDS + 1) * 1000) {
      return jsonError(413, `Recordings can be up to ${MAX_RECORDING_SECONDS} seconds. Please record a shorter take.`, "too-long-recording");
    }
    if (normalized.durationMs < 500) return jsonError(422, "That recording is empty. Please try again.", "empty-recording");

    const provider = getLanguageProvider();
    if (provider.name !== "mock") reserve("sttSeconds", Math.ceil(normalized.durationMs / 1000));

    const sttLocale = resolveSttLocale(story.sourceLanguage, (form.get("sttLocale") as string | null) ?? undefined);
    const script = form.get("scriptText");
    const transcript = await provider.transcribe({
      ...normalized,
      language: story.sourceLanguage,
      sttLocale,
      scriptText: typeof script === "string" ? script.slice(0, MAX_STORY_CHARS) : undefined,
    });

    let audioRef: string | undefined;
    if (form.get("keep") === "true") {
      const narration = await normalizeAudio(input, NARRATION_SAMPLE_RATE);
      audioRef = (await putFile(sessionId, narration.wav, "audio/wav")).id;
    }

    return json({ transcript, durationMs: normalized.durationMs, audioRef, draft: true });
  } catch (err) {
    return handleRouteError(err);
  }
}
