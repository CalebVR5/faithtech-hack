import "server-only";

// Who runs the service, as named in the Terms of Use and Privacy Policy. Set
// by environment, never written into the code, so the operator can change
// (a person today, an organization later) without editing the notices.
// A production server refuses to start until every value is set
// (src/instrumentation.ts), so the published notices never show a gap.

export interface OperatorInfo {
  /** Legal name of the person or organization operating the service. */
  name: string;
  /** Where privacy requests and questions go. */
  email: string;
  /** Postal address for legal notices. */
  address: string;
  /** US state whose law governs the Terms, for example "Colorado". */
  state: string;
}

const SETTINGS = {
  name: "LEGAL_OPERATOR_NAME",
  email: "LEGAL_CONTACT_EMAIL",
  address: "LEGAL_MAILING_ADDRESS",
  state: "LEGAL_GOVERNING_STATE",
} as const satisfies Record<keyof OperatorInfo, string>;

/** Names of the operator settings that are missing or empty. */
export function missingOperatorSettings(): string[] {
  return Object.values(SETTINGS).filter((env) => !process.env[env]?.trim());
}

/** The operator's details, or null while any of them is unset (development only). */
export function operatorInfo(): OperatorInfo | null {
  if (missingOperatorSettings().length > 0) return null;
  return {
    name: process.env[SETTINGS.name]!.trim(),
    email: process.env[SETTINGS.email]!.trim(),
    address: process.env[SETTINGS.address]!.trim(),
    state: process.env[SETTINGS.state]!.trim(),
  };
}
