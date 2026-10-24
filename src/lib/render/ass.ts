// Builds Advanced SubStation Alpha documents for the card and narrated-video
// templates. libass (inside FFmpeg) lays out and wraps the text with the
// bundled fonts, so both outputs share one text pipeline and render the same
// way on macOS and Windows. Pure functions: no ffmpeg, safe to unit test.

import type { Segment } from "@/lib/domain/types";

export const LAYOUT_VERSION = "v1";

export const CARD_SIZE = { width: 1080, height: 1350 } as const;
export const VIDEO_SIZE = { width: 720, height: 1280 } as const;

export const PALETTE = {
  background: "#1F2B36",
  text: "#F5F0E8",
  accent: "#D9B98C",
  muted: "#A9B4BF",
} as const;

const SERIF = "Libre Baskerville";
const SANS = "Atkinson Hyperlegible";

/** "#RRGGBB" → ASS "&H00BBGGRR". */
export function assColor(hex: string): string {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) throw new Error(`Bad color ${hex}`);
  return `&H00${m[3]}${m[2]}${m[1]}`.toUpperCase();
}

/**
 * Story text is data, never markup. Braces would start override blocks and
 * "\N", "\n", "\h" are line/space codes, so neutralize both while keeping
 * every visible character the author wrote.
 */
export function escapeAssText(text: string): string {
  return text
    .replace(/\\/g, "\\⁠")
    .replace(/\{/g, "\\{")
    .replace(/\}/g, "\\}")
    .replace(/\r?\n/g, "\\N");
}

