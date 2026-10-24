// Builds Advanced SubStation Alpha documents for the card and narrated-video
// templates. libass (inside FFmpeg) lays out and wraps the text with the
// bundled fonts, so both outputs share one text pipeline and render the same
// way on macOS and Windows. Pure functions: no ffmpeg, safe to unit test.

import type { Segment } from "@/lib/domain/types";

export const LAYOUT_VERSION = "v2-riverside";

export const CARD_SIZE = { width: 1080, height: 1350 } as const;
export const VIDEO_SIZE = { width: 720, height: 1280 } as const;

/** Riverside, matching the app's tokens (src/app/globals.css). */
export const PALETTE = {
  background: "#0E4A55",
  text: "#FFFFFF",
  accent: "#E9B949",
  // 7.0:1 on the background.
  muted: "#BFE0E3",
} as const;

/** The storyteller's words. Labels, names and captions use the sans. */
const SERIF = "Literata";
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
  /** Numpad alignment: 1 bottom-left, 2 bottom-center, 5 middle-center, 7 top-left, 8 top-center. */
  align: number;
  /** An opaque box behind each line, for text over camera footage. */
  box?: { color: string; opacity: number; padding: number };
  marginL: number;
  marginR: number;
  marginV: number;
}

/** "#RRGGBB" with 0–1 opacity → ASS "&HAABBGGRR" (ASS alpha counts transparency). */
function assColorAlpha(hex: string, opacity: number): string {
  const alpha = Math.round((1 - opacity) * 255).toString(16).padStart(2, "0");
  return assColor(hex).replace("&H00", `&H${alpha}`.toUpperCase());
}

