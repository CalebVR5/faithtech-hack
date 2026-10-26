import "server-only";

import { randomUUID } from "node:crypto";
import type { TimedWord } from "@/lib/domain/timing";
import type { Asset, Consent, Story } from "@/lib/domain/types";
import { STORY_TTL_MS } from "@/lib/domain/limits";
import { deleteFile, ownsFile } from "./temp-store";

// Working memory for stories in progress, never a database. Nothing is kept
// for later: a story and everything made from it are deleted as soon as the
// finished file is downloaded, when the person deletes it, or at the latest
// STORY_TTL_MS after it started. It also all disappears if the server
// restarts. One server instance holds a story, so deploy with session
// affinity (or a single instance) rather than adding shared storage.

export { STORY_TTL_MS };

interface SynthCacheEntry {
  audioRef: string;
  durationMs: number;
  words: TimedWord[];
  voice: string;
  provider: string;
}

/**
 * What the speech service heard in a kept recording, with word times. Held
 * on the server so a reviewed transcript is always aligned against the real
 * recording, never against timings sent by the browser.
 */
export interface HeardTake {
  sessionId: string;
  words: TimedWord[];
  durationMs: number;
  media: "audio" | "video";
  videoRef?: string;
  sttLocale: string;
  provider: string;
}

interface Db {
  stories: Map<string, Story>;
  assets: Map<string, Asset>;
  consents: Consent[];
  synthCache: Map<string, SynthCacheEntry>;
  /** Keyed by the take's audioRef. */
  heard: Map<string, HeardTake>;
}

const g = globalThis as unknown as { __testimonyDb?: Db };
export const db: Db = (g.__testimonyDb ??= {
  stories: new Map(),
  assets: new Map(),
  consents: [],
  synthCache: new Map(),
  heard: new Map(),
});

export function newId(): string {
  return randomUUID();
}

export function sweepStories(now = Date.now()): void {
  for (const story of db.stories.values()) {
    if (now - story.createdAt > STORY_TTL_MS) void deleteStory(story.id);
  }
}

/** Returns the story only to the session that owns it. */
export function getOwnedStory(sessionId: string, id: unknown): Story | null {
  if (typeof id !== "string") return null;
  const story = db.stories.get(id);
  return story && story.sessionId === sessionId ? story : null;
}

export function getOwnedAsset(sessionId: string, id: unknown): { asset: Asset; story: Story } | null {
  if (typeof id !== "string") return null;
  const asset = db.assets.get(id);
  const story = asset ? getOwnedStory(sessionId, asset.storyId) : null;
  return asset && story ? { asset, story } : null;
}

/** One asset per story and format; each render bumps its version, which voids earlier approvals. */
export function assetIdFor(storyId: string, kind: Asset["spec"]["kind"]): string | undefined {
  for (const a of db.assets.values()) if (a.storyId === storyId && a.spec.kind === kind) return a.id;
  return undefined;
}

export function consentsFor(storyId: string): Consent[] {
  return db.consents.filter((c) => c.storyId === storyId);
}

export function recordConsent(input: Omit<Consent, "id" | "decidedAt">): Consent {
  // A newer decision for the same asset version and purpose replaces the older one.
  for (const c of db.consents) {
    if (
      c.assetId === input.assetId &&
      c.assetVersion === input.assetVersion &&
      c.purpose === input.purpose &&
      c.revokedAt === undefined
    ) {
      c.revokedAt = Date.now();
    }
  }
  const consent: Consent = { ...input, id: newId(), decidedAt: Date.now() };
  db.consents.push(consent);
  return consent;
}

/** Removes everything the app holds for a story. Downloads and shares already made can't be recalled. */
export async function deleteStory(storyId: string): Promise<void> {
  const story = db.stories.get(storyId);
  if (!story) return;
  const refs = new Set<string>();
  if (story.take) {
    refs.add(story.take.audioRef);
    if (story.take.videoRef) refs.add(story.take.videoRef);
  }

  for (const asset of [...db.assets.values()].filter((a) => a.storyId === storyId)) {
    if (asset.fileRef) refs.add(asset.fileRef);
    if (asset.spec.audioRef) refs.add(asset.spec.audioRef);
    db.assets.delete(asset.id);
  }
  for (const [key, entry] of db.synthCache) {
    if (key.startsWith(`${storyId}:`)) {
      refs.add(entry.audioRef);
      db.synthCache.delete(key);
    }
  }
  for (const ref of refs) db.heard.delete(ref);
  // Approvals go too: nothing about the story is kept once it's gone.
  db.consents = db.consents.filter((c) => c.storyId !== storyId);
  db.stories.delete(storyId);
  await Promise.all([...refs].map((id) => deleteFile(id).catch(() => undefined)));
}

export type StoryView = Omit<Story, "sessionId">;

/** Story fields safe to send to the owner's browser. */
export function storyView(story: Story): StoryView {
  const view: Partial<Story> = { ...story };
  delete view.sessionId;
  return view as StoryView;
}

/** Keeps what was heard in a recording, and drops entries whose recording has expired. */
export function rememberHeard(audioRef: string, heard: HeardTake): void {
  for (const [ref, h] of db.heard) if (!ownsFile(h.sessionId, ref)) db.heard.delete(ref);
  db.heard.set(audioRef, heard);
}

/** What was heard in this session's recording, or null if it expired or isn't theirs. */
export function heardFor(sessionId: string, audioRef: unknown): HeardTake | null {
  if (typeof audioRef !== "string") return null;
  const heard = db.heard.get(audioRef);
  return heard && heard.sessionId === sessionId && ownsFile(sessionId, audioRef) ? heard : null;
}

export function synthCacheKey(storyId: string, language: string, voice: string, text: string): string {
  return `${storyId}:${language}:${voice}:${text}`;
}

export function getSynthCache(key: string): SynthCacheEntry | undefined {
  return db.synthCache.get(key);
}

export function putSynthCache(key: string, entry: SynthCacheEntry): void {
  db.synthCache.set(key, entry);
}
