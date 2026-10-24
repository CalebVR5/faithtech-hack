// Word-timed captions. Every caption ("slide") is built from words that carry
// their own start and end times in the audio actually used, so a slide appears
// when its first word is spoken. Slides never cross a sentence boundary; long
// sentences break at clause punctuation, a pause or a conjunction before
// falling back to a plain word break. Nothing here adds, drops or rewrites a
// word (plan section 5).

import { sentenceSpans } from "./text";
import type { Segment } from "./types";

export interface TimedWord {
  text: string;
  startMs: number;
  endMs: number;
}

/** About three lines of captions on a 720px-wide frame. */
export const MAX_SLIDE_CHARS = 80;
/** Show a slide slightly before its first word so the eye arrives with the voice. */
const LEAD_MS = 120;
/** Keep the last words up after speech stops, but not through a long silence. */
const HOLD_MS = 1200;
/** Two short sentences may share a slide when together they stay this short. */
const MERGE_MAX_CHARS = 42;

/** Reading pace for "No voice" videos, where there is no audio to time against. */
const SILENT_MS_PER_CHAR = 70;
const SILENT_MIN_WORD_MS = 250;
const SILENT_SENTENCE_GAP_MS = 400;

export function tokenize(text: string): string[] {
  return text.split(/\s+/).filter(Boolean);
}

/** Lowercase letters and digits only, for comparing what was said with what was typed. */
function normalize(word: string): string {
  return word.toLowerCase().normalize("NFC").replace(/[^\p{L}\p{N}']/gu, "");
}

function similar(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 1;
  if (Math.min(a.length, b.length) < 4) return 0;
  // Levenshtein ratio, so "entouré" still matches "entourée".
  const prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
      diag = tmp;
    }
  }
  const ratio = 1 - prev[b.length] / Math.max(a.length, b.length);
  return ratio >= 0.7 ? ratio : 0;
}

/**
 * Gives every word of the author's reviewed text a time in the recording.
 * Words that match what the speech service heard keep its timing exactly;
 * corrected or added words share the gap between their matched neighbours.
 */
export function alignWords(reviewedText: string, heard: TimedWord[], durationMs: number): TimedWord[] {
  const tokens = tokenize(reviewedText);
  if (tokens.length === 0) return [];
  const a = tokens.map(normalize);
  const b = heard.map((w) => normalize(w.text));

  // Global alignment (Needleman-Wunsch) maximizing matched words.
  const n = a.length;
  const m = b.length;
  const score: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const s = similar(a[i - 1], b[j - 1]);
      score[i][j] = Math.max(score[i - 1][j], score[i][j - 1], s > 0 ? score[i - 1][j - 1] + 1 + s : -Infinity);
    }
  }
  const match = new Array<number>(n).fill(-1);
  for (let i = n, j = m; i > 0 && j > 0; ) {
    const s = similar(a[i - 1], b[j - 1]);
    if (s > 0 && score[i][j] === score[i - 1][j - 1] + 1 + s) {
      match[i - 1] = j - 1;
      i--;
      j--;
    } else if (score[i][j] === score[i - 1][j]) i--;
    else j--;
  }

  const out: TimedWord[] = tokens.map((text, i) =>
    match[i] >= 0 ? { text, startMs: heard[match[i]].startMs, endMs: heard[match[i]].endMs } : { text, startMs: -1, endMs: -1 },
  );

  // Fill each run of unmatched words between the times around it, by length.
  const speechStart = heard[0]?.startMs ?? 0;
  const speechEnd = heard.at(-1)?.endMs ?? durationMs;
  for (let i = 0; i < n; ) {
    if (out[i].startMs >= 0) {
      i++;
      continue;
    }
    let j = i;
    while (j < n && out[j].startMs < 0) j++;
    const from = i > 0 ? out[i - 1].endMs : speechStart;
    const to = j < n ? out[j].startMs : Math.max(speechEnd, from);
    const chars = out.slice(i, j).reduce((sum, w) => sum + w.text.length + 1, 0);
    let cursor = from;
    for (let k = i; k < j; k++) {
      const len = ((out[k].text.length + 1) / chars) * Math.max(0, to - from);
      out[k] = { text: out[k].text, startMs: Math.round(cursor), endMs: Math.round(cursor + len) };
      cursor += len;
    }
    i = j;
  }
  return out;
}

/**
 * Corrects speech-to-text word times with the recording's real pauses.
 * Speech services report word times that drift by a word or so; the pauses in
 * the audio are exact. Each pause is matched to the nearest word boundary that
 * the transcript punctuates (where people actually pause), the word after it
 * starts when sound resumes, and the words between two such anchors are spread
 * over the time actually spoken. Order and relative spacing are kept.
 */
