// Text burned into exported cards and videos, in the output's language so the
// audience can read it. Drafted for the prototype; human review of these
// translations is deferred with the rest of language review (revision 4).

import type { LanguageId } from "./languages";
import type { OutputKind, StoryType } from "./types";

/** Generic filename: no name, language or story details in it (plan section 6). */
export function exportFilename(storyType: StoryType, kind: OutputKind): string {
  return `${storyType === "testimony" ? "testimony" : "baptism-story"}.${kind === "card" ? "png" : "mp4"}`;
}

export interface OutputLabels {
  /** The heading on cards and plain-background videos, by path. */
  storyLabel: Record<StoryType, string>;
  excerpt: string;
  synthetic: string;
  machineTranslated: string;
}

export const OUTPUT_LABELS: Record<LanguageId, OutputLabels> = {
  en: {
    storyLabel: { baptism: "MY BAPTISM STORY", testimony: "MY TESTIMONY" },
    excerpt: "EXCERPT",
    synthetic: "Synthetic narration • words approved by the storyteller",
    machineTranslated: "Machine translated — not independently reviewed",
  },
  fr: {
    storyLabel: { baptism: "MON HISTOIRE DE BAPTÊME", testimony: "MON TÉMOIGNAGE" },
    excerpt: "EXTRAIT",
    synthetic: "Narration synthétique • texte approuvé par la personne qui raconte",
    machineTranslated: "Traduction automatique — non vérifiée de façon indépendante",
  },
  "es-419": {
    storyLabel: { baptism: "MI HISTORIA DE BAUTISMO", testimony: "MI TESTIMONIO" },
    excerpt: "FRAGMENTO",
    synthetic: "Narración sintética • palabras aprobadas por quien cuenta la historia",
    machineTranslated: "Traducción automática — sin revisión independiente",
  },
  "pt-BR": {
    storyLabel: { baptism: "MINHA HISTÓRIA DE BATISMO", testimony: "MEU TESTEMUNHO" },
    excerpt: "TRECHO",
    synthetic: "Narração sintética • palavras aprovadas por quem conta a história",
    machineTranslated: "Tradução automática — sem revisão independente",
  },
};
