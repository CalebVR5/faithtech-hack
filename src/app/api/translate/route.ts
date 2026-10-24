import { isLanguageId } from "@/lib/domain/languages";
import { MAX_STORY_CHARS } from "@/lib/domain/limits";
import { getLanguageProvider } from "@/lib/providers";
import { handleRouteError, hasCloudConsent, jsonError } from "@/lib/server/http";
import { getOrCreateSessionId } from "@/lib/server/session";
import { reserve } from "@/lib/server/usage";

// Translates reviewed caption segments. The result is a machine translation
// that has not been independently reviewed, and the response says so.
export async function POST(request: Request) {
  try {
    await getOrCreateSessionId(request);
    const body = await request.json().catch(() => null);
    const { segments, from, to, cloudProcessingAccepted } = body ?? {};

    if (!hasCloudConsent(cloudProcessingAccepted)) {
      return jsonError(403, "Translation needs your permission to send your text to the translation service.");
    }
    if (!isLanguageId(from) || !isLanguageId(to)) return jsonError(400, "Choose both languages.");
    if (from === to) return jsonError(400, "Choose a different caption language.");
    if (!Array.isArray(segments) || !segments.every((s) => typeof s === "string")) {
      return jsonError(400, "Nothing to translate.");
    }
    const chars = segments.reduce((sum: number, s: string) => sum + s.length, 0);
    if (chars === 0 || chars > MAX_STORY_CHARS) {
      return jsonError(413, `Stories can be up to ${MAX_STORY_CHARS} characters.`);
    }

    const provider = getLanguageProvider();
    if (provider.name !== "mock") reserve("translateChars", chars);
    const translated = await provider.translate({ segments, from, to });

    return Response.json(
      {
        segments: translated,
        from,
        to,
        provider: provider.name,
        machineGenerated: true,
        reviewStatus: "not-reviewed",
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    return handleRouteError(err);
  }
}
