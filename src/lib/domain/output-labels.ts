// Text burned into exported cards and videos, in the output's language so the
// audience can read it. Drafted for the prototype; human review of these
// translations is deferred with the rest of language review (revision 4).

import type { LanguageId } from "./languages";

export interface OutputLabels {
  storyLabel: string;
  excerpt: string;
  synthetic: string;
  machineTranslated: string;
  prototype: string;
}

export const OUTPUT_LABELS: Record<LanguageId, OutputLabels> = {
  en: {
    storyLabel: "MY BAPTISM STORY",
    excerpt: "EXCERPT",
    synthetic: "Synthetic narration • words approved by the storyteller",
    machineTranslated: "Machine translated — not independently reviewed",
    prototype: "Prototype • fictional story",
  },
  fr: {
    storyLabel: "MON HISTOIRE DE BAPTÊME",
    excerpt: "EXTRAIT",
    synthetic: "Narration synthétique • texte approuvé par la personne qui raconte",
    machineTranslated: "Traduction automatique — non vérifiée de façon indépendante",
    prototype: "Prototype • histoire fictive",
  },
  "es-419": {
    storyLabel: "MI HISTORIA DE BAUTISMO",
    excerpt: "FRAGMENTO",
    synthetic: "Narración sintética • palabras aprobadas por quien cuenta la historia",
    machineTranslated: "Traducción automática — sin revisión independiente",
    prototype: "Prototipo • historia ficticia",
  },
  "pt-BR": {
    storyLabel: "MINHA HISTÓRIA DE BATISMO",
    excerpt: "TRECHO",
    synthetic: "Narração sintética • palavras aprovadas por quem conta a história",
    machineTranslated: "Tradução automática — sem revisão independente",
    prototype: "Protótipo • história fictícia",
  },
};
