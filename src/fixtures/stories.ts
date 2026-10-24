// FABRICATED TEST DATA: the hackathon's "Sample raw testimonies (all made up)".
// None of it is real testimony or a real church record. Text is kept verbatim,
// including filler words and apologies, because faithfully handling raw speech
// is what these samples test.

import type { LanguageId } from "@/lib/domain/languages";

export interface StoryFixture {
  id: string;
  /** Shown in the sample picker. */
  title: string;
  language: LanguageId;
  /** Transcription locale used when this sample stands in for a recording. */
  sttLocale: string;
  /** What the scenario tests (plan section 9). */
  scenario: string;
  text: string;
}

export const STORY_FIXTURES: StoryFixture[] = [
  {
    id: "sample-a-rambling",
    title: "A · Long and rambling",
    language: "en",
    sttLocale: "en-US",
    scenario: "Rambling story: pick a passage for the card without changing its meaning",
    text:
      "So okay, I grew up kind of going to church with my grandma but I stopped when I was like fourteen, " +
      "and then college happened and honestly a lot of stuff happened, my parents split, I was working " +
      "nights, and my friend Dani kept inviting me to this Tuesday thing and I kept saying no. Then one " +
      "night I just went. I don't know. People were just normal and kind. Fast forward a year and I'm in " +
      "the water at the beach and my grandma is there crying. That's it. That's the story. Sorry it's long.",
  },
  {
    id: "sample-b-short",
    title: "B · Very short",
    language: "en",
    sttLocale: "en-US",
    scenario: "Very short story: a few words are enough, nothing gets padded",
    text: "I was lost. Now I'm not. Got baptized Sunday.",
  },
  {
    id: "sample-c-voice-note",
    title: "C · Voice-note style",
    language: "es-419",
    sttLocale: "es-US",
    scenario: "Spanish voice note: a name and age in the story get flagged for review",
    text:
      "Bueno, mi nombre es Carla, tengo veintidós años. Yo no creía en nada, la verdad. Pero cuando mi " +
      "mamá se enfermó, la iglesia del barrio nos ayudó muchísimo, nos traían comida. Y ahí empecé a " +
      "preguntar. Ayer me bauticé y siento que empiezo de nuevo. Si alguien está dudando, que vaya, que " +
      "pregunte, nadie te juzga.",
  },
];

/** The sample a mock transcription returns for a language, preferring a matching locale. */
export function fixtureFor(language: LanguageId, sttLocale?: string): StoryFixture | undefined {
  const candidates = STORY_FIXTURES.filter((f) => f.language === language);
  return candidates.find((f) => f.sttLocale === sttLocale) ?? candidates[0];
}
