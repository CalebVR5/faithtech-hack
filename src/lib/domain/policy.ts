// The single authorization function for export (plan section 7, "State and
// authorization"). Call it from server handlers, not just the UI. Pure and
// side-effect free so it can also drive button states client-side.

import type { Asset, Consent, Story } from "./types";

/** Recorded with every approval. Bump when approval wording in the locale files changes. */
export const CONSENT_COPY_VERSION = "2026-10-25.1";

export type Decision = { ok: true } | { ok: false; code: DenialCode; reason: string };

export type DenialCode = "wrong-session" | "adults-only" | "asset-not-ready" | "asset-stale" | "needs-approval";

export interface PolicyContext {
  sessionId: string;
  story: Story;
  asset: Asset;
  consents: Consent[];
}

function deny(code: DenialCode, reason: string): Decision {
  return { ok: false, code, reason };
}

/** May this exact version leave the app as a download? */
export function authorize(ctx: PolicyContext): Decision {
  if (ctx.story.sessionId !== ctx.sessionId || ctx.asset.storyId !== ctx.story.id) {
    return deny("wrong-session", "Not found.");
  }
  if (!captureAllowed(ctx.story)) {
    return deny("adults-only", "This service is for adults 18 and older.");
  }
  if (ctx.asset.status !== "rendered") {
    return deny("asset-not-ready", "This version hasn't finished rendering.");
  }
  if (ctx.asset.storyVersion !== ctx.story.version) {
    return deny("asset-stale", "Your story changed after this version was made. Please review the new version.");
  }
  // Approval names this exact asset version; any re-render needs a new one.
  const approval = ctx.consents.find(
    (c) =>
      c.storyId === ctx.story.id &&
      c.assetId === ctx.asset.id &&
      c.assetVersion === ctx.asset.version &&
      c.purpose === "personal-output" &&
      c.revokedAt === undefined,
  );
  if (!approval || approval.decision !== "granted") {
    return deny("needs-approval", "This version needs your approval before it can leave the app.");
  }
  return { ok: true };
}

/**
 * The service is for adults only. Stories can't be created otherwise, and this
 * check keeps every content and export route closed to anything else.
 */
export function captureAllowed(story: Pick<Story, "ageGate">): boolean {
  return story.ageGate === "adult";
}
