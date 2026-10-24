import { describe, expect, it } from "vitest";
import { assColor, assTime, cardAss, cardFontSize, escapeAssText, videoAss, waveDrawing } from "./ass";

describe("ASS helpers", () => {
  it("treats story text as data, not markup", () => {
    const escaped = escapeAssText("{\\b1}bold\\Nnew line}");
    expect(escaped).not.toMatch(/(^|[^\\])\{/);
    expect(escaped).not.toContain("\\N");
    expect(escaped).toContain("\\{");
  });

  it("turns paragraph breaks into ASS line breaks", () => {
    expect(escapeAssText("One.\n\nTwo.")).toBe("One.\\N\\NTwo.");
  });

  it("formats colors and times", () => {
    expect(assColor("#1F2B36")).toBe("&H00362B1F");
    expect(assTime(0)).toBe("0:00:00.00");
    expect(assTime(61_234)).toBe("0:01:01.23");
  });

  it("steps font size down in fixed tiers", () => {
    expect(cardFontSize(100)).toBeGreaterThan(cardFontSize(250));
    expect(cardFontSize(10_000)).toBe(38);
  });

  it("includes every label it is given", () => {
    const doc = cardAss({ text: "Hello.", storyLabel: "MY BAPTISM STORY", displayName: "Alex", notes: ["Prototype"] });
    expect(doc).toContain("MY BAPTISM STORY");
    expect(doc).toContain("— Alex");
    expect(doc).toContain("Prototype");
  });

  it("times each caption against the narration", () => {
    const doc = videoAss({
      captions: [
        { text: "First.", startMs: 0, endMs: 1500 },
        { text: "Second.", startMs: 1500, endMs: 3000 },
      ],
      durationMs: 3000,
      notes: [],
    });
    expect(doc).toContain("0:00:00.00,0:00:01.50,Caption,,0,0,0,,First.");
    expect(doc).toContain("0:00:01.50,0:00:03.00,Caption,,0,0,0,,Second.");
  });

  it("draws the waterline as one closed shape spanning its width", () => {
    const path = waveDrawing(880);
    expect(path.startsWith("m 0 0 b ")).toBe(true);
    expect(path).not.toMatch(/NaN|Infinity/);
    expect(path).toContain("l 880 4");
    expect(path.endsWith(" 0 4")).toBe(true);
  });
});
