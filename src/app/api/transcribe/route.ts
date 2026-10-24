import { resolveSttLocale } from "@/lib/domain/languages";
import {
  ACCEPTED_AUDIO_TYPES,
  ACCEPTED_VIDEO_TYPES,
  MAX_RECORDING_SECONDS,
  MAX_STORY_CHARS,
  MAX_UPLOAD_BYTES,
  MAX_VIDEO_UPLOAD_BYTES,
} from "@/lib/domain/limits";
import { getLanguageProvider } from "@/lib/providers";
import { snapToPauses } from "@/lib/domain/timing";
import { detectPauses, normalizeAudio, probeMedia } from "@/lib/server/ffmpeg";
import { requireCapture, requireStory } from "@/lib/server/guards";
import { handleRouteError, hasCloudConsent, json, jsonError } from "@/lib/server/http";
import { getOrCreateSessionId } from "@/lib/server/session";
import { rememberHeard } from "@/lib/server/store";
import { putFile } from "@/lib/server/temp-store";
import { reserve } from "@/lib/server/usage";

/** Sample rate kept for narration; transcription uses 16 kHz. */
const NARRATION_SAMPLE_RATE = 48_000;

// Accepts one short recording, audio or camera video, and returns a draft
// transcript for the author to correct. Only the extracted sound goes to the
// speech service. With keep=true the app keeps, for up to an hour: a converted
// copy of the sound (metadata stripped) for narration, and for a video the
// original file for "Video of me". The consent screen says so, and deleting
// the story removes them. Without keep, nothing is stored.
export async function POST(request: Request) {
  try {
    const sessionId = await getOrCreateSessionId(request);
    const form = await request.formData();
    const story = requireStory(sessionId, form.get("storyId"));
    requireCapture(story);
    const media = form.get("audio");

    if (!hasCloudConsent(form.get("cloudProcessingAccepted"))) {
      return jsonError(403, "Transcription needs your permission to send the recording to the speech service.", "transcription-consent-needed");
    }
    if (!(media instanceof File)) return jsonError(400, "No recording was attached.");

    const baseType = media.type.split(";")[0].trim().toLowerCase();
    const isVideo = (ACCEPTED_VIDEO_TYPES as readonly string[]).includes(baseType);
    if (!isVideo && !(ACCEPTED_AUDIO_TYPES as readonly string[]).includes(baseType)) {
      return jsonError(415, "That file type isn't supported. Try recording in the app or uploading a common audio or video file.", "unsupported-type");
    }
    if (media.size > (isVideo ? MAX_VIDEO_UPLOAD_BYTES : MAX_UPLOAD_BYTES)) {
      return jsonError(413, `That file is too large. Recordings can be up to ${MAX_RECORDING_SECONDS} seconds.`, "too-large");
    }

    const input = Buffer.from(await media.arrayBuffer());
    if (isVideo) {
      const streams = await probeMedia(input);
      if (!streams.hasVideo || !streams.hasAudio) {
        return jsonError(422, "That video needs both picture and sound. Please record again.", "video-incomplete");
      }
    }
    const normalized = await normalizeAudio(input);
    if (normalized.durationMs > (MAX_RECORDING_SECONDS + 1) * 1000) {
      return jsonError(413, `Recordings can be up to ${MAX_RECORDING_SECONDS} seconds. Please record a shorter take.`, "too-long-recording");
    }
    if (normalized.durationMs < 500) return jsonError(422, "That recording is empty. Please try again.", "empty-recording");

    const provider = getLanguageProvider();
    if (provider.name !== "mock") reserve("sttSeconds", Math.ceil(normalized.durationMs / 1000));

    const sttLocale = resolveSttLocale(story.sourceLanguage, (form.get("sttLocale") as string | null) ?? undefined);
    const script = form.get("scriptText");
    const heard = await provider.transcribe({
      ...normalized,
      language: story.sourceLanguage,
      sttLocale,
      scriptText: typeof script === "string" ? script.slice(0, MAX_STORY_CHARS) : undefined,
    });
    // Word times from speech-to-text drift by a few hundred milliseconds; the
    // recording's own pauses show exactly when each phrase starts.
    const pauses = await detectPauses(normalized.wav);
    const snapped = snapToPauses(heard.words, pauses);
    const transcript = { ...heard, words: heard.words.map((w, i) => ({ ...w, startMs: snapped[i].startMs, endMs: snapped[i].endMs })) };

    let audioRef: string | undefined;
    let videoRef: string | undefined;
    if (form.get("keep") === "true" || isVideo) {
      const narration = await normalizeAudio(input, NARRATION_SAMPLE_RATE);
      audioRef = (await putFile(sessionId, narration.wav, "audio/wav")).id;
      if (isVideo) videoRef = (await putFile(sessionId, input, baseType)).id;
      rememberHeard(audioRef, {
        sessionId,
        words: transcript.words.map(({ text, startMs, endMs }) => ({ text, startMs, endMs })),
        durationMs: normalized.durationMs,
        media: isVideo ? "video" : "audio",
        videoRef,
        sttLocale,
        provider: provider.name,
      });
    }

    return json({ transcript, durationMs: normalized.durationMs, audioRef, videoRef, media: isVideo ? "video" : "audio", draft: true });
  } catch (err) {
    return handleRouteError(err);
  }
}
