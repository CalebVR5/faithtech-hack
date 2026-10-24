import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { STORY_FIXTURES } from "@/fixtures/stories";
import { chunkSegments } from "@/lib/domain/captions";
import { OUTPUT_LABELS } from "@/lib/domain/output-labels";
import { proportionalSegments, splitSentences } from "@/lib/domain/text";
import { toneWav } from "@/lib/media/wav";
import { runFfmpeg, toFilterPath } from "./ffmpeg";
import { renderCardPng, renderNarratedMp4 } from "./render";

// Runs the real bundled ffmpeg. Set RENDER_PREVIEW_DIR to keep the outputs for
// a visual check of the templates.
const keepDir = process.env.RENDER_PREVIEW_DIR;

async function keep(name: string, data: Buffer) {
  if (!keepDir) return;
  await mkdir(keepDir, { recursive: true });
  await writeFile(path.join(keepDir, name), data);
}

describe("renderers", { timeout: 60_000 }, () => {
  const fr = STORY_FIXTURES.find((f) => f.id === "fixture-fr-camille")!;

  it("renders a card PNG with accented text", async () => {
    const png = await renderCardPng({
      text: fr.text.slice(0, 200),
      storyLabel: `${OUTPUT_LABELS.fr.storyLabel} · ${OUTPUT_LABELS.fr.excerpt}`,
      displayName: "Camille",
      notes: [OUTPUT_LABELS.fr.machineTranslated, OUTPUT_LABELS.fr.prototype],
    });
    expect(png.subarray(1, 4).toString("ascii")).toBe("PNG");
    await keep("card.png", png);
  });

  it("renders a narrated MP4 with captions timed to the audio", async () => {
    const sentences = splitSentences(fr.text, "fr-CA");
    const durationMs = 6000;
    const mp4 = await renderNarratedMp4({
      audio: toneWav(durationMs, 24_000),
      durationMs,
      captions: chunkSegments(proportionalSegments(sentences, durationMs)),
      storyLabel: OUTPUT_LABELS.fr.storyLabel,
      displayName: "Camille",
      notes: [OUTPUT_LABELS.fr.synthetic, OUTPUT_LABELS.fr.prototype],
    });
    expect(mp4.subarray(4, 8).toString("ascii")).toBe("ftyp");
    await keep("video.mp4", mp4);
  });

  it("renders a silent video for the no-voice option", async () => {
    const mp4 = await renderNarratedMp4({
      durationMs: 2000,
      captions: [{ text: "Nothing dramatic happened to me.", startMs: 0, endMs: 2000 }],
      notes: [],
    });
    expect(mp4.subarray(4, 8).toString("ascii")).toBe("ftyp");
  });
});

describe("toFilterPath", () => {
  const dirs: string[] = [];
  afterAll(() => Promise.all(dirs.map((d) => rm(d, { recursive: true, force: true }))));

  it("survives drive colons, spaces and apostrophes in real ffmpeg filter parsing", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "it's a dir "));
    dirs.push(dir);
    const assPath = path.join(dir, "t.ass");
    await writeFile(assPath, "[Script Info]\nScriptType: v4.00+\n\n[Events]\nFormat: Layer, Start, End, Style, Text\n");
    await runFfmpeg([
      "-f", "lavfi", "-i", "color=s=64x64",
      "-vf", `subtitles=filename=${toFilterPath(assPath)}`,
      "-frames:v", "1",
      path.join(dir, "out.png"),
    ]);
  });
});
