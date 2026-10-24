// FABRICATED TEST DATA. Every name and story here is invented for the
// hackathon. None of it is real testimony or a real church record.
// The official sample stories linked in the brief have not been imported yet;
// add and credit them here when they are available.

import type { AgeGate } from "@/lib/domain/types";
import type { LanguageId } from "@/lib/domain/languages";

export interface StoryFixture {
  id: string;
  displayName: string;
  language: LanguageId;
  /** Regional transcription locale this fixture is meant to exercise. */
  sttLocale: string;
  ageGate: AgeGate;
  /** What the scenario tests (plan section 9). */
  scenario: string;
  text: string;
}

export const STORY_FIXTURES: StoryFixture[] = [
  {
    id: "fixture-en-jordan",
    displayName: "Jordan (fictional)",
    language: "en",
    sttLocale: "en-US",
    ageGate: "adult",
    scenario: "Ordinary short story",
    text:
      "Before I was baptized, I went to church with my aunt, but mostly I just sat in the back. " +
      "Last spring a friend asked me what I actually believed, and I didn't have an answer. " +
      "I started reading and asking questions, and baptism felt like the honest next step. " +
      "The water was colder than I expected. I want people to know you don't have to have it all figured out.",
  },
  {
    id: "fixture-en-riley-uncertain",
    displayName: "Riley (fictional)",
    language: "en",
    sttLocale: "en-US",
    ageGate: "adult",
    scenario: "Uncertainty stays; no dramatic before/after",
    text:
      "Nothing dramatic happened to me. I just kept showing up on Sundays. " +
      "I chose baptism because I wanted to say yes out loud. " +
      "Honestly, I don't know what happens next, and I think that's okay.",
  },
  {
    id: "fixture-en-sam-minor",
    displayName: "Sam (fictional)",
    language: "en",
    sttLocale: "en-US",
    ageGate: "under-18",
    scenario: "Minor: guardian gate must block capture, export and submission",
    text: "My youth group went to the lake together. My mom was there when I was baptized, and she cried.",
  },
  {
    id: "fixture-fr-camille",
    displayName: "Camille (fictive)",
    language: "fr",
    sttLocale: "fr-CA",
    ageGate: "adult",
    scenario: "Canadian French source",
    text:
      "Avant mon baptême, je pensais que la foi, c'était pour les autres. " +
      "Une voisine m'a invitée à un souper à son église, et j'ai continué à y aller. " +
      "J'ai choisi le baptême parce que je voulais commencer quelque chose de nouveau. " +
      "Ce jour-là, j'étais nerveuse, mais je me sentais entourée.",
  },
  {
    id: "fixture-es-mx-daniela",
    displayName: "Daniela (ficticia)",
    language: "es-419",
    sttLocale: "es-MX",
    ageGate: "adult",
    scenario: "Mexican Spanish source",
    text:
      "Antes de bautizarme, iba a la iglesia solo en Navidad. " +
      "Mi hermano empezó a ir cada semana y un día me pidió que lo acompañara. " +
      "Decidí bautizarme porque quería que mi familia supiera que esto es importante para mí. " +
      "Ese momento fue muy sencillo, pero no lo voy a olvidar.",
  },
  {
    id: "fixture-es-pe-mateo",
    displayName: "Mateo (ficticio)",
    language: "es-419",
    sttLocale: "es-PE",
    ageGate: "adult",
    scenario: "Peruvian Spanish source (separate from the Mexican case)",
    text:
      "Antes de mi bautizo, tenía muchas preguntas y pocas respuestas. " +
      "Un amigo de la universidad me invitó a un grupo de estudio los jueves. " +
      "Escogí bautizarme cuando entendí que no tenía que ser perfecto. " +
      "Quiero que otros sepan que pueden empezar con sus dudas.",
  },
  {
    id: "fixture-pt-br-lucas",
    displayName: "Lucas (fictício)",
    language: "pt-BR",
    sttLocale: "pt-BR",
    ageGate: "adult",
    scenario: "Brazilian Portuguese source",
    text:
      "Antes do meu batismo, eu estava passando por um tempo difícil no trabalho. " +
      "Um colega me convidou para um culto e eu fui só por educação. " +
      "Escolhi ser batizado porque encontrei uma comunidade que me acolheu. " +
      "Foi um momento de muita paz, e eu queria compartilhar isso com meus amigos.",
  },
];

/** Picks the fixture a mock transcription returns for a language and locale. */
export function fixtureFor(language: LanguageId, sttLocale?: string): StoryFixture {
  const candidates = STORY_FIXTURES.filter((f) => f.language === language && f.ageGate === "adult");
  return candidates.find((f) => f.sttLocale === sttLocale) ?? candidates[0];
}
