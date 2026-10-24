// Caption helpers. Captions always follow the audio actually used in the
// export (plan section 4, option B "Captions"). Slides are built from timed
// words in ./timing.ts; this only swaps their text, never their timing.

import type { Segment } from "./types";

/** Replaces each caption's words with its translation, keeping the timing of the audio it belongs to. */
export function withTexts(segments: Segment[], texts: string[]): Segment[] {
  if (texts.length !== segments.length) throw new Error("Caption count mismatch");
  return segments.map((s, i) => ({ ...s, text: texts[i] }));
}
