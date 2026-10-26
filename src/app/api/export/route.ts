import { exportFilename } from "@/lib/domain/output-labels";
import { authorize } from "@/lib/domain/policy";
import { requireAsset } from "@/lib/server/guards";
import { handleRouteError, jsonError } from "@/lib/server/http";
import { getOrCreateSessionId } from "@/lib/server/session";
import { consentsFor, deleteStory } from "@/lib/server/store";
import { getFile } from "@/lib/server/temp-store";

// The only way an output leaves the app, and the end of the app's part. Checks
// ownership, the adults-only gate, story version and exact-version approval
// through authorize(), then hands over the file and deletes the story with
// every recording, transcript and output. Nothing is kept for later: the
// person's browser holds the file from here on.
export async function POST(request: Request) {
  try {
    const sessionId = await getOrCreateSessionId(request);
    const body = (await request.json().catch(() => null)) ?? {};
    const { asset, story } = requireAsset(sessionId, body.assetId);

    const decision = authorize({ sessionId, story, asset, consents: consentsFor(story.id) });
    if (!decision.ok) return jsonError(403, decision.reason, decision.code);

    const file = asset.fileRef ? await getFile(sessionId, asset.fileRef) : null;
    if (!file) return jsonError(410, "This version has expired. Please make it again.", "preview-expired");

    const filename = exportFilename(story.storyType, asset.spec.kind);
    const data = new Uint8Array(file.data);
    await deleteStory(story.id);
    return new Response(data, {
      headers: {
        "Content-Type": file.record.mimeType,
        "Content-Length": String(file.record.bytes),
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
        "X-Asset-Version": String(asset.version),
        // Tells the app its server copy is gone, so it stops offering changes.
        "X-Story-Deleted": "true",
      },
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
