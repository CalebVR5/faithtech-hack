import { describe, expect, it } from "vitest";
import { STORY_FIXTURES } from "@/fixtures/stories";
import { alignWords, buildSlides, MAX_SLIDE_CHARS, paceWords, sentencesFromWords, snapToPauses, tokenize, type TimedWord } from "./timing";

/** Words spoken one after another, each `ms` long, with optional extra pauses after given words. */
function spoken(text: string, ms = 300, pauses: Record<number, number> = {}): TimedWord[] {
  let t = 500;
  return tokenize(text).map((word, i) => {
    const w = { text: word, startMs: t, endMs: t + ms };
    t += ms + 40 + (pauses[i] ?? 0);
    return w;
  });
}

const sampleA = STORY_FIXTURES.find((f) => f.id === "sample-a-rambling")!.text;

describe("buildSlides", () => {
  const words = spoken(sampleA);
  const end = words.at(-1)!.endMs + 500;
  const slides = buildSlides(words, "en-US", end);

  it("keeps every word, in order", () => {
    expect(slides.map((s) => s.text).join(" ")).toBe(tokenize(sampleA).join(" "));
  });

  it("never starts a slide with the end of the previous sentence or ends it with the start of the next", () => {
    for (const s of slides) {
      // Any sentence end inside a slide must be the slide's end, unless two short sentences were merged.
      const inner = s.text.slice(0, -1).match(/[.!?](?=\s)/g) ?? [];
      if (inner.length > 0) expect(s.text.length).toBeLessThanOrEqual(42);
    }
    expect(slides.some((s) => s.text.startsWith("Then one night"))).toBe(true);
    expect(slides.some((s) => s.text.startsWith("Fast forward a year"))).toBe(true);
  });

  it("fits each slide and prefers breaking long sentences at commas", () => {
    for (const s of slides) expect(s.text.length).toBeLessThanOrEqual(MAX_SLIDE_CHARS);
    const first = slides.filter((s) => sampleA.startsWith("So okay") && slides.indexOf(s) < 5);
    const commaBreaks = first.filter((s) => /,$/.test(s.text)).length;
    expect(commaBreaks).toBeGreaterThan(0);
  });

  it("shows each slide just before its first word is spoken, with no overlaps", () => {
    let wi = 0;
    for (let i = 0; i < slides.length; i++) {
      const firstWord = words[wi];
      expect(slides[i].startMs).toBeLessThanOrEqual(firstWord.startMs);
      expect(firstWord.startMs - slides[i].startMs).toBeLessThanOrEqual(120);
      if (i > 0) expect(slides[i].startMs).toBeGreaterThanOrEqual(slides[i - 1].endMs);
      wi += tokenize(slides[i].text).length;
      // Still on screen while its last word is being said.
      expect(slides[i].endMs).toBeGreaterThanOrEqual(words[wi - 1].endMs);
    }
  });

  it("merges two short sentences instead of flashing them", () => {
    expect(slides.some((s) => s.text === "That's it. That's the story.")).toBe(true);
  });

  it("breaks an unpunctuated run at the speaker's pause", () => {
    // Speech services sometimes miss a full stop; the pause still marks the thought.
    const run = spoken("then one night I just went people were just normal and kind and I kept going back every week after that", 300, {
      5: 900,
    });
    const out = buildSlides(run, "en-US", 20_000, 50);
    expect(out[0].text).toBe("then one night I just went");
  });
});

describe("alignWords", () => {
  const heard: TimedWord[] = [
    { text: "then", startMs: 100, endMs: 300 },
    { text: "1", startMs: 320, endMs: 500 },
    { text: "night", startMs: 520, endMs: 800 },
    { text: "I", startMs: 900, endMs: 950 },
    { text: "just", startMs: 960, endMs: 1200 },
    { text: "went", startMs: 1210, endMs: 1500 },
  ];

  it("keeps the recording's timing for matching words, ignoring case and punctuation", () => {
    const out = alignWords("Then one night, I just went.", heard, 2000);
    expect(out.map((w) => w.text)).toEqual(["Then", "one", "night,", "I", "just", "went."]);
    expect(out[0]).toMatchObject({ startMs: 100, endMs: 300 });
    expect(out[2]).toMatchObject({ startMs: 520, endMs: 800 });
    expect(out[5]).toMatchObject({ startMs: 1210, endMs: 1500 });
  });

  it("places a corrected word in the gap where it was said", () => {
    const out = alignWords("Then one night, I just went.", heard, 2000);
    expect(out[1].startMs).toBeGreaterThanOrEqual(300);
    expect(out[1].endMs).toBeLessThanOrEqual(520);
  });

  it("matches near spellings such as a corrected accent", () => {
    const out = alignWords("je me sentais entourée", [
      { text: "je", startMs: 0, endMs: 100 },
      { text: "me", startMs: 110, endMs: 200 },
      { text: "sentais", startMs: 210, endMs: 600 },
      { text: "entouré", startMs: 610, endMs: 1100 },
    ], 1200);
    expect(out[3]).toMatchObject({ text: "entourée", startMs: 610, endMs: 1100 });
  });

  it("keeps times in order when words are added", () => {
    const out = alignWords("Then one cold night I finally just went", heard, 2000);
    for (let i = 1; i < out.length; i++) expect(out[i].startMs).toBeGreaterThanOrEqual(out[i - 1].startMs);
  });
});

