import { connection } from "next/server";
import { ffmpegPath, runFfmpeg } from "@/lib/server/ffmpeg";
import { usageSnapshot } from "@/lib/server/usage";

// Setup check: which provider is active and whether ffmpeg runs here. On a
// developer's machine it also shows the key's presence (never the key), paths
// and usage; in production it shows only what the app and a load balancer need.
export async function GET() {
  await connection();
  let ffmpeg: { ok: boolean; path: string; error?: string };
  try {
    await runFfmpeg(["-version"], 10_000);
    ffmpeg = { ok: true, path: ffmpegPath() };
  } catch (err) {
    ffmpeg = { ok: false, path: ffmpegPath(), error: (err as Error).message };
  }

  if (process.env.NODE_ENV === "production") {
    return Response.json(
      { provider: process.env.LANGUAGE_PROVIDER ?? "mock", ffmpeg: { ok: ffmpeg.ok } },
      { status: ffmpeg.ok ? 200 : 503, headers: { "Cache-Control": "no-store" } },
    );
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