export function snapToPauses(words: TimedWord[], pauses: Array<{ startMs: number; endMs: number }>): TimedWord[] {
  if (words.length === 0 || pauses.length === 0) return words.map((w) => ({ ...w }));
  const PUNCTUATED_WINDOW_MS = 900;
  const PLAIN_WINDOW_MS = 250;

  // anchors[i] = real time word i starts, and when word i-1 really stopped.
  const anchors = new Map<number, { start: number; prevEnd: number }>();
  let next = 0;
  for (const pause of pauses) {
    // Leading silence: speech starts when it ends.
    if (next === 0 && pause.startMs <= words[0].startMs + PLAIN_WINDOW_MS && pause.endMs < words[0].endMs + PUNCTUATED_WINDOW_MS) {
      if (pause.startMs <= 50) {
        anchors.set(0, { start: pause.endMs, prevEnd: 0 });
        next = 1;
        continue;
      }
    }
    let best = -1;
    let bestDistance = Infinity;
    for (let i = Math.max(1, next); i < words.length; i++) {
      const boundary = words[i].startMs;
      if (boundary > pause.endMs + PUNCTUATED_WINDOW_MS) break;
      const distance = boundary < pause.startMs ? pause.startMs - boundary : boundary > pause.endMs ? boundary - pause.endMs : 0;
      const punctuated = /[,.;:!?…—–]["'”’»)]*$/.test(words[i - 1].text);
      const limit = punctuated ? PUNCTUATED_WINDOW_MS : PLAIN_WINDOW_MS;
      // Prefer punctuated boundaries: weigh plain ones as if farther away.
      const score = distance + (punctuated ? 0 : PUNCTUATED_WINDOW_MS);
      if (distance <= limit && score < bestDistance) {
        best = i;
        bestDistance = score;
      }
    }
    if (best < 0) continue;
    anchors.set(best, { start: pause.endMs, prevEnd: pause.startMs });
    next = best + 1;
  }
  if (anchors.size === 0) return words.map((w) => ({ ...w }));

  // Piecewise-linear warp of the original times between consecutive anchors.
  const out = words.map((w) => ({ ...w }));
  const cuts = [...anchors.keys()].sort((a, b) => a - b);
  const bounds = [0, ...cuts.filter((c) => c > 0), words.length];
  for (let k = 0; k + 1 < bounds.length; k++) {
    const from = bounds[k];
    const to = bounds[k + 1];
    const origStart = words[from].startMs;
    const origEnd = words[to - 1].endMs;
    const newStart = anchors.get(from)?.start ?? origStart;
    const newEnd = to < words.length ? Math.max(newStart, anchors.get(to)!.prevEnd) : Math.max(newStart, origEnd);
    const scale = origEnd > origStart ? (newEnd - newStart) / (origEnd - origStart) : 0;
    for (let i = from; i < to; i++) {
      out[i].startMs = Math.round(newStart + (words[i].startMs - origStart) * scale);
      out[i].endMs = Math.round(newStart + (words[i].endMs - origStart) * scale);
    }
  }
  return out;
}

/** Times words at a comfortable reading pace, for a video with no narration. */
export function paceWords(text: string, locale: string): { words: TimedWord[]; durationMs: number } {
  const words: TimedWord[] = [];
  let cursor = 0;
  for (const sentence of sentenceSpans(text, locale)) {
    for (const token of tokenize(sentence.text)) {
      const ms = Math.max(SILENT_MIN_WORD_MS, (token.length + 1) * SILENT_MS_PER_CHAR);
      words.push({ text: token, startMs: cursor, endMs: cursor + ms });
      cursor += ms;
    }
    cursor += SILENT_SENTENCE_GAP_MS;
  }
  return { words, durationMs: cursor };
}

/** Indices [start, end) of words grouped into sentences, using the language's sentence rules. */
function sentenceGroups(words: TimedWord[], locale: string): Array<[number, number]> {
  if (words.length === 0) return [];
  // Where each word starts in the words joined by single spaces.
  const offsets: number[] = [];
  let length = 0;
  for (const w of words) {
    offsets.push(length);
    length += w.text.length + 1;
  }
  const text = words.map((w) => w.text).join(" ");
  const groups: Array<[number, number]> = [];
  let wi = 0;
  for (const span of sentenceSpans(text, locale)) {
    const start = wi;
    while (wi < words.length && offsets[wi] < span.end) wi++;
    if (wi > start) groups.push([start, wi]);
  }
  if (wi < words.length) groups.push([wi, words.length]);
  return groups;
}

/** Sentences with the time span they were spoken in: the units the transcript editor shows. */
export function sentencesFromWords(words: TimedWord[], locale: string): Segment[] {
  return sentenceGroups(words, locale).map(([s, e]) => ({
    text: words
      .slice(s, e)
      .map((w) => w.text)
      .join(" "),
    startMs: words[s].startMs,
    endMs: words[e - 1].endMs,
  }));
}

const CONJUNCTIONS = new Set([
  // en
  "and", "but", "so", "because", "then", "when", "while", "until", "which", "who", "or",
  // es
  "y", "pero", "porque", "entonces", "cuando", "mientras", "aunque", "o",
  // fr
  "et", "mais", "parce", "donc", "quand", "puis", "alors", "ou",
  // pt
  "e", "mas", "então", "quando", "enquanto", "embora", "ou",
]);

/** Cost of ending a slide after word i; lower is a more natural place to break. */
function breakCost(words: TimedWord[], i: number): number {
  const word = words[i].text;
  const next = words[i + 1];
  const pause = next ? next.startMs - words[i].endMs : 0;
  if (/[,;:—–]["'”’»)]*$/.test(word)) return pause >= 250 ? 0.5 : 1;
  if (pause >= 450) return 1.5;
  if (next && CONJUNCTIONS.has(normalize(next.text))) return pause >= 150 ? 2 : 3;
  if (pause >= 200) return 4;
  return 10;
}

function chars(words: TimedWord[], s: number, e: number): number {
  let n = -1;
  for (let i = s; i < e; i++) n += words[i].text.length + 1;
  return n;
}

/** Splits one sentence's words into the fewest, most natural slides that fit. */
function splitSentence(words: TimedWord[], s: number, e: number, maxChars: number): Array<[number, number]> {
  if (chars(words, s, e) <= maxChars) return [[s, e]];
  // best[k] = lowest cost to cover words s..k-1 with whole slides.
  const best = new Array<number>(e + 1).fill(Infinity);
  const from = new Array<number>(e + 1).fill(-1);
  best[s] = 0;
  for (let k = s + 1; k <= e; k++) {
    for (let j = k - 1; j >= s; j--) {
      const len = chars(words, j, k);
      if (len > maxChars && k - j > 1) break;
      if (best[j] === Infinity) continue;
      const count = k - j;
      const piece =
        6 + // each slide costs something, so fewer, fuller slides win
        (count < 3 ? 8 : 0) + // avoid fragments of one or two words
        (k < e ? breakCost(words, k - 1) : 0);
      if (best[j] + piece < best[k]) {
        best[k] = best[j] + piece;
        from[k] = j;
      }
    }
  }
  const slides: Array<[number, number]> = [];
  for (let k = e; k > s; k = from[k]) slides.unshift([from[k], k]);
  return slides;
}

/**
 * Builds caption slides from timed words. Each slide is a whole sentence, or a
 * clause of a long one, and is shown from just before its first word until the
 * next slide begins (or briefly after its last word).
 */
export function buildSlides(words: TimedWord[], locale: string, durationMs: number, maxChars = MAX_SLIDE_CHARS): Segment[] {
  const groups: Array<{ range: [number, number]; whole: boolean }> = [];
  for (const [s, e] of sentenceGroups(words, locale)) {
    const pieces = splitSentence(words, s, e, maxChars);
    for (const range of pieces) groups.push({ range, whole: pieces.length === 1 });
  }

  // Two very short whole sentences in a row ("That's it. That's the story.")
  // read better together. A clause of a split sentence is never merged.
  const merged: Array<[number, number]> = [];
  let lastWhole = false;
  for (const { range, whole } of groups) {
    const last = merged.at(-1);
    if (
      last &&
      lastWhole &&
      whole &&
      chars(words, last[0], range[1]) <= MERGE_MAX_CHARS &&
      words[range[0]].startMs - words[last[1] - 1].endMs < 700
    ) {
      last[1] = range[1];
    } else merged.push([...range]);
    lastWhole = whole;
  }

  return merged.map(([s, e], i) => {
    const prevEnd = i > 0 ? words[merged[i - 1][1] - 1].endMs : 0;
    const startMs = Math.max(i === 0 ? 0 : prevEnd, words[s].startMs - LEAD_MS);
    const next = merged[i + 1];
    const lastWordEnd = words[e - 1].endMs;
    const endMs = next
      ? Math.max(Math.min(words[next[0]].startMs - LEAD_MS, lastWordEnd + HOLD_MS), lastWordEnd)
      : Math.min(Math.max(durationMs, lastWordEnd), lastWordEnd + HOLD_MS);
    return {
      text: words
        .slice(s, e)
        .map((w) => w.text)
        .join(" "),
      startMs: Math.max(0, Math.round(startMs)),
      endMs: Math.max(Math.round(endMs), Math.round(startMs) + 1),
    };
  });
}
