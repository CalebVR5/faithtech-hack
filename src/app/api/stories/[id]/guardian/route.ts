import { needsGuardian } from "@/lib/domain/policy";
import { requireStory } from "@/lib/server/guards";
import { handleRouteError, json, jsonError } from "@/lib/server/http";
import { getOrCreateSessionId } from "@/lib/server/session";
import { storyView } from "@/lib/server/store";

// TEST SCENARIO ONLY. Simulates a guardian's decision so the demo can show
// blocked states staying blocked. It is not guardianship or identity
// verification, and a real product needs a separate safeguarding design
// (plan section 6, "Guardian gate").
export async function POST(request: Request, ctx: RouteContext<"/api/stories/[id]/guardian">) {
  try {
    const sessionId = await getOrCreateSessionId(request);
    const story = requireStory(sessionId, (await ctx.params).id);
    const { decision } = (await request.json().catch(() => null)) ?? {};
    if (!needsGuardian(story)) return jsonError(400, "This story doesn't need guardian approval.");
    if (decision !== "approved-in-simulation" && decision !== "declined") return jsonError(400, "Unknown decision.");
    // A decision is final for this story; a declined story stays blocked.
    if (story.guardianCapture !== "pending") return jsonError(409, "A guardian decision was already recorded.", "guardian-decided");
    story.guardianCapture = decision;
    return json({ story: storyView(story) });
  } catch (err) {
    return handleRouteError(err);
  }
}
