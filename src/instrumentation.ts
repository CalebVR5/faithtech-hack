// Runs once when a server starts. A production server refuses to start in mock
// mode or without the operator details the legal notices need, so no one's
// story is ever handled with placeholder results or under an incomplete policy.
// `next build` sets NEXT_PHASE and is skipped: settings are checked where the
// server runs, not where it's built.

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NODE_ENV !== "production" || process.env.NEXT_PHASE === "phase-production-build") return;

  const { enforceProductionSettings } = await import("./lib/server/production-checks");
  enforceProductionSettings();
}
