import "server-only";

import { gcpProvider } from "./gcp";
import { mockProvider } from "./mock";
import { ProviderError, type LanguageProvider } from "./types";

/**
 * Chosen by LANGUAGE_PROVIDER. A misconfigured "gcp" fails loudly instead of
 * silently falling back to mock results, and a production server never uses
 * the mock (the startup check refuses it too; this covers anything that slips by).
 */
export function getLanguageProvider(): LanguageProvider {
  const name = (process.env.LANGUAGE_PROVIDER ?? "mock").trim().toLowerCase();
  if (name === "mock") {
    if (process.env.NODE_ENV === "production") {
      throw new ProviderError("The language service isn't configured. Mock mode is for development only.", 500);
    }
    return mockProvider;
  }
  if (name === "gcp") return gcpProvider;
  throw new ProviderError(`Unknown LANGUAGE_PROVIDER "${name}". Use "mock" or "gcp".`, 500);
}

export { ProviderError } from "./types";
export type { LanguageProvider } from "./types";
