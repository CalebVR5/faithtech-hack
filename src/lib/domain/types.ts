// Shared contract between the three builder lanes (plan sections 7 and 8).
// Capture/review emits story versions; the source and permission lane owns
// consent and authorization; renderers take a RenderSpec and return an Asset.

import type { LanguageId } from "./languages";

export type AgeGate = "unanswered" | "adult" | "under-18" | "not-sure";

export type NarrationMode = "recorded" | "synthetic" | "none";
export type FootageMode = "original" | "blurred" | "neutral";
/** Implemented renderers. "captioned-video" (option B) is planned but not built. */
export type OutputKind = "card" | "narrated-video";

/** What the person wants kept out of the shared output. These are preferences, not a security assessment. */
export interface PrivacyPreferences {
  hideFace: boolean;
  hideVoice: boolean;
  hideName: boolean;
  hideSurroundings: boolean;
  notSure: boolean;
}

export type GuardianState = "pending" | "approved-in-simulation" | "declined";

/** A time-coded span of text. Times are relative to the audio the span belongs to. */
export interface Segment {
  text: string;
  startMs: number;
  endMs: number;
}

export interface TranscriptWord {
  text: string;
  startMs: number;
  endMs: number;
  confidence?: number;
  /** Low-confidence words stay marked for the author; the system never guesses names, places or Scripture. */
  uncertain: boolean;
}

export interface Transcript {
  text: string;
  segments: Segment[];
  words: TranscriptWord[];
  locale: string;
  provider: string;
  model: string;
}

/**
 * The recording used for "My recorded voice" narration. Its segments are the
 * author-reviewed transcript of this take, so captions follow what is audible
 * even when the take differs from the typed story or script.
 */
export interface NarrationTake {
  audioRef: string;
  durationMs: number;
  segments: Segment[];
  origin: "capture" | "script";
  /** Story version whose text was shown in the script reader, for scripted takes. */
  scriptVersion?: number;
  sttLocale: string;
  provider: string;
}

export interface Story {
  id: string;
  /** True for fabricated fixtures. The prototype accepts no real testimony. */
  fixture: boolean;
  sessionId: string;
  ageGate: AgeGate;
  /**
   * Simulated guardian decision that unlocks capture for "under-18" and
   * "not-sure". A test scenario only, never guardianship verification.
   */
  guardianCapture: GuardianState | "not-needed";
  interfaceLanguage: LanguageId;
  sourceLanguage: LanguageId;
  privacy: PrivacyPreferences;
  displayName?: string;
  sourceKind: "text" | "audio";
  /** Author-reviewed text. This is the canonical story every output derives from. */
  reviewedText: string;
  take?: NarrationTake;
  /** Increments on every edit to reviewed text, take, name or source language. */
  version: number;
  createdAt: number;
}

export interface SynthesisResult {
  audioRef: string;
  mimeType: string;
  durationMs: number;
  /** Caption timing matched to the synthetic audio, one segment per sentence. */
  segments: Segment[];
  language: LanguageId;
  voice: string;
  provider: string;
}

/** The versioned input a renderer receives. Renderers never see consent state. */
export interface RenderSpec {
  storyId: string;
  storyVersion: number;
  kind: OutputKind;
  layoutVersion: string;
  /** Approved text spans as [start, end) character offsets into the reviewed source. */
  selectedSpans: Array<[number, number]>;
  /** True when the selection is shorter than the whole story; the output says "excerpt". */
  excerpt: boolean;
  /** Exact words on a card, after any translation. */
  cardText?: string;
  narration: NarrationMode;
  narrationLanguage: LanguageId;
  narrationVoice?: string;
  audioRef?: string;
  captionLanguage: LanguageId;
  captions: Segment[];
  /** Card text or captions came from machine translation and were not independently reviewed. */
  machineTranslated: boolean;
  footage: FootageMode;
  showStoryLabel: boolean;
  displayName?: string;
}

export type AssetStatus = "rendered" | "failed";

export interface Asset {
  id: string;
  storyId: string;
  /** Story version the asset was rendered from. A newer story version makes the asset stale. */
  storyVersion: number;
  /** Increments whenever anything visible or audible changes; approval is tied to this. */
  version: number;
  spec: RenderSpec;
  status: AssetStatus;
  mimeType?: string;
  fileRef?: string;
  fileHash?: string;
  durationMs?: number;
  error?: string;
  renderedAt: number;
}

export type ConsentPurpose = "personal-output" | "baptize-review" | "public-featuring";

export interface Consent {
  id: string;
  storyId: string;
  assetId: string;
  assetVersion: number;
  purpose: ConsentPurpose;
  /** Named recipient or audience, for example "baptize-demo-inbox". */
  recipient?: string;
  decision: "granted" | "declined";
  /** Required when the story's age gate is not "adult". */
  guardian?: GuardianState;
  decidedAt: number;
  consentCopyVersion: string;
  revokedAt?: number;
}

export interface MockSubmission {
  id: string;
  storyId: string;
  assetId: string;
  assetVersion: number;
  scopes: ConsentPurpose[];
  state: "pending" | "withdrawn";
  idempotencyKey: string;
  mock: true;
  createdAt: number;
  withdrawnAt?: number;
}
