import { CONSENT_COPY_VERSION, MOCK_INBOX_RECIPIENT, needsGuardian } from "@/lib/domain/policy";
import { assetState, requireAsset } from "@/lib/server/guards";
import { handleRouteError, json, jsonError } from "@/lib/server/http";
import { getOrCreateSessionId } from "@/lib/server/session";
import { recordConsent } from "@/lib/server/store";

// Records the author's decision for one exact asset version and purpose
// (plan section 6, "Separate permissions"). Public featuring isn't offered in
// the prototype, so it can't be granted here either.
export async function POST(request: Request) {
  try {
    const sessionId = await getOrCreateSessionId(request);
    const body = (await request.json().catch(() => null)) ?? {};
    const { asset, story } = requireAsset(sessionId, body.assetId);

    if (body.purpose !== "personal-output" && body.purpose !== "baptize-review") {
      return jsonError(400, "That permission isn't available in this prototype.");
    }
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
      purpose: body.purpose,
      recipient: body.purpose === "baptize-review" ? MOCK_INBOX_RECIPIENT : undefined,
      decision: body.decision,
      guardian: needsGuardian(story) ? "pending" : undefined,
      consentCopyVersion: CONSENT_COPY_VERSION,
    });
    return json(assetState(sessionId, story, asset));
  } catch (err) {
    return handleRouteError(err);
  }
}
