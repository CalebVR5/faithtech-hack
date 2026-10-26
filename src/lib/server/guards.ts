import "server-only";

import { authorize, captureAllowed } from "@/lib/domain/policy";
import type { Asset, Story } from "@/lib/domain/types";
import { RequestError } from "./http";
import { consentsFor, getOwnedAsset, getOwnedStory } from "./store";

export function requireStory(sessionId: string, storyId: unknown): Story {
  const story = getOwnedStory(sessionId, storyId);
  // Same answer for "missing" and "someone else's": no cross-session probing.
  if (!story) throw new RequestError(404, "not-found", "Not found.");
  return story;
}

/** Story content, recording, transcription and rendering are for adults only. */
export function requireCapture(story: Story): void {
  if (!captureAllowed(story)) {
    throw new RequestError(403, "adults-only", "This service is for adults 18 and older.");
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
 * Everything the preview needs to show what this exact version may do. The
 * decision comes from the same authorize() the export handler calls, so the
 * button and the server can't disagree.
 */
export function assetState(sessionId: string, story: Story, asset: Asset) {
  const consents = consentsFor(story.id);
  return {
    asset: assetView(asset),
    stale: asset.storyVersion !== story.version,
    consents: consents.filter((c) => c.assetId === asset.id && c.assetVersion === asset.version && c.revokedAt === undefined),
    exportDecision: authorize({ sessionId, story, asset, consents }),
  };
}
export type AssetState = ReturnType<typeof assetState>;
