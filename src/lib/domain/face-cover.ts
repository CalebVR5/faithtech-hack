// Face covering for "Video of me" (plan section 4, face-blur variant). A single
// conservative cover for the whole clip: automatic detection proposes where
// faces were, the person adjusts it, and the encoded result is what they
// approve. Detection is assistance, never proof that every frame is covered.

/** A rectangle as fractions (0–1) of the video frame, in display orientation. */
export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Faces found at one moment of the video. */
export interface FaceSample {
  timeMs: number;
  faces: Box[];
}

export const MIN_COVER_SIZE = 0.08;
/** Fraction of a detected face that must sit inside the cover to count as covered. */
const COVERED_FRACTION = 0.92;

export function clampBox(b: Box): Box {
  const w = Math.min(1, Math.max(MIN_COVER_SIZE, b.w));
  const h = Math.min(1, Math.max(MIN_COVER_SIZE, b.h));
  return { x: Math.min(1 - w, Math.max(0, b.x)), y: Math.min(1 - h, Math.max(0, b.y)), w, h };
}

/** True for a well-formed cover sent by the browser. */
export function isBox(value: unknown): value is Box {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  const ok = (n: unknown) => typeof n === "number" && Number.isFinite(n) && n >= 0 && n <= 1;
  return (
    ok(v.x) && ok(v.y) && ok(v.w) && ok(v.h) &&
    (v.w as number) >= MIN_COVER_SIZE - 1e-6 && (v.h as number) >= MIN_COVER_SIZE - 1e-6 &&
    (v.x as number) + (v.w as number) <= 1 + 1e-6 && (v.y as number) + (v.h as number) <= 1 + 1e-6
  );
}

/**
 * One cover over everywhere a face was seen, with room to spare: more above
 * for hair, around for movement between samples, below for the chin and neck.
 */
export function coverFromSamples(samples: FaceSample[]): Box | null {
  const faces = samples.flatMap((s) => s.faces);
  if (faces.length === 0) return null;
  const left = Math.min(...faces.map((f) => f.x));
  const top = Math.min(...faces.map((f) => f.y));
  const right = Math.max(...faces.map((f) => f.x + f.w));
  const bottom = Math.max(...faces.map((f) => f.y + f.h));
  const size = Math.max(...faces.map((f) => Math.max(f.w, f.h)));
  return clampBox({
    x: left - size * 0.35,
    y: top - size * 0.55,
    w: right - left + size * 0.7,
    h: bottom - top + size * 0.85,
  });
}

function insideFraction(face: Box, cover: Box): number {
  const ix = Math.max(0, Math.min(face.x + face.w, cover.x + cover.w) - Math.max(face.x, cover.x));
  const iy = Math.max(0, Math.min(face.y + face.h, cover.y + cover.h) - Math.max(face.y, cover.y));
  return (ix * iy) / Math.max(face.w * face.h, 1e-9);
}

/** Moments where a detected face isn't fully under the cover, for the person to fix. */
export function uncoveredMoments(samples: FaceSample[], cover: Box): number[] {
  return samples.filter((s) => s.faces.some((f) => insideFraction(f, cover) < COVERED_FRACTION)).map((s) => s.timeMs);
}

/** Moments with more than one face: the cover is drawn over all of them. */
export function crowdedMoments(samples: FaceSample[]): number[] {
  return samples.filter((s) => s.faces.length > 1).map((s) => s.timeMs);
}

/** Collapses nearby moments into a short readable list ("0:04, 0:12"). */
export function summarizeMoments(times: number[], gapMs = 2000, max = 4): string[] {
  const starts: number[] = [];
  for (const t of [...times].sort((a, b) => a - b)) if (starts.length === 0 || t - starts.at(-1)! > gapMs) starts.push(t);
  return starts.slice(0, max).map((t) => {
    const s = Math.floor(t / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  });
}
