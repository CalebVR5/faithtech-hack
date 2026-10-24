import { describe, expect, it } from "vitest";
import { STORY_FIXTURES } from "@/fixtures/stories";
import { LANGUAGE_IDS, LANGUAGES, resolveSttLocale } from "@/lib/domain/languages";
import { proportionalSegments, splitSentences } from "@/lib/domain/text";
import { wavDurationMs } from "@/lib/media/wav";
import { mockProvider } from "./mock";

describe("mock provider", () => {
  it.each(LANGUAGE_IDS)("synthesizes %s with captions spanning the audio", async (language) => {
    const text = STORY_FIXTURES.find((f) => f.language === language)!.text;
    const out = await mockProvider.synthesize({ text, language });
    expect(wavDurationMs(out.audio)).toBe(out.durationMs);
    expect(out.segments.length).toBeGreaterThan(1);
    expect(out.segments[0].startMs).toBe(0);
    expect(out.segments.at(-1)!.endMs).toBe(out.durationMs);
    // Captions reproduce the approved words exactly.
    expect(out.segments.map((s) => s.text).join(" ")).toBe(text);
  });

  it("labels mock translations", async () => {
    const out = await mockProvider.translate({ segments: ["Hello."], from: "en", to: "pt-BR" });
    expect(out).toEqual(["[mock pt] Hello."]);
  });

  it("returns the regional fixture for the requested Spanish locale", async () => {
    const peru = await mockProvider.transcribe({
      wav: Buffer.alloc(0),
      sampleRate: 16000,
      durationMs: 20000,
      language: "es-419",
      sttLocale: "es-PE",
    });
    expect(peru.text).toContain("universidad");
    expect(peru.words.some((w) => w.uncertain)).toBe(true);
  });
});

describe("language config", () => {
  it("only sends configured locales to transcription", () => {
    expect(resolveSttLocale("es-419", "es-MX")).toBe("es-MX");
    expect(resolveSttLocale("es-419", "pt-BR")).toBe(LANGUAGES["es-419"].sttLocale);
    expect(resolveSttLocale("fr")).toBe("fr-CA");
  });
});

describe("text helpers", () => {
  it("splits sentences without altering characters", () => {
    const text = "Avant mon baptême, j'avais peur. Ce jour-là, j'étais nerveuse!";
    expect(splitSentences(text, "fr-CA")).toEqual(["Avant mon baptême, j'avais peur.", "Ce jour-là, j'étais nerveuse!"]);
  });

  it("produces contiguous segments", () => {
    const segs = proportionalSegments(["a", "bbb"], 4000);
    expect(segs).toEqual([
      { text: "a", startMs: 0, endMs: 1000 },
      { text: "bbb", startMs: 1000, endMs: 4000 },
    ]);
  });
});
