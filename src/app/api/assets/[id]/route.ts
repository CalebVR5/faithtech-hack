import { assetState, requireAsset } from "@/lib/server/guards";
import { handleRouteError, json, jsonError } from "@/lib/server/http";
import { getSessionId } from "@/lib/server/session";
import { getFile } from "@/lib/server/temp-store";

// In-app preview of the exact rendered file, for its owner only. Leaving the
// app (download, share) goes through POST /api/export, which checks approval.
// ?state=1 returns the permission state instead of the file.
export async function GET(request: Request, ctx: RouteContext<"/api/assets/[id]">) {
  try {
    const sessionId = (await getSessionId()) ?? "";
    const { asset, story } = requireAsset(sessionId, (await ctx.params).id);
    if (new URL(request.url).searchParams.get("state") === "1") return json(assetState(sessionId, story, asset));

    const file = asset.fileRef ? await getFile(sessionId, asset.fileRef) : null;
    if (!file) return jsonError(404, "This preview has expired. Please make it again.", "preview-expired");
    return new Response(new Uint8Array(file.data), {
      headers: {
        "Content-Type": file.record.mimeType,
        "Content-Length": String(file.record.bytes),
        "Content-Disposition": "inline",
        "Cache-Control": "private, no-store",
        "X-Robots-Tag": "noindex",
      },
    });
  } catch (err) {
    return handleRouteError(err);
  }
}
