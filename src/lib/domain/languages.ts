// Display language, transcription locale, voice locale and translation code are
// mapped separately on purpose (plan section 5). Never send a UI locale to every
// service unchanged.
//
// Provider codes and voice names are initial choices to confirm in the GCP
// spike: check them against the Speech-to-Text, Text-to-Speech and Translation
// language lists before relying on them.

export const LANGUAGE_IDS = ["en", "fr", "es-419", "pt-BR"] as const;
export type LanguageId = (typeof LANGUAGE_IDS)[number];

export interface LanguageConfig {
  id: LanguageId;
  /** Shown to people in the language picker. Language names, never flags. */
  displayName: string;
  /** BCP 47 tag for the <html lang> attribute and Intl APIs. */
  uiLocale: string;
  /** Default Speech-to-Text locale, plus regional alternatives the person can pick. */
  sttLocale: string;
  sttAlternatives: string[];
  /** Text-to-Speech voice locale and the single stock voice used for the prototype. */
  ttsLocale: string;
  ttsVoice: string;
  /** Cloud Translation target/source code. */
  translateCode: string;
}

export const LANGUAGES: Record<LanguageId, LanguageConfig> = {
  en: {
    id: "en",
    displayName: "English",
    uiLocale: "en-US",
    sttLocale: "en-US",
    sttAlternatives: ["en-CA"],
    ttsLocale: "en-US",
    ttsVoice: "en-US-Standard-C",
    translateCode: "en",
  },
  fr: {
    id: "fr",
    displayName: "Français",
    uiLocale: "fr-CA",
    sttLocale: "fr-CA",
    sttAlternatives: ["fr-FR"],
    ttsLocale: "fr-CA",
    ttsVoice: "fr-CA-Standard-A",
    translateCode: "fr",
  },
  "es-419": {
    id: "es-419",
    displayName: "Español (Latinoamérica)",
    uiLocale: "es-419",
    sttLocale: "es-US",
    sttAlternatives: ["es-MX", "es-PE"],
    ttsLocale: "es-US",
    ttsVoice: "es-US-Standard-A",
    translateCode: "es",
  },
  "pt-BR": {
    id: "pt-BR",
    displayName: "Português (Brasil)",
    uiLocale: "pt-BR",
    sttLocale: "pt-BR",
    sttAlternatives: [],
    ttsLocale: "pt-BR",
    ttsVoice: "pt-BR-Standard-A",
    translateCode: "pt",
  },
};

export function isLanguageId(value: unknown): value is LanguageId {
  return typeof value === "string" && (LANGUAGE_IDS as readonly string[]).includes(value);
}

/** Only locales configured for that language may be sent to transcription. */
export function resolveSttLocale(language: LanguageId, requested?: string): string {
  const config = LANGUAGES[language];
  if (requested && (requested === config.sttLocale || config.sttAlternatives.includes(requested))) {
    return requested;
  }
  return config.sttLocale;
}
