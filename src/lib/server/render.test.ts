import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { STORY_FIXTURES } from "@/fixtures/stories";
import { buildSlides, paceWords } from "@/lib/domain/timing";
import { OUTPUT_LABELS } from "@/lib/domain/output-labels";
import { toneWav } from "@/lib/media/wav";
import { probeMedia, runFfmpeg, toFilterPath, withScratchDir } from "./ffmpeg";
import { renderCardPng, renderFaceMp4, renderNarratedMp4 } from "./render";

// Runs the real bundled ffmpeg. Set RENDER_PREVIEW_DIR to keep the outputs for
// a visual check of the templates.
const keepDir = process.env.RENDER_PREVIEW_DIR;

async function keep(name: string, data: Buffer) {
  if (!keepDir) return;
  await mkdir(keepDir, { recursive: true });
  await writeFile(path.join(keepDir, name), data);
}

describe("renderers", { timeout: 60_000 }, () => {
  const es = STORY_FIXTURES.find((f) => f.id === "sample-c-voice-note")!;

  it("renders a card PNG with accented text", async () => {
    const png = await renderCardPng({
      text: es.text.slice(0, 200),
      storyLabel: `${OUTPUT_LABELS["es-419"].storyLabel} · ${OUTPUT_LABELS["es-419"].excerpt}`,
      displayName: "Carla",
      notes: [OUTPUT_LABELS["es-419"].machineTranslated, OUTPUT_LABELS["es-419"].prototype],
    });
    expect(png.subarray(1, 4).toString("ascii")).toBe("PNG");
    await keep("card.png", png);
  });

  it("renders a narrated MP4 with captions timed to the audio", async () => {
    const { words, durationMs } = paceWords(es.text, "es-419");
    const mp4 = await renderNarratedMp4({
      audio: toneWav(durationMs, 24_000),
      durationMs,
      captions: buildSlides(words, "es-419", durationMs),
      storyLabel: OUTPUT_LABELS["es-419"].storyLabel,
      displayName: "Carla",
      notes: [OUTPUT_LABELS["es-419"].synthetic, OUTPUT_LABELS["es-419"].prototype],
    });
    expect(mp4.subarray(4, 8).toString("ascii")).toBe("ftyp");
    await keep("video.mp4", mp4);
  });

  it("renders the person's own video with captions, fitted into 9:16 without cropping", async () => {
    // A landscape test clip with sound stands in for a camera recording.
    const source = await withScratchDir(async (dir) => {
      const out = path.join(dir, "camera.webm");
      await runFfmpeg([
        "-f", "lavfi", "-i", "testsrc2=size=640x480:rate=30:duration=3",
        "-f", "lavfi", "-i", "sine=frequency=300:duration=3",
        "-c:v", "libvpx", "-b:v", "500k", "-c:a", "libopus", "-shortest", out,
      ]);
      return readFile(out);
    });
    expect(await probeMedia(source)).toEqual({ hasVideo: true, hasAudio: true });
    const { words, durationMs } = paceWords("Ayer me bauticé. Nadie te juzga.", "es-419");
    const mp4 = await renderFaceMp4({
      video: source,
      durationMs: Math.min(durationMs, 3000),
      captions: buildSlides(words, "es-419", 3000),
      storyLabel: OUTPUT_LABELS["es-419"].storyLabel,
      displayName: "Carla",
      notes: [OUTPUT_LABELS["es-419"].prototype],
    });
    expect(mp4.subarray(4, 8).toString("ascii")).toBe("ftyp");
    expect(await probeMedia(mp4)).toEqual({ hasVideo: true, hasAudio: true });
    const log = await withScratchDir(async (dir) => {
      const f = path.join(dir, "out.mp4");
      await writeFile(f, mp4);
      return runFfmpeg(["-i", f, "-t", "0", "-f", "null", "-"]);
    });
    expect(log).toMatch(/720x1280/);
    await keep("face.mp4", mp4);
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
