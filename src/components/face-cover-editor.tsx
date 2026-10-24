"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { LoaderCircle, Maximize2, Minimize2 } from "lucide-react";
import { useApp } from "@/components/app-state";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  clampBox,
  coverFromSamples,
  crowdedMoments,
  summarizeMoments,
  uncoveredMoments,
  type Box,
  type FaceSample,
} from "@/lib/domain/face-cover";

/** Where the cover starts when no face is found: the upper middle, where a selfie face usually is. */
const FALLBACK_COVER: Box = { x: 0.25, y: 0.12, w: 0.5, h: 0.42 };
/** Sample a few frames per second, capped so a long clip still scans quickly. */
const SAMPLE_MS = 250;
const MAX_SAMPLES = 240;

type Scan =
  | { status: "loading"; progress: number }
  | { status: "done"; samples: FaceSample[]; url: string; aspect: number }
  | { status: "failed"; url: string | null; aspect: number };

type FaceDetectorInstance = Awaited<ReturnType<(typeof import("@mediapipe/tasks-vision"))["FaceDetector"]["createFromOptions"]>>;

/**
 * MediaPipe's runtime prints routine status lines ("INFO: Created TensorFlow
 * Lite XNNPACK delegate for CPU.") through console.error, which the Next.js dev
 * overlay reports as an issue. Only those library lines are dropped; every
 * other error still reaches the console.
 */
let mediaPipeLogsQuieted = false;
function quietMediaPipeLogs() {
  if (mediaPipeLogsQuieted) return;
  mediaPipeLogsQuieted = true;
  const isRoutine = (args: unknown[]) =>
    typeof args[0] === "string" && /^(INFO: |[IW]\d{4} )|XNNPACK delegate/.test(args[0]);
  for (const level of ["error", "warn", "info"] as const) {
    const original = console[level].bind(console);
    console[level] = (...args: unknown[]) => {
      if (!isRoutine(args)) original(...args);
    };
  }
}

/** One detector per page: the 13 MB runtime loads once, however many times the editor mounts. */
let detectorPromise: Promise<FaceDetectorInstance> | null = null;
function getDetector(): Promise<FaceDetectorInstance> {
  quietMediaPipeLogs();
  detectorPromise ??= (async () => {
    const { FaceDetector, FilesetResolver } = await import("@mediapipe/tasks-vision");
    const fileset = await FilesetResolver.forVisionTasks("/api/vision");
    return FaceDetector.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: "/api/vision/blaze_face_short_range.tflite", delegate: "CPU" },
      runningMode: "VIDEO",
      minDetectionConfidence: 0.4,
    });
  })().catch((err) => {
    detectorPromise = null;
    throw err;
  });
  return detectorPromise;
}

interface ScanResult {
  samples: FaceSample[];
  aspect: number;
  /** Local copy of the video, so the preview and the scan can seek freely. */
  url: string;
}

/** One scan per video: remounting the editor reuses the result instead of scanning again. */
const scans = new Map<string, Promise<ScanResult>>();
const progressListeners = new Map<string, (p: number) => void>();

/**
 * Finds faces in the person's own video on this device (MediaPipe face
 * detection, served by this app), so nothing is sent anywhere to do it.
 */
