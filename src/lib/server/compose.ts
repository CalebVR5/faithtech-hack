import "server-only";

import { createHash } from "node:crypto";
import { withTexts } from "@/lib/domain/captions";
import type { Box } from "@/lib/domain/face-cover";
import { buildSlides, paceWords, type TimedWord } from "@/lib/domain/timing";
import { LANGUAGES, type LanguageId } from "@/lib/domain/languages";
import { CARD_MAX_CHARS, CARD_MAX_TRANSLATED_CHARS, MAX_RENDER_SECONDS } from "@/lib/domain/limits";
import { OUTPUT_LABELS } from "@/lib/domain/output-labels";
import type { Asset, NarrationMode, OutputKind, RenderSpec, Story } from "@/lib/domain/types";
import { getLanguageProvider } from "@/lib/providers";
import { LAYOUT_VERSION } from "@/lib/render/ass";
import { RequestError } from "./http";
import { renderCardPng, renderFaceMp4, renderNarratedMp4 } from "./render";
import { assetIdFor, db, getSynthCache, newId, putSynthCache, synthCacheKey } from "./store";
import { deleteFile, getFile, putFile } from "./temp-store";
import { reserve } from "./usage";

// Turns the server's own story record plus the author's output choices into a
// RenderSpec and a rendered file. The browser sends choices, never captions or
// audio, so every output derives from the approved source (plan section 7).

export interface RenderChoices {
  kind: OutputKind;
  narration: NarrationMode;
  outputLanguage: LanguageId;
  showName: boolean;
  showStoryLabel: boolean;
  /** [start, end) into the reviewed text; whole story when omitted. */
  span?: [number, number];
  /** "Video of me" only: the region to blur in every frame. */
  faceCover?: Box;
  cloud: { translation: boolean; narration: boolean };
}

interface Rendered {
  file: Buffer;
  mimeType: string;
  durationMs?: number;
  spec: RenderSpec;
}

function selectSpan(text: string, span?: [number, number]): { start: number; end: number; words: string } {
  let [start, end] = span ?? [0, text.length];
  if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || end > text.length || start >= end) {
    [start, end] = [0, text.length];
  }
  const words = text.slice(start, end).trim();
  if (!words) throw new RequestError(400, "empty-selection", "Choose some words from your story first.");
  return { start, end, words };
}

async function translateAll(texts: string[], from: LanguageId, to: LanguageId): Promise<string[]> {
  const provider = getLanguageProvider();
  if (provider.name !== "mock") reserve("translateChars", texts.reduce((n, t) => n + t.length, 0));
  return provider.translate({ segments: texts, from, to });
}

async function synthesizeCached(sessionId: string, story: Story, text: string) {
  const provider = getLanguageProvider();
  const voice = provider.name === "mock" ? "mock-tone" : LANGUAGES[story.sourceLanguage].ttsVoice;
  // Reuse audio only when text, voice and language all match (plan section 7).
  const key = synthCacheKey(story.id, story.sourceLanguage, voice, text);
  const cached = getSynthCache(key);
  if (cached) {
    const file = await getFile(sessionId, cached.audioRef);
    if (file) return { ...cached, audio: file.data };
  }
  if (provider.name !== "mock") reserve("ttsChars", text.length);
  const out = await provider.synthesize({ text, language: story.sourceLanguage });
  const stored = await putFile(sessionId, out.audio, out.mimeType);
  const entry = { audioRef: stored.id, durationMs: out.durationMs, words: out.words, voice: out.voice, provider: provider.name };
  putSynthCache(key, entry);
  return { ...entry, audio: out.audio };
}