describe("sentencesFromWords and paceWords", () => {
  it("groups words into whole sentences with their spoken span", () => {
    const words = spoken("I was lost. Now I'm not. Got baptized Sunday.");
    const sentences = sentencesFromWords(words, "en-US");
    expect(sentences.map((s) => s.text)).toEqual(["I was lost.", "Now I'm not.", "Got baptized Sunday."]);
    expect(sentences[1].startMs).toBe(words[3].startMs);
  });

  it("paces silent captions in order", () => {
    const { words, durationMs } = paceWords("I was lost. Now I'm not.", "en-US");
    expect(words).toHaveLength(6);
    expect(durationMs).toBeGreaterThan(words.at(-1)!.endMs);
  });
});

describe("snapToPauses", () => {
  // Speech-to-text put "Then" 300ms late and stretched "no." across the pause.
  const heard: TimedWord[] = [
    { text: "saying", startMs: 1000, endMs: 1400 },
    { text: "no.", startMs: 1400, endMs: 2100 },
    { text: "Then", startMs: 2400, endMs: 2600 },
    { text: "one", startMs: 2600, endMs: 2800 },
  ];

  it("starts the next word when sound resumes and ends the last one when it stopped", () => {
    const out = snapToPauses(heard, [{ startMs: 1650, endMs: 2080 }]);
    expect(out[2]).toMatchObject({ text: "Then", startMs: 2080 });
    expect(out[1]).toMatchObject({ text: "no.", endMs: 1650 });
    expect(out[0].startMs).toBe(1000);
    for (let i = 1; i < out.length; i++) expect(out[i].startMs).toBeGreaterThanOrEqual(out[i - 1].endMs);
  });

  it("picks the punctuated boundary when the speech service's times are a word off", () => {
    // Real pause after "fourteen," but the service put the gap between "and" and "then".
    const shifted: TimedWord[] = [
      { text: "like", startMs: 4700, endMs: 5000 },
      { text: "fourteen,", startMs: 5000, endMs: 5600 },
      { text: "and", startMs: 5600, endMs: 5790 },
      { text: "then", startMs: 6020, endMs: 6200 },
      { text: "college", startMs: 6200, endMs: 6700 },
    ];
    const out = snapToPauses(shifted, [{ startMs: 5810, endMs: 6020 }]);
    expect(out[2]).toMatchObject({ text: "and", startMs: 6020 });
    expect(out[1].endMs).toBe(5810);
  });

  it("ignores pauses far from any word boundary", () => {
    expect(snapToPauses(heard, [{ startMs: 5000, endMs: 5400 }])).toEqual(heard);
  });

  it("keeps the captions in step: the slide after a pause appears as speech resumes", () => {
    const words = [
      ...spoken("I kept saying no to him every week.", 250).map((w) => ({ ...w })),
    ];
    const lastEnd = words.at(-1)!.endMs;
    // The speech service says the next sentence starts 300ms after it really does.
    const next = spoken("Then one night I just went.", 250).map((w) => ({ ...w, startMs: w.startMs + lastEnd + 300, endMs: w.endMs + lastEnd + 300 }));
    const realStart = lastEnd + 400 + 500 - 300; // when sound actually resumes
    const out = snapToPauses([...words, ...next], [{ startMs: lastEnd, endMs: realStart }]);
    const slides = buildSlides(out, "en-US", 10_000);
    expect(slides[1].text).toBe("Then one night I just went.");
    expect(slides[1].startMs).toBe(realStart - 120);
  });
});
