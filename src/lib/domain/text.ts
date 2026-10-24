import type { Segment } from "./types";

/** Splits approved text into sentences without changing any characters. */
export function splitSentences(text: string, locale: string): string[] {
  const segmenter = new Intl.Segmenter(locale, { granularity: "sentence" });
  return Array.from(segmenter.segment(text), (s) => s.segment.trim()).filter(Boolean);
}

/**
 * Distributes sentences across a known duration in proportion to their length.
 * Used only where the provider returns no timing (mock audio). Real synthetic
 * narration uses provider timepoints instead.
 */
export function proportionalSegments(sentences: string[], durationMs: number): Segment[] {
  const total = sentences.reduce((sum, s) => sum + s.length, 0) || 1;
  let cursor = 0;
  return sentences.map((text, i) => {
    const startMs = cursor;
    const endMs = i === sentences.length - 1 ? durationMs : Math.round(cursor + (text.length / total) * durationMs);
    cursor = endMs;
    return { text, startMs, endMs };
  });
}