async function compose(sessionId: string, story: Story, choices: RenderChoices): Promise<Rendered> {
  const text = story.reviewedText;
  if (!text.trim()) throw new RequestError(400, "empty-story", "Your story is empty.");

  const translated = choices.outputLanguage !== story.sourceLanguage;
  if (translated && !choices.cloud.translation) {
    throw new RequestError(403, "translation-consent-needed", "Translation needs your permission to send your words to the translation service.");
  }
  const labels = OUTPUT_LABELS[choices.outputLanguage];
  const storyTypeLabel = labels.storyLabel[story.storyType];
  const displayName = choices.showName && story.displayName ? story.displayName : undefined;
  const base = {
    storyId: story.id,
    storyVersion: story.version,
    layoutVersion: LAYOUT_VERSION,
    narrationLanguage: story.sourceLanguage,
    captionLanguage: choices.outputLanguage,
    machineTranslated: translated,
    footage: "neutral" as const,
    showStoryLabel: choices.showStoryLabel,
    displayName,
  };

  if (choices.kind === "card") {
    const sel = selectSpan(text, choices.span);
    if (sel.words.length > CARD_MAX_CHARS) {
      throw new RequestError(422, "passage-too-long", `A card fits up to ${CARD_MAX_CHARS} characters. Choose a shorter passage; your full story can go with it as text.`);
    }
    const cardText = translated ? (await translateAll([sel.words], story.sourceLanguage, choices.outputLanguage))[0] : sel.words;
    if (cardText.length > CARD_MAX_TRANSLATED_CHARS) {
      throw new RequestError(422, "translation-too-long", "The translation is too long for the card. Choose a shorter passage.");
    }
    const excerpt = sel.words !== text.trim();
    const storyLabel = choices.showStoryLabel
      ? excerpt ? `${storyTypeLabel} · ${labels.excerpt}` : storyTypeLabel
      : excerpt ? labels.excerpt : undefined;
    const file = await renderCardPng({
      text: cardText,
      storyLabel,
      displayName,
      notes: [translated && labels.machineTranslated].filter((n): n is string => Boolean(n)),
    });
    return {
      file,
      mimeType: "image/png",
      spec: { ...base, kind: "card", selectedSpans: [[sel.start, sel.end]], excerpt, cardText, narration: "none", captions: [] },
    };
  }

  // Videos (options B and C). Captions are built from words timed against the
  // audio actually used, so each slide appears as its first word is spoken.
  const locale = LANGUAGES[story.sourceLanguage].uiLocale;
  let words: TimedWord[];
  let durationMs: number;
  let audio: Buffer | undefined;
  let audioRef: string | undefined;
  let video: Buffer | undefined;
  let narrationVoice: string | undefined;
  let selectedSpans: Array<[number, number]>;
  let excerpt: boolean;
  const narration: NarrationMode = choices.kind === "captioned-video" ? "recorded" : choices.narration;

  if (choices.kind === "captioned-video") {
    const take = story.take;
    if (!take?.videoRef) throw new RequestError(409, "no-video", "Record a video of yourself first.");
    const file = await getFile(sessionId, take.videoRef);
    if (!file) throw new RequestError(410, "take-expired", "Your video has expired. Please record it again.");
    // Captions follow the reviewed transcript of what was actually said.
    video = file.data;
    words = take.words;
    durationMs = take.durationMs;
    selectedSpans = [];
    excerpt = false;
  } else if (narration === "recorded") {
    const take = story.take;
    if (!take) throw new RequestError(409, "no-take", "Record your story in your own voice first.");
    const file = await getFile(sessionId, take.audioRef);
    if (!file) throw new RequestError(410, "take-expired", "Your recording has expired. Please record it again.");
    words = take.words;
    durationMs = take.durationMs;
    audio = file.data;
    audioRef = take.audioRef;
    selectedSpans = [];
    excerpt = false;
  } else {
    const sel = selectSpan(text, choices.span);
    selectedSpans = [[sel.start, sel.end]];
    excerpt = sel.words !== text.trim();
    if (narration === "synthetic") {
      if (!choices.cloud.narration) {
        throw new RequestError(403, "narration-consent-needed", "A synthetic voice needs your permission to send your words to the speech service.");
      }
      const synth = await synthesizeCached(sessionId, story, sel.words);
      words = synth.words;
      durationMs = synth.durationMs;
      audio = synth.audio;
      audioRef = synth.audioRef;
      narrationVoice = synth.voice;
    } else {
      ({ words, durationMs } = paceWords(sel.words, locale));
    }
  }

  if (durationMs > MAX_RENDER_SECONDS * 1000) {
    throw new RequestError(422, "video-too-long", `Videos can be up to ${MAX_RENDER_SECONDS} seconds. Choose a shorter passage.`);
  }
  let captions = buildSlides(words, locale, durationMs);
  if (translated) {
    // Each slide is a whole thought, so it translates as one; it keeps its timing.
    captions = withTexts(captions, await translateAll(captions.map((c) => c.text), story.sourceLanguage, choices.outputLanguage));
  }
  const layout = {
    durationMs,
    captions,
    storyLabel: choices.showStoryLabel ? storyTypeLabel : undefined,
    displayName,
    notes: [
      narration === "synthetic" && labels.synthetic,
      translated && labels.machineTranslated,
    ].filter((n): n is string => Boolean(n)),
  };
  const faceCover = video ? choices.faceCover : undefined;
  // A failed cover is an error, never a fallback to the uncovered video.
  const file = video ? await renderFaceMp4({ ...layout, video, faceCover }) : await renderNarratedMp4({ ...layout, audio });
  return {
    file,
    mimeType: "video/mp4",
    durationMs,
    spec: {
      ...base,
      kind: choices.kind,
      selectedSpans,
      excerpt,
      narration,
      narrationVoice,
      audioRef,
      captions,
      footage: video ? (faceCover ? "blurred" : "original") : "neutral",
      faceCover,
    },
  };
}

/**
 * Renders a new version of the story's asset for this format. Any new
 * render, including a failed one, replaces the previous version, so earlier
 * approvals stop applying. A failure never falls back to a different output.
 */
export async function renderAsset(sessionId: string, story: Story, choices: RenderChoices): Promise<Asset> {
  const id = assetIdFor(story.id, choices.kind) ?? newId();
  const previous = db.assets.get(id);
  if (previous?.fileRef) await deleteFile(previous.fileRef).catch(() => undefined);
  const version = (previous?.version ?? 0) + 1;

  try {
    const out = await compose(sessionId, story, choices);
    const stored = await putFile(sessionId, out.file, out.mimeType);
    const asset: Asset = {
      id,
      storyId: story.id,
      storyVersion: story.version,
      version,
      spec: out.spec,
      status: "rendered",
      mimeType: out.mimeType,
      fileRef: stored.id,
      fileHash: createHash("sha256").update(out.file).digest("hex"),
      durationMs: out.durationMs,
      renderedAt: Date.now(),
    };
    db.assets.set(id, asset);
    return asset;
  } catch (err) {
    db.assets.set(id, {
      id,
      storyId: story.id,
      storyVersion: story.version,
      version,
      spec: previous?.spec ?? emptySpec(story, choices.kind),
      status: "failed",
      error: err instanceof Error ? err.message : "Render failed",
      renderedAt: Date.now(),
    });
    throw err;
  }
}

function emptySpec(story: Story, kind: OutputKind): RenderSpec {
  return {
    storyId: story.id,
    storyVersion: story.version,
    kind,
    layoutVersion: LAYOUT_VERSION,
    selectedSpans: [],
    excerpt: false,
    narration: "none",
    narrationLanguage: story.sourceLanguage,
    captionLanguage: story.sourceLanguage,
    captions: [],
    machineTranslated: false,
    footage: "neutral",
    showStoryLabel: true,
  };
}
