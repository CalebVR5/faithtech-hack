import type { LanguageId } from "@/lib/domain/languages";
import en from "./en";
import esLatam from "./es-419";
import fr from "./fr";
import ptBR from "./pt-BR";

export type Messages = typeof en;

export const MESSAGES: Record<LanguageId, Messages> = {
  en,
  fr,
  "es-419": esLatam,
  "pt-BR": ptBR,
};
