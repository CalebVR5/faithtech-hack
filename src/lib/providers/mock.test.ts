import { describe, expect, it } from "vitest";
import { STORY_FIXTURES } from "@/fixtures/stories";
import { LANGUAGE_IDS, LANGUAGES, resolveSttLocale } from "@/lib/domain/languages";
import { proportionalSegments, splitSentences } from "@/lib/domain/text";
import type { StoryType } from "@/lib/domain/types";
import { wavDurationMs } from "@/lib/media/wav";
import { mockProvider } from "./mock";

describe("mock provider", () => {
  it.each(STORY_FIXTURES)("synthesizes sample $id with captions spanning the audio", async ({ text, language }) => {
    const out = await mockProvider.synthesize({ text, language });
    expect(wavDurationMs(out.audio)).toBe(out.durationMs);
    expect(out.words.length).toBeGreaterThan(1);
    expect(out.words[0].startMs).toBe(0);
    expect(out.words.at(-1)!.endMs).toBe(out.durationMs);
    // The timed words are exactly the approved words.
    expect(out.words.map((w) => w.text).join(" ")).toBe(text);
  });

  it("labels mock translations", async () => {
    const out = await mockProvider.translate({ segments: ["Hello."], from: "en", to: "pt-BR" });
    expect(out).toEqual(["[mock pt] Hello."]);
  });

  const transcribe = (language: (typeof LANGUAGE_IDS)[number], storyType?: StoryType) =>
    mockProvider.transcribe({
      wav: Buffer.alloc(0),
      sampleRate: 16000,
      durationMs: 20000,
      language,
      sttLocale: LANGUAGES[language].sttLocale,
      storyType,
    });

  it("transcribes to the sample story in that language", async () => {
    const es = await transcribe("es-419");
    expect(es.text).toContain("mi nombre es Carla");
    expect(es.words.some((w) => w.uncertain)).toBe(true);
  });

  it("transcribes a testimony to a testimony sample", async () => {
    const pt = await transcribe("pt-BR", "testimony");
    expect(pt.text).toContain("meu nome é Rafael");
  });

  it.each(["fr", "pt-BR"] as const)("never returns another language's or path's sample for a %s baptism story", async (language) => {
    const out = await transcribe(language, "baptism");
    expect(STORY_FIXTURES.some((f) => f.text === out.text)).toBe(false);
    expect(out.text.length).toBeGreaterThan(0);
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
