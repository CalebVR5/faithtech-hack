import { describe, expect, it } from "vitest";
import { STORY_FIXTURES } from "@/fixtures/stories";
import { chunkSegments, MAX_CAPTION_CHARS, readingPaceSegments, withTexts } from "./captions";
import { findIdentifyingDetails } from "./identifying";
import { conflictsFor, defaultShowName, formatKey, recommendFormats, NO_PREFERENCES } from "./privacy-guide";
import { sentenceSpans } from "./text";

describe("sentenceSpans", () => {
  it("returns exact offsets so an excerpt is a slice of the source", () => {
    for (const f of STORY_FIXTURES) {
      for (const s of sentenceSpans(f.text, "en-US")) {
        expect(f.text.slice(s.start, s.end)).toBe(s.text);
      }
    }
  });

  it("skips whitespace between paragraphs", () => {
    const text = "First answer.\n\nSecond answer.";
    expect(sentenceSpans(text, "en-US").map((s) => s.text)).toEqual(["First answer.", "Second answer."]);
  });
});

describe("chunkSegments", () => {
  const long = "I grew up going to church with my grandma in Riverside, but I stopped going in 2019.";

  it("splits long captions into balanced pieces without changing words", () => {
    const out = chunkSegments([{ text: long, startMs: 1000, endMs: 5000 }]);
    expect(out).toHaveLength(2);
    expect(out.map((c) => c.text).join(" ")).toBe(long);
    // No stray last word on its own caption.
    expect(Math.min(...out.map((c) => c.text.length))).toBeGreaterThan(25);
    expect(out.every((c) => c.text.length <= MAX_CAPTION_CHARS)).toBe(true);
  });

  it("keeps time contiguous inside the original segment", () => {
    const out = chunkSegments([{ text: long, startMs: 1000, endMs: 5000 }]);
    expect(out[0].startMs).toBe(1000);
    expect(out.at(-1)!.endMs).toBe(5000);
    expect(out[0].endMs).toBe(out[1].startMs);
  });

  it("leaves short captions alone", () => {
    expect(chunkSegments([{ text: " Short. ", startMs: 0, endMs: 900 }])).toEqual([{ text: "Short.", startMs: 0, endMs: 900 }]);
  });

  it("paces silent captions and swaps in translations with the same timing", () => {
    const { segments, durationMs } = readingPaceSegments(["One.", "Two sentences here."]);
    expect(segments[1].startMs).toBe(segments[0].endMs);
    expect(durationMs).toBe(segments[1].endMs);
    expect(withTexts(segments, ["Um.", "Duas frases aqui."]).map((s) => s.startMs)).toEqual(segments.map((s) => s.startMs));
    expect(() => withTexts(segments, ["only one"])).toThrow();
  });
});

describe("findIdentifyingDetails", () => {
  it("flags names, numbers, family and places without editing the text", () => {
    const text = "I went to church with my grandma in Riverside until 2019.";
    const flags = findIdentifyingDetails(text, "en");
    expect(flags.map((f) => [f.text, f.kind])).toEqual([
      ["church", "place-or-group"],
      ["grandma", "family"],
      ["Riverside", "name-or-place"],
      ["2019", "number-or-date"],
    ]);
    for (const f of flags) expect(text.slice(f.start, f.end)).toBe(f.text);
  });

  it("doesn't flag sentence-initial words or common terms", () => {
    expect(findIdentifyingDetails("Nothing dramatic happened. I kept showing up on Sundays.", "en")).toEqual([]);
  });

  it("uses the story's language", () => {
    const kinds = findIdentifyingDetails("Un amigo de la universidad me invitó.", "es-419").map((f) => f.kind);
    expect(kinds).toContain("place-or-group");
  });
});

describe("privacy guide", () => {
  it("leads with the personal voice when nothing is hidden", () => {
    expect(formatKey(recommendFormats(NO_PREFERENCES)[0])).toBe("video-recorded");
  });

  it("never recommends the recorded voice when the voice should stay out", () => {
    const keys = recommendFormats({ ...NO_PREFERENCES, hideVoice: true }).map(formatKey);
    expect(keys).not.toContain("video-recorded");
    expect(keys).toContain("video-synthetic");
  });

  it("starts unsure people with text and no name", () => {
    const p = { ...NO_PREFERENCES, notSure: true };
    expect(formatKey(recommendFormats(p)[0])).toBe("card");
    expect(defaultShowName(p)).toBe(false);
  });

  it("explains conflicts instead of applying them silently", () => {
    const p = { ...NO_PREFERENCES, hideVoice: true, hideName: true };
    expect(conflictsFor(p, { kind: "narrated-video", narration: "recorded" })).toContain("recorded-voice-kept");
    expect(conflictsFor(p, { kind: "card", showName: true })).toContain("name-shown");
    expect(conflictsFor(NO_PREFERENCES, { kind: "narrated-video", narration: "recorded", showName: true })).toEqual([]);
  });
});
