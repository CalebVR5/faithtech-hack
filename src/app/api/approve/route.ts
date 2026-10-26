import { CONSENT_COPY_VERSION } from "@/lib/domain/policy";
import { assetState, requireAsset } from "@/lib/server/guards";
import { handleRouteError, json, jsonError } from "@/lib/server/http";
import { getOrCreateSessionId } from "@/lib/server/session";
import { recordConsent } from "@/lib/server/store";

// Records the author's approval of one exact asset version, the only
// permission the app asks for: letting that version leave the app as a
// download. It's held with the story and deleted with it.
export async function POST(request: Request) {
  try {
    const sessionId = await getOrCreateSessionId(request);
    const body = (await request.json().catch(() => null)) ?? {};
    const { asset, story } = requireAsset(sessionId, body.assetId);

    if (body.purpose !== "personal-output") return jsonError(400, "That permission isn't available here.");
    if (body.decision !== "granted" && body.decision !== "declined") return jsonError(400, "Unknown decision.");
    // Approval names the version the person actually saw.
    if (body.assetVersion !== asset.version || asset.status !== "rendered") {
      return jsonError(409, "This preview changed. Please look at the new version first.", "asset-changed");
    }
    if (asset.storyVersion !== story.version) {
      return jsonError(409, "Your story changed after this version was made. Please make a new preview.", "asset-stale");
    }

    recordConsent({
      storyId: story.id,
      assetId: asset.id,
      assetVersion: asset.version,
      purpose: "personal-output",
      decision: body.decision,
      consentCopyVersion: CONSENT_COPY_VERSION,
    });
    return json(assetState(sessionId, story, asset));
  } catch (err) {
    return handleRouteError(err);
  }
}