function styleLine(s: Style): string {
  const c = assColor(s.color);
  const box = s.box ? assColorAlpha(s.box.color, s.box.opacity) : "&H00000000";
  return [
    `Style: ${s.name}`,
    s.font,
    s.size,
    c,
    c,
    box,
    box,
    s.bold ? -1 : 0,
    0, 0, 0, 100, 100,
    s.spacing ?? 0,
    0,
    s.box ? 3 : 1,
    s.box ? s.box.padding : 0,
    0,
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

/**
 * The Riverside waterline as an ASS vector drawing: a wave-shaped ribbon
 * `width` long, built from cubic half-waves so it renders identically in libass
 * on every OS. Coordinates are relative to the event's \\pos.
 */
export function waveDrawing(width: number, wavelength = 48, amplitude = 6, thickness = 4): string {
  const halves = Math.max(1, Math.round(width / (wavelength / 2)));
  const h = width / halves;
  // A cubic with both controls at 4A/3 peaks at A.
  const k = (amplitude * 4) / 3;
  const r = (n: number) => Math.round(n * 10) / 10;
  const top: string[] = [];
  const bottom: string[] = [];
  for (let i = 0; i < halves; i++) {
    const x0 = i * h;
    const d = i % 2 === 0 ? -k : k;
    top.push(`b ${r(x0 + h / 3)} ${r(d)} ${r(x0 + (2 * h) / 3)} ${r(d)} ${r(x0 + h)} 0`);
  }
  for (let i = halves - 1; i >= 0; i--) {
    const x0 = i * h;
    const d = i % 2 === 0 ? -k : k;
    bottom.push(`b ${r(x0 + (2 * h) / 3)} ${r(d + thickness)} ${r(x0 + h / 3)} ${r(d + thickness)} ${r(x0)} ${thickness}`);
  }
  return `m 0 0 ${top.join(" ")} l ${r(width)} ${thickness} ${bottom.join(" ")}`;
}

/** Places a waterline drawing with its left end at `x,y`. */
function waterline(x: number, y: number, width: number, color: string): string {
  return `{\\an7\\pos(${x},${y})\\bord0\\shad0\\1c${assColor(color)}&\\p1}${waveDrawing(width)}{\\p0}`;
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

/** Where the card's waterline sits; the quote rests just above it. */
const WATERLINE_Y = 1072;

export function cardAss(input: CardLayoutInput): string {
  const { width, height } = CARD_SIZE;
  const left = 100;
  const styles: Style[] = [
    { name: "Label", font: SANS, size: 30, color: PALETTE.accent, bold: true, spacing: 3, align: 7, marginL: left, marginR: left, marginV: 0 },
    // The words rest on the waterline: bottom-anchored just above it, so open space reads as sky, not a gap.
    { name: "Quote", font: SERIF, size: cardFontSize(input.text.length), color: PALETTE.text, align: 1, marginL: left, marginR: left, marginV: height - WATERLINE_Y + 40 },
    { name: "Name", font: SANS, size: 38, color: PALETTE.text, bold: true, align: 1, marginL: left, marginR: left, marginV: 0 },
    { name: "Note", font: SANS, size: 26, color: PALETTE.muted, align: 1, marginL: left, marginR: left, marginV: 0 },
  ];
  const forever = { startMs: 0, endMs: 10_000 };
  const events: Event[] = [];
  let layer = 0;
  if (input.storyLabel) events.push({ ...forever, layer: layer++, style: "Label", text: at(left, 110, input.storyLabel) });
  // The opening mark is decoration in gold; \\r returns to the plain style before the author's words.
  events.push({ ...forever, layer: layer++, style: "Quote", text: `{\\1c${assColor(PALETTE.accent)}&}“{\\r}${escapeAssText(input.text)}` });
  events.push({ ...forever, layer: layer++, style: "Label", text: waterline(left, WATERLINE_Y, width - left * 2, PALETTE.accent) });

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
  events.push({ ...whole, layer: layer++, style: "Label", text: waterline(60, 1010, width - 120, PALETTE.accent) });

  const captionLayer = layer;
  for (const c of input.captions) {
    events.push({ layer: captionLayer, style: "Caption", startMs: c.startMs, endMs: c.endMs, text: escapeAssText(c.text) });
  }
  return document({ width, height: height }, styles, events);
}

/**
 * The person's own video (option B): footage fills the 9:16 frame, labels sit
 * at the top and captions on a teal box above the strip where sharing apps
 * draw their own controls.
 */
export function faceVideoAss(input: VideoLayoutInput): string {
  const { width, height } = VIDEO_SIZE;
  const cx = width / 2;
  const box = { color: PALETTE.background, opacity: 0.82, padding: 12 };
  const styles: Style[] = [
    { name: "Label", font: SANS, size: 22, color: PALETTE.accent, bold: true, spacing: 3, align: 8, marginL: 40, marginR: 40, marginV: 0, box },
    { name: "Note", font: SANS, size: 19, color: PALETTE.muted, align: 8, marginL: 40, marginR: 40, marginV: 0, box },
    { name: "Name", font: SANS, size: 26, color: PALETTE.accent, bold: true, align: 8, marginL: 40, marginR: 40, marginV: 0, box },
    { name: "Caption", font: SANS, size: 40, color: PALETTE.text, bold: true, align: 2, marginL: 50, marginR: 50, marginV: 230, box: { ...box, padding: 14 } },
  ];
  const whole = { startMs: 0, endMs: input.durationMs };
  const events: Event[] = [];
  let layer = 0;
  let y = 60;
  if (input.storyLabel) {
    events.push({ ...whole, layer: layer++, style: "Label", text: at(cx, y, input.storyLabel) });
    y += 46;
  }
  if (input.displayName) {
    events.push({ ...whole, layer: layer++, style: "Name", text: at(cx, y, `— ${input.displayName}`) });
    y += 48;
  }
  for (const note of input.notes) {
    events.push({ ...whole, layer: layer++, style: "Note", text: at(cx, y, note) });
    y += 40;
  }
  const captionLayer = layer;
  for (const c of input.captions) {
    events.push({ layer: captionLayer, style: "Caption", startMs: c.startMs, endMs: c.endMs, text: escapeAssText(c.text) });
  }
  return document({ width, height }, styles, events);
}
