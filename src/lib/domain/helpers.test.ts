import { describe, expect, it } from "vitest";
import { STORY_FIXTURES } from "@/fixtures/stories";
import { withTexts } from "./captions";
import { findIdentifyingDetails } from "./identifying";
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

describe("withTexts", () => {
  it("swaps in translations with the same timing", () => {
    const segments = [
      { text: "One.", startMs: 0, endMs: 900 },
      { text: "Two sentences here.", startMs: 900, endMs: 2400 },
    ];
    expect(withTexts(segments, ["Um.", "Duas frases aqui."]).map((s) => s.startMs)).toEqual([0, 900]);
    expect(() => withTexts(segments, ["only one"])).toThrow();
  });
});

describe("findIdentifyingDetails", () => {
  it("lists each word once and flags spoken ages", () => {
    const en = findIdentifyingDetails("My grandma took me. Later my grandma cried. I was fourteen years old.", "en");
    expect(en.filter((f) => f.text === "grandma")).toHaveLength(1);
    expect(en.some((f) => f.text === "fourteen" && f.kind === "number-or-date")).toBe(true);
    const es = findIdentifyingDetails("Tengo veintidós años.", "es-419");
    expect(es.some((f) => f.text === "veintidós")).toBe(true);
  });

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
