import { authorize, needsGuardian } from "@/lib/domain/policy";
import type { MockSubmission } from "@/lib/domain/types";
import { assetState, requireAsset } from "@/lib/server/guards";
import { handleRouteError, json, jsonError } from "@/lib/server/http";
import { getOrCreateSessionId } from "@/lib/server/session";
import { consentsFor, db, newId } from "@/lib/server/store";
import { getFile } from "@/lib/server/temp-store";

// Sends one approved asset to the clearly marked demo inbox. Nothing reaches
// Baptize. Needs its own inbox consent on top of personal approval, and an
// idempotency key so a repeated click makes one submission (plan section 9).
export async function POST(request: Request) {
  try {
    const sessionId = await getOrCreateSessionId(request);
    const body = (await request.json().catch(() => null)) ?? {};
    const { asset, story } = requireAsset(sessionId, body.assetId);
    const key = typeof body.idempotencyKey === "string" ? body.idempotencyKey.slice(0, 64) : "";
    if (!key) return jsonError(400, "Missing idempotency key.");

    const existing = [...db.inbox.values()].find(
      (e) => e.submission.idempotencyKey === key && e.submission.storyId === story.id,
    );
    if (existing) return json(assetState(sessionId, story, asset));

    const decision = authorize("submit-mock-inbox", { sessionId, story, asset, consents: consentsFor(story.id) });
    if (!decision.ok) return jsonError(403, decision.reason, decision.code);

    const file = asset.fileRef ? await getFile(sessionId, asset.fileRef) : null;
    if (!file) return jsonError(410, "This version has expired. Please make it again.", "preview-expired");

    const submission: MockSubmission = {
      id: newId(),
      storyId: story.id,
      assetId: asset.id,
      assetVersion: asset.version,
      // Review only. Public featuring is a separate permission the prototype doesn't offer.
      scopes: ["baptize-review"],
      state: "pending",
      idempotencyKey: key,
      mock: true,
      createdAt: Date.now(),
    };
    db.inbox.set(submission.id, {
      submission,
      file: Buffer.from(file.data),
      mimeType: file.record.mimeType,
      kind: asset.spec.kind,
      assetText: asset.spec.kind === "card" ? (asset.spec.cardText ?? "") : asset.spec.captions.map((c) => c.text).join(" "),
      language: asset.spec.captionLanguage,
      machineTranslated: asset.spec.machineTranslated,
      narration: asset.spec.narration,
      guardianRequired: needsGuardian(story),
    });
    return json(assetState(sessionId, story, asset), 201);
  } catch (err) {
    return handleRouteError(err);
  }
}
