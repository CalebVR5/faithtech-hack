import { exportFilename } from "@/lib/domain/output-labels";
import { authorize } from "@/lib/domain/policy";
import { requireAsset } from "@/lib/server/guards";
import { handleRouteError, jsonError } from "@/lib/server/http";
import { getOrCreateSessionId } from "@/lib/server/session";
import { consentsFor } from "@/lib/server/store";
import { getFile } from "@/lib/server/temp-store";

// The only way an output leaves the app. Checks ownership, story version,
// age/guardian state and exact-version approval through authorize().
export async function POST(request: Request) {
  try {
    const sessionId = await getOrCreateSessionId(request);
    const body = (await request.json().catch(() => null)) ?? {};
    const { asset, story } = requireAsset(sessionId, body.assetId);

    const decision = authorize("export", { sessionId, story, asset, consents: consentsFor(story.id) });
    if (!decision.ok) return jsonError(403, decision.reason, decision.code);

    const file = asset.fileRef ? await getFile(sessionId, asset.fileRef) : null;
    if (!file) return jsonError(410, "This version has expired. Please make it again.", "preview-expired");

    const filename = exportFilename(story.storyType, asset.spec.kind);
    return new Response(new Uint8Array(file.data), {
      headers: {
        "Content-Type": file.record.mimeType,
        "Content-Length": String(file.record.bytes),
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
        "X-Asset-Version": String(asset.version),
      },
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