/** Milliseconds → "H:MM:SS.cc". */
export function assTime(ms: number): string {
  const cs = Math.max(0, Math.round(ms / 10));
  const h = Math.floor(cs / 360000);
  const m = Math.floor((cs % 360000) / 6000);
  const s = Math.floor((cs % 6000) / 100);
  const c = cs % 100;
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(c).padStart(2, "0")}`;
}

interface Style {
  name: string;
  font: string;
  size: number;
  color: string;
  bold?: boolean;
  spacing?: number;
  /** Numpad alignment: 1 bottom-left, 5 middle-center, 7 top-left, 8 top-center. */
  align: number;
  marginL: number;
  marginR: number;
  marginV: number;
}

function styleLine(s: Style): string {
  const c = assColor(s.color);
  return [
    `Style: ${s.name}`,
    s.font,
    s.size,
    c,
    c,
    "&H00000000",
    "&H00000000",
    s.bold ? -1 : 0,
    0, 0, 0, 100, 100,
    s.spacing ?? 0,
    0, 1, 0, 0,
    s.align,
    s.marginL,
    s.marginR,
    s.marginV,
    1,
  ].join(",");
}

interface Event {
  style: string;
  text: string;
  startMs: number;
  endMs: number;
  /** Separate layers stop libass from nudging non-overlapping labels apart. */
  layer: number;
}

function document(size: { width: number; height: number }, styles: Style[], events: Event[]): string {
  return [
    "[Script Info]",
    "ScriptType: v4.00+",
    `PlayResX: ${size.width}`,
    `PlayResY: ${size.height}`,
    // Smart wrapping: lines are balanced rather than filled greedily.
    "WrapStyle: 0",
    "ScaledBorderAndShadow: yes",
    "",
    "[V4+ Styles]",
    "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
    ...styles.map(styleLine),
    "",
    "[Events]",
    "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
    ...events.map((e) => `Dialogue: ${e.layer},${assTime(e.startMs)},${assTime(e.endMs)},${e.style},,0,0,0,,${e.text}`),
    "",
  ].join("\n");
}

/** Positions a single-line label; `x,y` is the anchor for the style's alignment. */
function at(x: number, y: number, text: string): string {
  return `{\\pos(${x},${y})}${escapeAssText(text)}`;
}

export interface CardLayoutInput {
  text: string;
  storyLabel?: string;
  displayName?: string;
  notes: string[];
}

/** Fixed size tiers keep long passages readable instead of shrinking forever. */
export function cardFontSize(chars: number): number {
  if (chars <= 120) return 60;
  if (chars <= 200) return 52;
  if (chars <= 320) return 44;
  return 38;
}

export function cardAss(input: CardLayoutInput): string {
  const { width, height } = CARD_SIZE;
  const left = 100;
  const styles: Style[] = [
    { name: "Label", font: SANS, size: 30, color: PALETTE.accent, bold: true, spacing: 3, align: 7, marginL: left, marginR: left, marginV: 0 },
    { name: "Mark", font: SERIF, size: 200, color: PALETTE.accent, align: 7, marginL: left, marginR: left, marginV: 0 },
    { name: "Quote", font: SERIF, size: cardFontSize(input.text.length), color: PALETTE.text, align: 7, marginL: left, marginR: left, marginV: 300 },
    { name: "Name", font: SANS, size: 38, color: PALETTE.text, bold: true, align: 1, marginL: left, marginR: left, marginV: 0 },
    { name: "Note", font: SANS, size: 26, color: PALETTE.muted, align: 1, marginL: left, marginR: left, marginV: 0 },
  ];
  const forever = { startMs: 0, endMs: 10_000 };
  const events: Event[] = [];
  let layer = 0;
  if (input.storyLabel) events.push({ ...forever, layer: layer++, style: "Label", text: at(left, 110, input.storyLabel) });
  events.push({ ...forever, layer: layer++, style: "Mark", text: at(left - 8, 150, "“") });
  events.push({ ...forever, layer: layer++, style: "Quote", text: escapeAssText(input.text) });

  // Bottom block, stacked upward from the footer.
  let y = height - 90;
  for (const note of [...input.notes].reverse()) {
    events.push({ ...forever, layer: layer++, style: "Note", text: at(left, y, note) });
    y -= 46;
  }
  if (input.displayName) events.push({ ...forever, layer: layer++, style: "Name", text: at(left, y - 24, `— ${input.displayName}`) });

  return document({ width, height }, styles, events);
}

export interface VideoLayoutInput {
  captions: Segment[];
  durationMs: number;
  storyLabel?: string;
  displayName?: string;
  notes: string[];
}

export function videoAss(input: VideoLayoutInput): string {
  const { width, height } = VIDEO_SIZE;
  const cx = width / 2;
  const styles: Style[] = [
    { name: "Label", font: SANS, size: 24, color: PALETTE.accent, bold: true, spacing: 3, align: 8, marginL: 60, marginR: 60, marginV: 0 },
    { name: "Note", font: SANS, size: 21, color: PALETTE.muted, align: 8, marginL: 60, marginR: 60, marginV: 0 },
    // Captions sit mid-frame, clear of the top labels and of app overlays at the bottom.
    { name: "Caption", font: SANS, size: 46, color: PALETTE.text, bold: true, align: 5, marginL: 70, marginR: 70, marginV: 0 },
    { name: "Name", font: SANS, size: 30, color: PALETTE.accent, bold: true, align: 8, marginL: 60, marginR: 60, marginV: 0 },
  ];
  const whole = { startMs: 0, endMs: input.durationMs };
  const events: Event[] = [];
  let layer = 0;
  let y = 130;
  if (input.storyLabel) {
    events.push({ ...whole, layer: layer++, style: "Label", text: at(cx, y, input.storyLabel) });
    y += 48;
  }
  for (const note of input.notes) {
    events.push({ ...whole, layer: layer++, style: "Note", text: at(cx, y, note) });
    y += 32;
  }
  if (input.displayName) events.push({ ...whole, layer: layer++, style: "Name", text: at(cx, 900, `— ${input.displayName}`) });

  const captionLayer = layer;
  for (const c of input.captions) {
    events.push({ layer: captionLayer, style: "Caption", startMs: c.startMs, endMs: c.endMs, text: escapeAssText(c.text) });
  }
  return document({ width, height: height }, styles, events);
}
