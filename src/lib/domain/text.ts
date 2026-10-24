import type { Segment } from "./types";

/** Splits approved text into sentences without changing any characters. */
export function splitSentences(text: string, locale: string): string[] {
  return sentenceSpans(text, locale).map((s) => s.text);
}

export interface SentenceSpan {
  /** [start, end) offsets into the source text, excluding surrounding whitespace. */
  start: number;
  end: number;
  text: string;
}

/** Sentence boundaries with exact offsets, so an excerpt is always a contiguous slice of the source. */
export function sentenceSpans(text: string, locale: string): SentenceSpan[] {
  const segmenter = new Intl.Segmenter(locale, { granularity: "sentence" });
  const spans: SentenceSpan[] = [];
  for (const { segment, index } of segmenter.segment(text)) {
    const lead = segment.length - segment.trimStart().length;
    const trimmed = segment.trim();
    if (!trimmed) continue;
    spans.push({ start: index + lead, end: index + lead + trimmed.length, text: trimmed });
  }
  return spans;
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