function scanVideo(videoUrl: string, durationMs: number): Promise<ScanResult> {
  const key = `${videoUrl}:${durationMs}`;
  let scan = scans.get(key);
  if (!scan) {
    scan = (async () => {
      const blob = await (await fetch(videoUrl)).blob();
      const url = URL.createObjectURL(blob);
      const video = document.createElement("video");
      video.muted = true;
      video.playsInline = true;
      video.preload = "auto";
      video.src = url;
      await new Promise<void>((resolve, reject) => {
        video.onloadeddata = () => resolve();
        video.onerror = () => reject(new Error("video"));
      });
      const aspect = video.videoWidth / video.videoHeight;
      try {
        const detector = await getDetector();
        const step = Math.max(SAMPLE_MS, durationMs / MAX_SAMPLES);
        const samples: FaceSample[] = [];
        for (let t = 0; t < durationMs; t += step) {
          await new Promise<void>((resolve) => {
            // A stuck seek must not hang the scan; that frame is then sampled as it stands.
            const timer = window.setTimeout(resolve, 2000);
            video.onseeked = () => {
              window.clearTimeout(timer);
              resolve();
            };
            video.currentTime = t / 1000;
          });
          const result = detector.detectForVideo(video, performance.now());
          samples.push({
            timeMs: t,
            faces: result.detections
              .map((d) => d.boundingBox)
              .filter((b) => b !== undefined)
              .map((b) => ({
                x: b.originX / video.videoWidth,
                y: b.originY / video.videoHeight,
                w: b.width / video.videoWidth,
                h: b.height / video.videoHeight,
              })),
          });
          progressListeners.get(key)?.(Math.min(99, Math.round((t / durationMs) * 100)));
        }
        return { samples, aspect, url };
      } catch (err) {
        // Keep the local copy so the person can still place the cover by hand.
        throw Object.assign(err instanceof Error ? err : new Error("scan"), { url, aspect });
      }
    })();
    scans.set(key, scan);
    scan.catch(() => scans.delete(key));
  }
  return scan;
}

