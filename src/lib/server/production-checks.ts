import "server-only";

import { missingOperatorSettings } from "@/lib/legal/operator";

/**
 * Settings a production server must have before it accepts anyone's story:
 * the real language service (mock mode and its placeholder results are for
 * development only) and the operator details the legal notices name.
 */
export function productionProblems(env: NodeJS.ProcessEnv = process.env): string[] {
  const problems: string[] = [];
  const provider = (env.LANGUAGE_PROVIDER ?? "").trim().toLowerCase();
  if (provider !== "gcp") {
    problems.push(`LANGUAGE_PROVIDER must be "gcp" in production (it is "${provider || "unset"}"). Mock mode is for development only.`);
  }
  if (!env.GOOGLE_API_KEY?.trim()) problems.push("GOOGLE_API_KEY is not set.");
  for (const name of missingOperatorSettings()) problems.push(`${name} is not set. The Terms of Use and Privacy Policy need it.`);
  return problems;
}

/**
 * Stops the process when a production setting is missing. Next would log a
 * thrown error and keep answering every request with 500; exiting makes the
 * deploy fail at once instead of serving a broken app.
 */
export function enforceProductionSettings(): void {
  const problems = productionProblems();
  if (problems.length === 0) return;
  console.error(`Refusing to start in production:\n- ${problems.join("\n- ")}`);
  process.exit(1);
}
