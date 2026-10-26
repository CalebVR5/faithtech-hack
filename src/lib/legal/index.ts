import type { LanguageId } from "@/lib/domain/languages";
import type { LegalContent } from "./document";
import { en } from "./en";
import { esLatam } from "./es-419";
import { fr } from "./fr";
import { ptBR } from "./pt-BR";

/** The notices in every interface language. English is the controlling version. */
export const LEGAL: Record<LanguageId, LegalContent> = {
  en,
  fr,
  "es-419": esLatam,
  "pt-BR": ptBR,
};

export type { Block, LegalDocument, LegalSection, OperatorView } from "./document";
export { LEGAL_FACTS } from "./document";