export function FaceCoverEditor({
  videoUrl,
  durationMs,
  cover,
  onChange,
}: {
  videoUrl: string;
  durationMs: number;
  cover: Box | null;
  onChange: (cover: Box) => void;
}) {
  const { t } = useApp();
  const [scan, setScan] = useState<Scan>({ status: "loading", progress: 0 });
  const [draft, setDraft] = useState<Box | null>(cover);
  const [open, setOpen] = useState(false);
  const frame = useRef<HTMLDivElement>(null);
  const drag = useRef<{ mode: "move" | "resize"; x: number; y: number; box: Box } | null>(null);
  const initialCover = useRef(cover);
  const latestOnChange = useRef(onChange);
  useEffect(() => {
    latestOnChange.current = onChange;
  });

  useEffect(() => {
    let cancelled = false;
    const key = `${videoUrl}:${durationMs}`;
    progressListeners.set(key, (progress) => {
      if (!cancelled) setScan({ status: "loading", progress });
    });
    scanVideo(videoUrl, durationMs).then(
      ({ samples, url, aspect }) => {
        if (cancelled) return;
        setScan({ status: "done", samples, url, aspect });
        if (!initialCover.current) {
          const proposed = coverFromSamples(samples) ?? FALLBACK_COVER;
          setDraft(proposed);
          latestOnChange.current(proposed);
        }
      },
      (err: { url?: string; aspect?: number }) => {
        if (cancelled) return;
        setScan({ status: "failed", url: err?.url ?? null, aspect: err?.aspect ?? 9 / 16 });
        if (!initialCover.current) {
          setDraft(FALLBACK_COVER);
          latestOnChange.current(FALLBACK_COVER);
        }
      },
    );
    return () => {
      cancelled = true;
      progressListeners.delete(key);
    };
  }, [videoUrl, durationMs]);

  const commit = (box: Box) => {
    const next = clampBox(box);
    setDraft(next);
    onChange(next);
  };

  const onPointerDown = (e: PointerEvent<HTMLElement>, mode: "move" | "resize") => {
    if (!draft) return;
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { mode, x: e.clientX, y: e.clientY, box: draft };
  };
  const onPointerMove = (e: PointerEvent<HTMLElement>) => {
    const d = drag.current;
    const rect = frame.current?.getBoundingClientRect();
    if (!d || !rect) return;
    const dx = (e.clientX - d.x) / rect.width;
    const dy = (e.clientY - d.y) / rect.height;
    setDraft(clampBox(d.mode === "move" ? { ...d.box, x: d.box.x + dx, y: d.box.y + dy } : { ...d.box, w: d.box.w + dx, h: d.box.h + dy }));
  };
  // The preview re-renders only when a drag ends, not on every movement.
  const onPointerUp = () => {
    if (drag.current && draft) commit(draft);
    drag.current = null;
  };
  const resize = (factor: number) => {
    if (!draft) return;
    const w = draft.w * factor;
    const h = draft.h * factor;
    commit({ x: draft.x - (w - draft.w) / 2, y: draft.y - (h - draft.h) / 2, w, h });
  };
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!draft) return;
    const step = 0.02;
    const moves: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    const m = moves[e.key];
    if (!m) return;
    e.preventDefault();
    commit(e.shiftKey ? { ...draft, w: draft.w + m[0], h: draft.h + m[1] } : { ...draft, x: draft.x + m[0], y: draft.y + m[1] });
  };

  const samples = scan.status === "done" ? scan.samples : [];
  const found = samples.some((s) => s.faces.length > 0);
  const uncovered = draft ? summarizeMoments(uncoveredMoments(samples, draft)) : [];
  const crowded = summarizeMoments(crowdedMoments(samples));
  const url = scan.status === "loading" ? null : scan.url;
  const aspect = scan.status === "loading" ? 9 / 16 : scan.aspect;

  // Compact once the cover was placed automatically and nothing was missed; open when it needs the person.
  const needsAttention = scan.status === "failed" || (scan.status === "done" && (!found || uncovered.length > 0));
  if (scan.status === "done" && !open && !needsAttention) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4">
        <p aria-live="polite">{t.preview.coverReady}</p>
        <Button variant="outline" onClick={() => setOpen(true)}>
          {t.preview.coverAdjust}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-4">
      <p className="text-sm text-muted-foreground">{t.preview.coverFaceHint}</p>
      {scan.status === "loading" ? (
        <p aria-live="polite" className="flex items-center gap-2">
          <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" aria-hidden /> {t.preview.coverScanning(scan.progress)}
        </p>
      ) : (
        <>
          <div
            ref={frame}
            className="relative mx-auto w-full max-w-xs touch-none select-none overflow-hidden rounded-lg bg-black"
            style={{ aspectRatio: String(aspect) }}
          >
            {url && <video src={url} muted playsInline preload="metadata" className="absolute inset-0 h-full w-full" />}
            {draft && (
              <div
                role="group"
                tabIndex={0}
                aria-label={t.preview.coverBox}
                className="absolute cursor-move border-2 border-action bg-river/50 outline-none backdrop-blur-xl focus-visible:ring-2 focus-visible:ring-action focus-visible:ring-offset-2"
                style={{ left: `${draft.x * 100}%`, top: `${draft.y * 100}%`, width: `${draft.w * 100}%`, height: `${draft.h * 100}%` }}
                onPointerDown={(e) => onPointerDown(e, "move")}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                onKeyDown={onKeyDown}
              >
                <span
                  aria-hidden
                  className="absolute -right-2 -bottom-2 size-5 cursor-nwse-resize rounded-full border-2 border-river bg-action"
                  onPointerDown={(e) => onPointerDown(e, "resize")}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerCancel={onPointerUp}
                />
              </div>
            )}
          </div>
          <div className="flex justify-center gap-2">
            <Button variant="outline" onClick={() => resize(1.15)}>
              <Maximize2 aria-hidden /> {t.preview.coverBigger}
            </Button>
            <Button variant="outline" onClick={() => resize(1 / 1.15)}>
              <Minimize2 aria-hidden /> {t.preview.coverSmaller}
            </Button>
          </div>
          <p aria-live="polite" className="text-sm">
            {scan.status === "failed" ? t.preview.coverFailed : found ? t.preview.coverFound : t.preview.coverNotFound}
          </p>
          {uncovered.length > 0 && (
            <Alert variant="destructive">
              <AlertDescription>{t.preview.coverUncovered(uncovered.join(", "))}</AlertDescription>
            </Alert>
          )}
          {crowded.length > 0 && (
            <Alert>
              <AlertDescription>{t.preview.coverCrowded(crowded.join(", "))}</AlertDescription>
            </Alert>
          )}
        </>
      )}
      <p className="text-sm text-muted-foreground">{t.preview.coverLimits}</p>
    </div>
  );
}
