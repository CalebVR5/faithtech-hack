// Shared contract between the three builder lanes (plan sections 7 and 8).
// Capture/review emits story versions; the source and permission lane owns
// consent and authorization; renderers take a RenderSpec and return an Asset.

import type { LanguageId } from "./languages";
import type { Box } from "./face-cover";
import type { TimedWord } from "./timing";

export type AgeGate = "unanswered" | "adult" | "under-18" | "not-sure";

/** The two paths: a baptism story, or a testimony of coming to faith. Chosen before the story starts. */
export type StoryType = "baptism" | "testimony";
export const STORY_TYPES: readonly StoryType[] = ["baptism", "testimony"];

export function isStoryType(value: unknown): value is StoryType {
  return value === "baptism" || value === "testimony";
}

export type NarrationMode = "recorded" | "synthetic" | "none";
export type FootageMode = "original" | "blurred" | "neutral";
/** Option A card, option C narration over a plain background, option B the person's own video. */
export type OutputKind = "card" | "narrated-video" | "captioned-video";

/** What the person wants kept out of the shared output. These are preferences, not a security assessment. */
export interface PrivacyPreferences {
  hideFace: boolean;
  hideVoice: boolean;
  hideName: boolean;
  hideSurroundings: boolean;
  notSure: boolean;
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

/**
 * The recording behind "My recorded voice" or "Video of me". Its words are the
 * author-reviewed transcript of this take, each aligned to when it is heard,
 * so captions follow what is audible even when the take differs from the
 * typed story or script.
 */
export interface NarrationTake {
  /** Converted 48 kHz WAV of the take's sound, for narration over a plain background. */
  audioRef: string;
  /** The original camera recording, kept only for "Video of me". */
  videoRef?: string;
  media: "audio" | "video";
  durationMs: number;
  /** Reviewed sentences, as the author corrected them. */
  segments: Segment[];
  /** Every reviewed word with its time in the recording. Captions are built from these. */
  words: TimedWord[];
  origin: "capture" | "script";
  /** Story version whose text was shown in the script reader, for scripted takes. */
  scriptVersion?: number;
  sttLocale: string;
  provider: string;
}

export interface Story {
  id: string;
  sessionId: string;
  /** Sets the prompts and the label burned into cards and plain-background videos. */
  storyType: StoryType;
  /** The service is for adults; a story only exists once the person answers that they're 18 or older. */
  ageGate: AgeGate;
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
  /** "Video of me" with the face covered: the region blurred in every frame, as fractions of the frame. */
  faceCover?: Box;
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

/** The app's only permission: the storyteller approving an exact version to leave the app as a download. */
export type ConsentPurpose = "personal-output";

/** Held only while the story exists; deleted with it. */
export interface Consent {
  id: string;
  storyId: string;
  assetId: string;
  assetVersion: number;
  purpose: ConsentPurpose;
  decision: "granted" | "declined";
  decidedAt: number;
  consentCopyVersion: string;
  revokedAt?: number;
}
