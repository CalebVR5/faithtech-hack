import { connection } from "next/server";
import { ffmpegPath, runFfmpeg } from "@/lib/server/ffmpeg";
import { usageSnapshot } from "@/lib/server/usage";

// Setup check for each teammate's laptop: which provider is active, whether
// the key is present, and whether ffmpeg runs on this OS. Never returns the key.
export async function GET() {
  await connection();
  let ffmpeg: { ok: boolean; path: string; error?: string };
  try {
    await runFfmpeg(["-version"], 10_000);
    ffmpeg = { ok: true, path: ffmpegPath() };
  } catch (err) {
    ffmpeg = { ok: false, path: ffmpegPath(), error: (err as Error).message };
  }

  return Response.json(
    {
      provider: process.env.LANGUAGE_PROVIDER ?? "mock",
      googleApiKeyPresent: Boolean(process.env.GOOGLE_API_KEY),
      platform: process.platform,
      node: process.version,
      ffmpeg,
      usage: usageSnapshot(),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
