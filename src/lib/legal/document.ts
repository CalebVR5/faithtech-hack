// The shape of the Terms of Use and Privacy Policy in every language. Each
// language file builds both from the operator's details and the app's real
// limits (LegalFacts), so the published notices can't drift from what the code
// does. Text may contain "{email}", "{terms}" and "{privacy}", which the page
// turns into links.

import { STORY_TTL_MS, TEMP_FILE_TTL_MS } from "@/lib/domain/limits";

export type Block = string | { list: string[] };

export interface LegalSection {
  id: string;
  heading: string;
  blocks: Block[];
}

export interface LegalDocument {
  title: string;
  /** One or two sentences above the contents. */
  summary: string;
  sections: LegalSection[];
}

/** Operator details as shown to readers. */
export interface OperatorView {
  name: string;
  address: string;
  state: string;
}

/** Figures the notices state, taken from the code that enforces them. */
export const LEGAL_FACTS = {
  storyHours: STORY_TTL_MS / 3_600_000,
  mediaHours: TEMP_FILE_TTL_MS / 3_600_000,
  /** Google Cloud Logging's default retention for request logs; shorten it in the project, never lengthen it. */
  logDays: 30,
  /** Days to answer a privacy request, the strictest common US state deadline. */
  responseDays: 45,
} as const;

export type LegalFacts = typeof LEGAL_FACTS;

export interface LegalContent {
  privacy: (o: OperatorView, f: LegalFacts) => LegalDocument;
  terms: (o: OperatorView, f: LegalFacts) => LegalDocument;
}
