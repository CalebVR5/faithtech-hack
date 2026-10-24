import "server-only";

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { CARD_SIZE, cardAss, faceVideoAss, PALETTE, VIDEO_SIZE, videoAss, type CardLayoutInput, type VideoLayoutInput } from "@/lib/render/ass";
import { runFfmpeg, toFilterPath, withScratchDir } from "./ffmpeg";

// Renderers for option A (card → PNG) and option C (narration over a neutral
// background → MP4). Fixed templates and validated parameters only; nothing
// here comes from a model (plan section 4). Outputs carry no source metadata.

/** Bundled OFL fonts, so captions look the same on every OS (see README). */
export function fontsDir(): string {
  return path.join(/*turbopackIgnore: true*/ process.cwd(), "assets", "fonts");
}

function subtitlesFilter(assPath: string): string {
  return `subtitles=filename=${toFilterPath(assPath)}:fontsdir=${toFilterPath(fontsDir())}`;
}

function background(size: { width: number; height: number }, fps?: number): string {
  const rate = fps ? `:r=${fps}` : "";
  return `color=c=0x${PALETTE.background.slice(1)}:s=${size.width}x${size.height}${rate}`;
}

export async function renderCardPng(input: CardLayoutInput): Promise<Buffer> {
  return withScratchDir(async (dir) => {
    const assPath = path.join(dir, "card.ass");
    const outPath = path.join(dir, "card.png");
    await writeFile(assPath, cardAss(input), "utf8");
    await runFfmpeg([
      "-f", "lavfi", "-i", background(CARD_SIZE),
      "-vf", subtitlesFilter(assPath),
      "-frames:v", "1",
      "-map_metadata", "-1",
      outPath,
    ]);
    return readFile(outPath);
  });
}

export interface VideoRenderInput extends VideoLayoutInput {
  /** WAV narration; omitted for "No voice", which gets a silent track so every app accepts the file. */
  audio?: Buffer;
}

export async function renderNarratedMp4(input: VideoRenderInput): Promise<Buffer> {
  return withScratchDir(async (dir) => {
    const assPath = path.join(dir, "captions.ass");
    const audioPath = path.join(dir, "narration.wav");
    const outPath = path.join(dir, "story.mp4");
    await writeFile(assPath, videoAss(input), "utf8");
    if (input.audio) await writeFile(audioPath, input.audio);

    const seconds = (input.durationMs / 1000 + 0.5).toFixed(2);
    await runFfmpeg(
      [
        "-f", "lavfi", "-i", background(VIDEO_SIZE, 24),
        ...(input.audio ? ["-i", audioPath] : ["-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo"]),
        "-map", "0:v", "-map", "1:a",
        "-vf", subtitlesFilter(assPath),
        // Hold silence after the narration ends so the last caption isn't cut off.
        ...(input.audio ? ["-af", "apad"] : []),
        "-c:v", "libx264", "-preset", "veryfast", "-tune", "stillimage", "-crf", "23", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "128k", "-ar", "48000", "-ac", "2",
        // Only the streams above: no source metadata, chapters or attachments.
        "-map_metadata", "-1", "-map_chapters", "-1",
        "-t", seconds,
        "-movflags", "+faststart",
        outPath,
      ],
      180_000,
    );
    return readFile(outPath);
  });
}

export interface FaceVideoRenderInput extends VideoLayoutInput {
  /** The person's original camera recording or uploaded video. */
  video: Buffer;
}

/**
 * Option B: the person's own footage and voice with burned-in captions. The
 * frame is fitted inside 9:16 and padded rather than cropped, so nothing is cut
 * out of the picture. Only the first video and audio streams are re-encoded;
 * source metadata, rotation tags, chapters and attachments are dropped.
 */
export async function renderFaceMp4(input: FaceVideoRenderInput): Promise<Buffer> {
  return withScratchDir(async (dir) => {
    const inPath = path.join(dir, "source");
    const assPath = path.join(dir, "captions.ass");
    const outPath = path.join(dir, "story.mp4");
    await writeFile(inPath, input.video);
    await writeFile(assPath, faceVideoAss(input), "utf8");

    const { width, height } = VIDEO_SIZE;
    const fit = [
      `scale=${width}:${height}:force_original_aspect_ratio=decrease`,
      `pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=0x${PALETTE.background.slice(1)}`,
      "setsar=1",
      "fps=30",
      subtitlesFilter(assPath),
    ].join(",");
    await runFfmpeg(
      [
        "-i", inPath,
        "-map", "0:v:0", "-map", "0:a:0",
        "-vf", fit,
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "23", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "128k", "-ar", "48000", "-ac", "2",
        "-map_metadata", "-1", "-map_chapters", "-1", "-sn", "-dn",
        "-t", (input.durationMs / 1000).toFixed(2),
        "-movflags", "+faststart",
        outPath,
      ],
      240_000,
    );
    return readFile(outPath);
  });
}
