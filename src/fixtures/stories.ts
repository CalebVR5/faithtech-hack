// FABRICATED TEST DATA. The baptism samples are the hackathon's "Sample raw
// testimonies (all made up)"; the testimony samples were written for this
// project in the same spirit. None of it is real testimony or a real church
// record. Text is kept verbatim, including filler words and apologies, because
// faithfully handling raw speech is what these samples test.

import type { LanguageId } from "@/lib/domain/languages";
import type { StoryType } from "@/lib/domain/types";

export interface StoryFixture {
  id: string;
  /** Only offered on this path, so a sample never carries the other path's label. */
  storyType: StoryType;
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
    storyType: "baptism",
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
    storyType: "baptism",
    title: "B · Very short",
    language: "en",
    sttLocale: "en-US",
    scenario: "Very short story: a few words are enough, nothing gets padded",
    text: "I was lost. Now I'm not. Got baptized Sunday.",
  },
  {
    id: "sample-c-voice-note",
    storyType: "baptism",
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
  {
    id: "sample-t1-before-after",
    storyType: "testimony",
    title: "T1 · Before, how, after",
    language: "en",
    sttLocale: "en-US",
    scenario: "Follows the three questions in order; a coworker's name, a city and a year get flagged",
    text:
      "Before I knew Christ I was honestly angry pretty much all the time. I drank most weekends, I lied to " +
      "my mom about where I was, and I didn't really care who I hurt. My coworker Marcus never preached at " +
      "me, he just asked how I was doing, like every single day. When my dad got sick in 2019 Marcus drove " +
      "me to the hospital in Tulsa and prayed with me in the parking lot, and something in me just broke " +
      "open. I started reading the Bible he gave me and a few months later I gave my life to Jesus. I'm not " +
      "perfect now. But I'm not angry like that anymore, I call my mom every Sunday, and I tell the truth " +
      "even when it costs me.",
  },
  {
    id: "sample-t2-quiet",
    storyType: "testimony",
    title: "T2 · Raised in church",
    language: "fr",
    sttLocale: "fr-CA",
    scenario: "Short, quiet testimony with no dramatic turning point; nothing gets padded",
    text:
      "J'ai grandi à l'église, alors je n'ai pas d'histoire spectaculaire. Mais vers vingt ans, j'ai compris " +
      "que la foi de mes parents devait devenir la mienne. Aujourd'hui, je prie pour vrai, pas par habitude.",
  },
  {
    id: "sample-t3-voice-note",
    storyType: "testimony",
    title: "T3 · Voice-note style",
    language: "pt-BR",
    sttLocale: "pt-BR",
    scenario: "Portuguese voice note: a name, an age, a wife and a city get flagged for review",
    text:
      "Oi, então, meu nome é Rafael, tenho trinta e um anos. Antes eu vivia só pra mim, sabe, trabalho, " +
      "festa, e não ligava pra ninguém. Minha esposa começou a ir numa igreja em Campinas e eu ia só pra " +
      "levar ela. Um dia o pastor falou do filho pródigo e eu chorei igual criança, não sei explicar. " +
      "Hoje eu ainda erro, mas eu peço perdão, eu tô presente em casa e ajudo com os jovens. Se você tá " +
      "longe de Deus, ele não desistiu de você.",
  },
  {
    id: "sample-t4-family",
    storyType: "testimony",
    title: "T4 · A family member",
    language: "es-419",
    sttLocale: "es-MX",
    scenario: "Spanish testimony about a sister: the family member gets flagged, the faith words don't",
    text:
      "Yo antes era muy orgullosa y peleaba con todos, sobre todo con mi hermana. Una compañera del trabajo " +
      "me invitó a un grupo de oración y fui por compromiso. Ahí escuché que Dios me amaba así como era, y " +
      "eso me desarmó. Esa misma noche le entregué mi vida a Cristo. Ahora hablo con mi hermana cada semana " +
      "y estoy aprendiendo a escuchar antes de hablar.",
  },
];

/** Samples offered on one path. */
export function fixturesFor(storyType: StoryType): StoryFixture[] {
  return STORY_FIXTURES.filter((f) => f.storyType === storyType);
}

/** The sample a mock transcription returns for a language and path, preferring a matching locale. */
export function fixtureFor(language: LanguageId, sttLocale?: string, storyType: StoryType = "baptism"): StoryFixture | undefined {
  const candidates = fixturesFor(storyType).filter((f) => f.language === language);
  return candidates.find((f) => f.sttLocale === sttLocale) ?? candidates[0];
}
