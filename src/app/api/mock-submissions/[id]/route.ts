import { requireStory } from "@/lib/server/guards";
import { handleRouteError, jsonError } from "@/lib/server/http";
import { getSessionId } from "@/lib/server/session";
import { db, withdrawSubmission } from "@/lib/server/store";

// Withdraws a demo-inbox submission. The app deletes its copy; it can't
// recall files already downloaded elsewhere (plan section 6).
export async function DELETE(_request: Request, ctx: RouteContext<"/api/mock-submissions/[id]">) {
  try {
    const sessionId = (await getSessionId()) ?? "";
    const entry = db.inbox.get((await ctx.params).id);
    if (!entry) return jsonError(404, "Not found.", "not-found");
    requireStory(sessionId, entry.submission.storyId);
    if (entry.submission.state !== "withdrawn") withdrawSubmission(entry);
    return new Response(null, { status: 204 });
  } catch (err) {
    return handleRouteError(err);
  }
}
