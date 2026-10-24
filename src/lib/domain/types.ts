// Shared contract between the three builder lanes (plan sections 7 and 8).
// Capture/review emits story versions; the source and permission lane owns
// consent and authorization; renderers take a RenderSpec and return an Asset.

import type { LanguageId } from "./languages";

export type AgeGate = "unanswered" | "adult" | "under-18" | "not-sure";

export type NarrationMode = "recorded" | "synthetic" | "none";
export type FootageMode = "original" | "blurred" | "neutral";
export type OutputKind = "card" | "captioned-video" | "narrated-video";

/** What the person wants kept out of the shared output. These are preferences, not a security assessment. */
export interface PrivacyPreferences {
  hideFace: boolean;
  hideVoice: boolean;
  hideName: boolean;
  hideSurroundings: boolean;
  notSure: boolean;
}

export interface Story {
  id: string;
  /** True for fabricated fixtures. The prototype accepts no real testimony. */
  fixture: boolean;
  sessionId: string;
  ageGate: AgeGate;
  interfaceLanguage: LanguageId;
  sourceLanguage: LanguageId;
  captionLanguage: LanguageId;
  privacy: PrivacyPreferences;
  displayName?: string;
  /** Increments on every edit to reviewed text or story settings. */
  version: number;
}

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

export interface Source {
  id: string;
  storyId: string;
  mediaType: "text" | "audio" | "video";
  /** Private temp-store reference; absent for typed stories. */
  mediaRef?: string;
  sttLocale?: string;
  originalTranscript?: Transcript;
  /** Author-reviewed text. This becomes the canonical story. */
  reviewedText: string;
  storyVersion: number;
  expiresAt?: number;
}

export interface Translation {
  id: string;
  sourceId: string;
  storyVersion: number;
  from: LanguageId;
  to: LanguageId;
  provider: string;
  segments: string[];
  machineGenerated: true;
  /** Human language review is deferred (revision 4). Always "not-reviewed" in the prototype. */
  reviewStatus: "not-reviewed";
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
  narration: NarrationMode;
  narrationLanguage: LanguageId;
  narrationVoice?: string;
  audioRef?: string;
  captionLanguage: LanguageId;
  captions: Segment[];
  captionsMachineTranslated: boolean;
  footage: FootageMode;
  displayName?: string;
}

export type AssetStatus = "pending" | "rendering" | "rendered" | "failed";

export interface Asset {
  id: string;
  storyId: string;
  /** Story version the asset was rendered from. A newer story version makes the asset stale. */
  storyVersion: number;
  /** Increments whenever anything visible or audible changes; approval is tied to this. */
  version: number;
  spec: RenderSpec;
  status: AssetStatus;
  fileRef?: string;
  fileHash?: string;
  error?: string;
}

export type ConsentPurpose =
  | "personal-output"
  | "baptize-review"
  | "public-featuring";

export type GuardianState = "pending" | "approved-in-simulation" | "declined";

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
  assetId: string;
  assetVersion: number;
  scopes: ConsentPurpose[];
  state: "pending" | "withdrawn";
  idempotencyKey: string;
  mock: true;
  createdAt: number;
}

export type JobState = "pending" | "running" | "failed" | "complete";

export interface RenderJob {
  id: string;
  sessionId: string;
  assetId: string;
  assetVersion: number;
  kind: OutputKind;
  state: JobState;
  error?: string;
  expiresAt: number;
}
