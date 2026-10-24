import "server-only";

import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import ffmpegStatic from "ffmpeg-static";
import { wavDurationMs } from "@/lib/media/wav";

// Resolution order keeps the demo portable across macOS and Windows:
// FFMPEG_PATH override → ffmpeg-static's bundled binary → ffmpeg on PATH.
export function ffmpegPath(): string {
  return process.env.FFMPEG_PATH || ffmpegStatic || "ffmpeg";
}

export class FfmpegError extends Error {
  constructor(message: string, readonly stderr: string) {
    super(message);
  }
}

/**
 * Runs ffmpeg with a fixed argument list. Never pass a shell string or
 * model-generated arguments here (plan section 4, option B technical path).
 */
export function runFfmpeg(args: string[], timeoutMs = 120_000): Promise<string> {
  return new Promise((resolve, reject) => {
    // The binary path is resolved at runtime; don't let the bundler trace the project for it.
    const child = spawn(/*turbopackIgnore: true*/ ffmpegPath(), ["-hide_banner", "-nostdin", "-y", ...args], {
      stdio: ["ignore", "ignore", "pipe"],
      windowsHide: true,
    });
    let stderr = "";
    child.stderr.on("data", (chunk) => {
      // Keep only the tail; ffmpeg logs can be long.
      stderr = (stderr + chunk).slice(-8000);
    });
    const timer = setTimeout(() => child.kill(), timeoutMs);
    child.on("error", (err) => {
      clearTimeout(timer);
      reject(new FfmpegError(`ffmpeg could not start (${err.message}). Set FFMPEG_PATH or reinstall ffmpeg-static.`, ""));
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) resolve(stderr);
      else reject(new FfmpegError(`ffmpeg exited with code ${code}`, stderr));
    });
  });
}

/** Creates a private scratch directory and always removes it afterwards. */
export async function withScratchDir<T>(fn: (dir: string) => Promise<T>): Promise<T> {
  const dir = await mkdtemp(path.join(tmpdir(), "testimony-"));
  try {
    return await fn(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

export interface NormalizedAudio {
  wav: Buffer;
  sampleRate: number;
  durationMs: number;
}

/**
 * Converts any browser recording (Chrome WebM/Opus, Safari MP4/AAC, uploads)
 * to 16 kHz mono 16-bit WAV. Files rather than pipes: MP4 input needs a
 * seekable source, and WAV output needs a seekable target for correct headers.
 */
export async function normalizeAudio(input: Buffer, sampleRate = 16_000): Promise<NormalizedAudio> {
  return withScratchDir(async (dir) => {
    const inPath = path.join(dir, "input");
    const outPath = path.join(dir, "output.wav");
    await writeFile(inPath, input);
    await runFfmpeg([
      "-i", inPath,
      "-map_metadata", "-1",
      "-vn",
      "-ac", "1",
      "-ar", String(sampleRate),
      "-c:a", "pcm_s16le",
      outPath,
    ]);
    const wav = await readFile(outPath);
    return { wav, sampleRate, durationMs: wavDurationMs(wav) };
  });
}

/**
 * Quotes a filesystem path as a filter option value, for example
 * `subtitles=filename=${toFilterPath(p)}`. Filter strings are unescaped twice:
 * once by the filtergraph parser (the single quotes) and once by the option
 * parser (the backslash before ":"). Escaping only once leaves a Windows drive
 * colon to split the option, which fails with "Unable to parse option value".
 */
export function toFilterPath(p: string): string {
  const optionLevel = p.replace(/\\/g, "/").replace(/:/g, "\\:");
  // A quote can't appear inside '…'; close, add an escaped quote, reopen.
  return `'${optionLevel.replace(/'/g, "'\\\\\\''")}'`;
}
