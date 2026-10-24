// The single authorization function for export and submission (plan section 7,
// "State and authorization"). Call it from server handlers, not just the UI.
// Pure and side-effect free so it can also drive button states client-side.

import type { Asset, Consent, ConsentPurpose, Story } from "./types";

export type Action = "export" | "submit-mock-inbox";

export const MOCK_INBOX_RECIPIENT = "baptize-demo-inbox";

/** Recorded with every consent. Bump when approval or inbox wording in the locale files changes. */
export const CONSENT_COPY_VERSION = "2026-10-24.1";

export type Decision = { ok: true } | { ok: false; code: DenialCode; reason: string };

export type DenialCode =
  | "wrong-session"
  | "age-unanswered"
  | "asset-not-ready"
  | "asset-stale"
  | "needs-approval"
  | "needs-guardian"
  | "guardian-declined"
  | "needs-inbox-consent";

export interface PolicyContext {
  sessionId: string;
  story: Story;
  asset: Asset;
  consents: Consent[];
}

function deny(code: DenialCode, reason: string): Decision {
  return { ok: false, code, reason };
}

/** Consents that apply to this exact asset version and have not been revoked. */
function activeConsent(ctx: PolicyContext, purpose: ConsentPurpose, recipient?: string): Consent | undefined {
  return ctx.consents.find(
    (c) =>
      c.storyId === ctx.story.id &&
      c.assetId === ctx.asset.id &&
      c.assetVersion === ctx.asset.version &&
      c.purpose === purpose &&
      c.revokedAt === undefined &&
      (recipient === undefined || c.recipient === recipient),
  );
}

export function needsGuardian(story: Pick<Story, "ageGate">): boolean {
  // "Not sure" follows the guardian-needed path (plan section 3).
  return story.ageGate === "under-18" || story.ageGate === "not-sure";
}

function checkPurpose(ctx: PolicyContext, purpose: ConsentPurpose, recipient?: string): Decision {
  const consent = activeConsent(ctx, purpose, recipient);
  if (!consent || consent.decision !== "granted") {
    return purpose === "personal-output"
      ? deny("needs-approval", "This version needs your approval before it can leave the app.")
      : deny("needs-inbox-consent", "Sending to the demo inbox needs its own permission.");
  }
  if (needsGuardian(ctx.story)) {
    if (consent.guardian === "declined") return deny("guardian-declined", "A guardian declined this version.");
    if (consent.guardian !== "approved-in-simulation") {
      return deny("needs-guardian", "Guardian approval is still needed.");
    }
  }
  return { ok: true };
}

export function authorize(action: Action, ctx: PolicyContext): Decision {
  if (ctx.story.sessionId !== ctx.sessionId || ctx.asset.storyId !== ctx.story.id) {
    return deny("wrong-session", "Not found.");
  }
  if (ctx.story.ageGate === "unanswered") {
    return deny("age-unanswered", "Please answer the age question first.");
  }
  if (ctx.asset.status !== "rendered") {
    return deny("asset-not-ready", "This version hasn't finished rendering.");
  }
  if (ctx.asset.storyVersion !== ctx.story.version) {
    return deny("asset-stale", "Your story changed after this version was made. Please review the new version.");
  }

  const personal = checkPurpose(ctx, "personal-output");
  if (!personal.ok || action === "export") return personal;

  // submit-mock-inbox: personal approval is necessary but never sufficient.
  return checkPurpose(ctx, "baptize-review", MOCK_INBOX_RECIPIENT);
}

/** Recording, story content, export and submission stay disabled until the age gate allows them. */
export function captureAllowed(story: Pick<Story, "ageGate" | "guardianCapture">): boolean {
  if (story.ageGate === "adult") return true;
  if (story.ageGate === "unanswered") return false;
  return story.guardianCapture === "approved-in-simulation";
}
