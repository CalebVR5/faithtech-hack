// Caption timing helpers. Captions always follow the audio actually used in
// the export (plan section 4, option B "Captions"); these functions only split
// or pace existing words, they never add or change any.

import { proportionalSegments } from "./text";
import type { Segment } from "./types";

/** About three lines of 46px captions on a 720px-wide frame. */
export const MAX_CAPTION_CHARS = 80;

/** Reading pace for "No voice" videos, where there is no audio to time against. */
const SILENT_MS_PER_CHAR = 70;
const SILENT_MIN_SENTENCE_MS = 2000;

/**
 * Splits long segments at word boundaries and shares the segment's time span
 * between the pieces in proportion to their length. Joining the pieces with a
 * space reproduces the original segment text.
 */
export function chunkSegments(segments: Segment[], maxChars = MAX_CAPTION_CHARS): Segment[] {
  const out: Segment[] = [];
  for (const seg of segments) {
    const text = seg.text.trim();
    if (!text) continue;
    if (text.length <= maxChars) {
      out.push({ ...seg, text });
      continue;
    }
    // Balanced pieces, so a long sentence doesn't leave one stray word on its own caption.
    const pieces = Math.ceil(text.length / maxChars);
    const target = text.length / pieces;
    const chunks: string[] = [];
    let current = "";
    for (const word of text.split(/\s+/)) {
      const tooLong = current.length + 1 + word.length > maxChars;
      const balanced = current.length >= target && chunks.length < pieces - 1;
      if (current && (tooLong || balanced)) {
        chunks.push(current);
        current = word;
      } else {
        current = current ? `${current} ${word}` : word;
      }
    }
    if (current) chunks.push(current);
    for (const piece of proportionalSegments(chunks, seg.endMs - seg.startMs)) {
      out.push({ text: piece.text, startMs: seg.startMs + piece.startMs, endMs: seg.startMs + piece.endMs });
    }
  }
  return out;
}

/** Times sentences at a comfortable reading pace for a video with no narration. */
export function readingPaceSegments(sentences: string[]): { segments: Segment[]; durationMs: number } {
  let cursor = 0;
  const segments = sentences.map((text) => {
    const startMs = cursor;
    cursor += Math.max(SILENT_MIN_SENTENCE_MS, text.length * SILENT_MS_PER_CHAR);
    return { text, startMs, endMs: cursor };
  });
  return { segments, durationMs: cursor };
}

/** Replaces each segment's words with its translation, keeping the timing of the audio it belongs to. */
export function withTexts(segments: Segment[], texts: string[]): Segment[] {
  if (texts.length !== segments.length) throw new Error("Caption count mismatch");
  return segments.map((s, i) => ({ ...s, text: texts[i] }));
}
