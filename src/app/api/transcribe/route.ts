import { isLanguageId, resolveSttLocale } from "@/lib/domain/languages";
import { ACCEPTED_AUDIO_TYPES, MAX_RECORDING_SECONDS, MAX_UPLOAD_BYTES } from "@/lib/domain/limits";
import { getLanguageProvider } from "@/lib/providers";
import { normalizeAudio } from "@/lib/server/ffmpeg";
import { handleRouteError, hasCloudConsent, jsonError } from "@/lib/server/http";
import { getOrCreateSessionId } from "@/lib/server/session";
import { reserve } from "@/lib/server/usage";

// Accepts one short recording, returns a draft transcript for the author to
// correct. The raw upload is not kept: the browser holds it for replay.
export async function POST(request: Request) {
  try {
    await getOrCreateSessionId(request);
    const form = await request.formData();
    const audio = form.get("audio");
    const language = form.get("language");

    if (!hasCloudConsent(form.get("cloudProcessingAccepted"))) {
      return jsonError(403, "Transcription needs your permission to send the recording to the speech service.");
    }
    if (!isLanguageId(language)) return jsonError(400, "Choose the language spoken in the recording.");
    if (!(audio instanceof File)) return jsonError(400, "No recording was attached.");

    const baseType = audio.type.split(";")[0].trim().toLowerCase();
    if (!(ACCEPTED_AUDIO_TYPES as readonly string[]).includes(baseType)) {
      return jsonError(415, "That file type isn't supported. Try recording in the app or uploading a common audio file.");
    }
    if (audio.size > MAX_UPLOAD_BYTES) {
      return jsonError(413, `That file is too large. Recordings can be up to ${MAX_RECORDING_SECONDS} seconds.`);
    }

    const normalized = await normalizeAudio(Buffer.from(await audio.arrayBuffer()));
    if (normalized.durationMs > (MAX_RECORDING_SECONDS + 1) * 1000) {
      return jsonError(413, `Recordings can be up to ${MAX_RECORDING_SECONDS} seconds. Please record a shorter take.`);
    }

    const provider = getLanguageProvider();
    if (provider.name !== "mock") reserve("sttSeconds", Math.ceil(normalized.durationMs / 1000));

    const sttLocale = resolveSttLocale(language, (form.get("sttLocale") as string | null) ?? undefined);
    const transcript = await provider.transcribe({ ...normalized, language, sttLocale });

    return Response.json(
      { transcript, durationMs: normalized.durationMs, draft: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    return handleRouteError(err);
  }
}
