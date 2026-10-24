import { jsonError } from "@/lib/server/http";
import { getSessionId } from "@/lib/server/session";
import { deleteFile, getFile } from "@/lib/server/temp-store";

// Serves temp media only to the session that created it.
export async function GET(_request: Request, ctx: RouteContext<"/api/media/[id]">) {
  const { id } = await ctx.params;
  const sessionId = await getSessionId();
  const file = sessionId ? await getFile(sessionId, id).catch(() => null) : null;
  if (!file) return jsonError(404, "Not found.");

  return new Response(new Uint8Array(file.data), {
    headers: {
      "Content-Type": file.record.mimeType,
      "Content-Length": String(file.record.bytes),
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}

export async function DELETE(_request: Request, ctx: RouteContext<"/api/media/[id]">) {
  const { id } = await ctx.params;
  const sessionId = await getSessionId();
  const file = sessionId ? await getFile(sessionId, id).catch(() => null) : null;
  if (!file) return jsonError(404, "Not found.");
  await deleteFile(id);
  return new Response(null, { status: 204 });
}
