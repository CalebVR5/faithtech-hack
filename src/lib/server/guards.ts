import "server-only";

import { authorize, captureAllowed, needsGuardian } from "@/lib/domain/policy";
import type { Asset, Story } from "@/lib/domain/types";
import { RequestError } from "./http";
import { consentsFor, getOwnedAsset, getOwnedStory, submissionsFor } from "./store";

export function requireStory(sessionId: string, storyId: unknown): Story {
  const story = getOwnedStory(sessionId, storyId);
  // Same answer for "missing" and "someone else's": no cross-session probing.
  if (!story) throw new RequestError(404, "not-found", "Not found.");
  return story;
}

/** Story content, recording, transcription and rendering wait for the age gate (plan section 3). */
export function requireCapture(story: Story): void {
  if (!captureAllowed(story)) {
    throw new RequestError(403, "capture-blocked", "Guardian approval is needed before a story can be recorded or written here.");
  }
}

export function requireAsset(sessionId: string, assetId: unknown): { asset: Asset; story: Story } {
  const found = getOwnedAsset(sessionId, assetId);
  if (!found) throw new RequestError(404, "not-found", "Not found.");
  return found;
}

export type AssetView = Omit<Asset, "fileRef"> & { previewUrl?: string };

/** Asset fields safe for the owner's browser; the private file reference stays on the server. */
export function assetView(asset: Asset): AssetView {
  const view: Partial<Asset> = { ...asset };
  delete view.fileRef;
  return {
    ...(view as Omit<Asset, "fileRef">),
    previewUrl: asset.status === "rendered" ? `/api/assets/${asset.id}?v=${asset.version}` : undefined,
  };
}

/**
 * Everything the share screen needs to show what this exact version may do.
 * Decisions come from the same authorize() the export and submission
 * handlers call, so the buttons and the server can't disagree.
 */
export function assetState(sessionId: string, story: Story, asset: Asset) {
  const consents = consentsFor(story.id);
  const ctx = { sessionId, story, asset, consents };
  return {
    asset: assetView(asset),
    stale: asset.storyVersion !== story.version,
    needsGuardian: needsGuardian(story),
    consents: consents.filter((c) => c.assetId === asset.id && c.assetVersion === asset.version && c.revokedAt === undefined),
    exportDecision: authorize("export", ctx),
    submitDecision: authorize("submit-mock-inbox", ctx),
    submissions: submissionsFor(story.id).filter((s) => s.assetId === asset.id),
  };
}
export type AssetState = ReturnType<typeof assetState>;
