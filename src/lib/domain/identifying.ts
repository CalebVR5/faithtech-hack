// Flags words the author may want to check before sharing (plan section 6,
// "Privacy by minimizing collection"). This is an aid for the author, not a
// safety detector: it misses things and flags harmless words. It never edits
// the story.

import { LANGUAGES, type LanguageId } from "./languages";
import { sentenceSpans } from "./text";

export type FlagKind = "name-or-place" | "number-or-date" | "family" | "place-or-group";

export interface IdentifyingFlag {
  text: string;
  kind: FlagKind;
  start: number;
  end: number;
}

const FAMILY: Record<LanguageId, string[]> = {
  en: ["mom", "mother", "dad", "father", "aunt", "uncle", "brother", "sister", "grandma", "grandmother", "grandpa", "grandfather", "cousin", "wife", "husband", "son", "daughter"],
  fr: ["mère", "maman", "père", "papa", "tante", "oncle", "frère", "sœur", "soeur", "grand-mère", "grand-père", "cousin", "cousine", "femme", "mari", "fils", "fille"],
  "es-419": ["mamá", "madre", "papá", "padre", "tía", "tío", "hermano", "hermana", "abuela", "abuelo", "primo", "prima", "esposa", "esposo", "hijo", "hija"],
  "pt-BR": ["mãe", "pai", "tia", "tio", "irmão", "irmã", "avó", "avô", "primo", "prima", "esposa", "marido", "filho", "filha"],
};

const PLACES: Record<LanguageId, string[]> = {
  en: ["church", "school", "university", "college", "work", "office", "street", "village", "town", "neighborhood", "lake", "river", "camp"],
  fr: ["église", "école", "université", "collège", "travail", "bureau", "rue", "village", "ville", "quartier", "lac", "rivière", "camp"],
  "es-419": ["iglesia", "escuela", "universidad", "colegio", "trabajo", "oficina", "calle", "pueblo", "barrio", "ciudad", "lago", "río", "campamento"],
  "pt-BR": ["igreja", "escola", "universidade", "faculdade", "trabalho", "escritório", "rua", "vila", "bairro", "cidade", "lago", "rio", "acampamento"],
};

/** Words that follow a spoken age ("fourteen years", "veintidós años"), so the age itself is flagged. */
const AGE_WORDS: Record<LanguageId, string[]> = {
  en: ["years", "year", "yrs"],
  fr: ["ans", "an"],
  "es-419": ["años", "año"],
  "pt-BR": ["anos", "ano"],
};

/** Capitalized words that are rarely identifying on their own. */
const COMMON_CAPITALIZED = new Set([
  "I", "I'm", "I've", "I'd", "I'll", "Sunday", "Sundays",
  // Testimonies name these often; they don't identify the storyteller.
  "God", "Jesus", "Christ", "Lord", "Bible",
  "Dieu", "Jésus", "Seigneur",
  "Dios", "Jesús", "Cristo", "Señor", "Biblia",
  "Deus", "Senhor", "Bíblia",
]);

const WORD = /[\p{L}\p{M}][\p{L}\p{M}'’-]*|\d+(?:[/.:-]\d+)*/gu;

export function findIdentifyingDetails(text: string, language: LanguageId): IdentifyingFlag[] {
  const locale = LANGUAGES[language].uiLocale;
  const family = new Set(FAMILY[language]);
  const places = new Set(PLACES[language]);
  const sentenceStarts = new Set(sentenceSpans(text, locale).map((s) => s.start));
  const ageWords = new Set(AGE_WORDS[language]);
  const flags: IdentifyingFlag[] = [];
  const seen = new Set<string>();
  const words = [...text.matchAll(WORD)];

  words.forEach((match, i) => {
    const word = match[0];
    const start = match.index;
    const end = start + word.length;
    const lower = word.toLocaleLowerCase(locale);
    const next = words[i + 1]?.[0].toLocaleLowerCase(locale);
    let kind: FlagKind | undefined;
    if (/^\d/.test(word) || (next !== undefined && ageWords.has(next))) kind = "number-or-date";
    else if (family.has(lower)) kind = "family";
    else if (places.has(lower)) kind = "place-or-group";
    else if (/^\p{Lu}/u.test(word) && !sentenceStarts.has(start) && !COMMON_CAPITALIZED.has(word)) kind = "name-or-place";
    // Each word once, so "grandma" isn't listed twice.
    if (kind && !seen.has(`${kind}:${lower}`)) {
      seen.add(`${kind}:${lower}`);
      flags.push({ text: word, kind, start, end });
    }
  });
  return flags;
}
