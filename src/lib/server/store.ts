import "server-only";

import { randomUUID } from "node:crypto";
import type { Asset, Consent, ConsentPurpose, GuardianState, MockSubmission, Segment, Story } from "@/lib/domain/types";
import { deleteFile } from "./temp-store";

// In-memory records for a single-process demo (plan section 7, "Prototype
// hosting and storage"). Everything resets when the server restarts, and the
// UI and privacy page say so. Swap for a shared store before running more than
// one process.

/** Stories older than the session cookie are dropped. */
const STORY_TTL_MS = 12 * 60 * 60 * 1000;

export interface InboxEntry {
  submission: MockSubmission;
  /** Copy of the approved asset only. Raw recordings and the full story never go to the inbox. */
  file: Buffer;
  mimeType: string;
  kind: Asset["spec"]["kind"];
  /** Words visible or audible in the asset, for accessibility. */
  assetText: string;
  language: string;
  machineTranslated: boolean;
  narration: Asset["spec"]["narration"];
  guardianRequired: boolean;
}

interface SynthCacheEntry {
  audioRef: string;
  durationMs: number;
  segments: Segment[];
  voice: string;
  provider: string;
}

interface Db {
  stories: Map<string, Story>;
  assets: Map<string, Asset>;
  consents: Consent[];
  inbox: Map<string, InboxEntry>;
  synthCache: Map<string, SynthCacheEntry>;
  inboxTokens: Set<string>;
}

const g = globalThis as unknown as { __testimonyDb?: Db };
export const db: Db = (g.__testimonyDb ??= {
  stories: new Map(),
  assets: new Map(),
  consents: [],
  inbox: new Map(),
  synthCache: new Map(),
  inboxTokens: new Set(),
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
      c.recipient === input.recipient &&
      c.revokedAt === undefined
    ) {
      c.revokedAt = Date.now();
    }
  }
  const consent: Consent = { ...input, id: newId(), decidedAt: Date.now() };
  db.consents.push(consent);
  return consent;
}

export function setGuardianDecision(
  assetId: string,
  assetVersion: number,
  purpose: ConsentPurpose,
  decision: GuardianState,
): Consent | null {
  const consent = db.consents.find(
    (c) =>
      c.assetId === assetId &&
      c.assetVersion === assetVersion &&
      c.purpose === purpose &&
      c.decision === "granted" &&
      c.revokedAt === undefined,
  );
  if (!consent) return null;
  consent.guardian = decision;
  return consent;
}

export function submissionsFor(storyId: string): MockSubmission[] {
  return [...db.inbox.values()].map((e) => e.submission).filter((s) => s.storyId === storyId);
}

export function withdrawSubmission(entry: InboxEntry): void {
  entry.submission.state = "withdrawn";
  entry.submission.withdrawnAt = Date.now();
  // Withdrawal removes the copy the app controls; it can't recall downloads.
  entry.file = Buffer.alloc(0);
  entry.assetText = "";
}

/** Removes everything the app controls for a story. Downloads and shares already made can't be recalled. */
export async function deleteStory(storyId: string): Promise<void> {
  const story = db.stories.get(storyId);
  if (!story) return;
  const refs = new Set<string>();
  if (story.take) refs.add(story.take.audioRef);
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
  const now = Date.now();
  for (const c of db.consents) if (c.storyId === storyId && c.revokedAt === undefined) c.revokedAt = now;
  for (const entry of db.inbox.values()) {
    if (entry.submission.storyId === storyId && entry.submission.state !== "withdrawn") withdrawSubmission(entry);
  }
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

export function synthCacheKey(storyId: string, language: string, voice: string, text: string): string {
  return `${storyId}:${language}:${voice}:${text}`;
}

export function getSynthCache(key: string): SynthCacheEntry | undefined {
  return db.synthCache.get(key);
}

export function putSynthCache(key: string, entry: SynthCacheEntry): void {
  db.synthCache.set(key, entry);
}
