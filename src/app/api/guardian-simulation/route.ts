import { needsGuardian } from "@/lib/domain/policy";
import { assetState, requireAsset } from "@/lib/server/guards";
import { handleRouteError, json, jsonError } from "@/lib/server/http";
import { getOrCreateSessionId } from "@/lib/server/session";
import { setGuardianDecision } from "@/lib/server/store";

// TEST SCENARIO ONLY: a simulated guardian decision for one exact asset
// version and purpose. Pressing a button in the minor's own browser is not
// evidence of a guardian's identity (plan section 6). A new render creates a
// new version, so this approval never carries over to changed media.
export async function POST(request: Request) {
  try {
    const sessionId = await getOrCreateSessionId(request);
    const body = (await request.json().catch(() => null)) ?? {};
    const { asset, story } = requireAsset(sessionId, body.assetId);
    if (!needsGuardian(story)) return jsonError(400, "This story doesn't need guardian approval.");
    if (body.decision !== "approved-in-simulation" && body.decision !== "declined") return jsonError(400, "Unknown decision.");
    if (body.purpose !== "personal-output" && body.purpose !== "baptize-review") return jsonError(400, "Unknown purpose.");
    if (body.assetVersion !== asset.version) {
      return jsonError(409, "This preview changed. The guardian needs to see the new version.", "asset-changed");
    }
    const consent = setGuardianDecision(asset.id, asset.version, body.purpose, body.decision);
    if (!consent) return jsonError(409, "The storyteller hasn't approved this version yet.", "needs-approval");
    return json(assetState(sessionId, story, asset));
  } catch (err) {
    return handleRouteError(err);
  }
}
