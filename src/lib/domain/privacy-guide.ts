// Turns the privacy guide's answers into format recommendations and conflict
// warnings (plan section 4, "Identity-protection choices across formats").
// Recommendations only: every control stays directly available, and nothing
// switches to a more revealing choice automatically.

import type { NarrationMode, OutputKind, PrivacyPreferences } from "./types";

export type FormatChoice = { kind: "card" } | { kind: "captioned-video" } | { kind: "narrated-video"; narration: NarrationMode };

export type Conflict =
  | "recorded-voice-kept"
  | "name-shown"
  | "voice-captured"
  | "face-shown"
  | "surroundings-shown"
  | "face-captured";

export function formatKey(choice: FormatChoice): string {
  return choice.kind === "narrated-video" ? `video-${choice.narration}` : choice.kind;
}

/** Recommended formats, most suitable first. */
export function recommendFormats(p: PrivacyPreferences): FormatChoice[] {
  if (p.notSure) {
    // Start with text, no attribution, neutral visuals.
    return [{ kind: "card" }, { kind: "narrated-video", narration: "none" }];
  }
  if (p.hideVoice) {
    return [{ kind: "card" }, { kind: "narrated-video", narration: "synthetic" }, { kind: "narrated-video", narration: "none" }];
  }
  if (p.hideFace || p.hideSurroundings) {
    return [{ kind: "narrated-video", narration: "recorded" }, { kind: "card" }, { kind: "narrated-video", narration: "synthetic" }];
  }
  // Most personal first when the person is comfortable including face and voice (plan section 1).
  return [{ kind: "captioned-video" }, { kind: "narrated-video", narration: "recorded" }, { kind: "card" }];
}

export function isRecommended(p: PrivacyPreferences, choice: FormatChoice): boolean {
  return recommendFormats(p).some((c) => formatKey(c) === formatKey(choice));
}

/** Conflicts to explain before applying a choice. */
export function conflictsFor(
  p: PrivacyPreferences,
  choice: { kind: OutputKind; narration?: NarrationMode; showName?: boolean; capture?: "voice" | "video" },
): Conflict[] {
  const out: Conflict[] = [];
  const ownVideo = choice.kind === "captioned-video";
  if (p.hideVoice && (ownVideo || (choice.kind === "narrated-video" && choice.narration === "recorded"))) out.push("recorded-voice-kept");
  if (p.hideFace && ownVideo) out.push("face-shown");
  if (p.hideSurroundings && ownVideo) out.push("surroundings-shown");
  if ((p.hideName || p.notSure) && choice.showName) out.push("name-shown");
  if (p.hideVoice && choice.capture) out.push("voice-captured");
  if (p.hideFace && choice.capture === "video") out.push("face-captured");
  return out;
}

export function defaultShowName(p: PrivacyPreferences): boolean {
  return !(p.hideName || p.notSure);
}

export const NO_PREFERENCES: PrivacyPreferences = {
  hideFace: false,
  hideVoice: false,
  hideName: false,
  hideSurroundings: false,
  notSure: false,
};
