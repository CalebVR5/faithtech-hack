import { isLanguageId } from "@/lib/domain/languages";
import { MAX_STORY_CHARS } from "@/lib/domain/limits";
import type { SynthesisResult } from "@/lib/domain/types";
import { getLanguageProvider } from "@/lib/providers";
import { handleRouteError, hasCloudConsent, jsonError } from "@/lib/server/http";
import { getOrCreateSessionId } from "@/lib/server/session";
import { putFile } from "@/lib/server/temp-store";
import { reserve } from "@/lib/server/usage";

// Reads approved original-language text in the configured stock voice. Returns
// a private audio reference for preview and rendering, never a publish decision.
export async function POST(request: Request) {
  try {
    const sessionId = await getOrCreateSessionId(request);
    const body = await request.json().catch(() => null);
    const { text, language, cloudProcessingAccepted } = body ?? {};

    if (!hasCloudConsent(cloudProcessingAccepted)) {
      return jsonError(403, "Synthetic narration needs your permission to send your text to the speech service.");
    }
    if (!isLanguageId(language)) return jsonError(400, "Choose the story's language.");
    if (typeof text !== "string" || text.trim().length === 0) return jsonError(400, "Nothing to narrate.");
    if (text.length > MAX_STORY_CHARS) return jsonError(413, `Stories can be up to ${MAX_STORY_CHARS} characters.`);

    const provider = getLanguageProvider();
    if (provider.name !== "mock") reserve("ttsChars", text.length);
    const out = await provider.synthesize({ text, language });
    const stored = await putFile(sessionId, out.audio, out.mimeType);

    const result: SynthesisResult = {
      audioRef: stored.id,
      mimeType: out.mimeType,
      durationMs: out.durationMs,
      segments: out.segments,
      language,
      voice: out.voice,
      provider: provider.name,
    };
    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return handleRouteError(err);
  }
}
