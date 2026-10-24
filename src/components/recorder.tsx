"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Mic, RotateCcw, Square, Upload, Video } from "lucide-react";
import { useApp } from "@/components/app-state";
import { bigButton } from "@/components/step-shell";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  ACCEPTED_AUDIO_TYPES,
  ACCEPTED_VIDEO_TYPES,
  AUDIO_TYPE_BY_EXTENSION,
  MAX_RECORDING_SECONDS,
  MAX_UPLOAD_BYTES,
  MAX_VIDEO_UPLOAD_BYTES,
  VIDEO_TYPE_BY_EXTENSION,
} from "@/lib/domain/limits";

export type CaptureMedia = "audio" | "video";

type RecorderState =
  | { status: "idle" }
  | { status: "requesting" }
  /** Camera on and framed, not recording yet. */
  | { status: "ready" }
  | { status: "recording"; elapsed: number }
  | { status: "recorded"; blob: Blob; url: string; seconds: number; autoStopped: boolean }
  | { status: "error"; reason: "denied" | "unsupported" | "insecure" };

/** Detects a supported format rather than assuming every device records the same one (plan section 7). */
function pickMimeType(media: CaptureMedia): string {
  const candidates =
    media === "video"
      ? ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/mp4;codecs=avc1,mp4a", "video/mp4", "video/webm"]
      : ["audio/webm;codecs=opus", "audio/mp4", "audio/ogg;codecs=opus", "audio/webm"];
  return candidates.find((t) => MediaRecorder.isTypeSupported?.(t)) ?? "";
}

const CAMERA: MediaTrackConstraints = { facingMode: "user", width: { ideal: 720 }, height: { ideal: 1280 }, frameRate: { ideal: 30 } };
const MIC: MediaTrackConstraints = { echoCancellation: true, noiseSuppression: true };

/**
 * One short recording with a hard stop at the limit. The microphone (and
 * camera, for video) is requested only when the person taps to start.
 */
export function useRecorder(media: CaptureMedia = "audio", maxSeconds = MAX_RECORDING_SECONDS) {
  const [state, setState] = useState<RecorderState>({ status: "idle" });
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const timer = useRef<number | null>(null);
  const autoStopped = useRef(false);
  const urlRef = useRef<string | null>(null);
  /** The live camera stream, for the framing preview. */
  const [live, setLive] = useState<MediaStream | null>(null);

  const release = useCallback(() => {
    if (timer.current) window.clearInterval(timer.current);
    timer.current = null;
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
    setLive(null);
  }, []);

  const clearUrl = useCallback(() => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = null;
  }, []);

  useEffect(
    () => () => {
      if (recorder.current?.state === "recording") recorder.current.stop();
      release();
      clearUrl();
    },
    [release, clearUrl],
  );

  const stop = useCallback(() => {
    if (recorder.current?.state === "recording") recorder.current.stop();
  }, []);

  /** Asks for the camera and microphone (or microphone) without recording yet. */
  const open = useCallback(async (): Promise<MediaStream | null> => {
    if (stream.current) return stream.current;
    if (!window.isSecureContext) {
      setState({ status: "error", reason: "insecure" });
      return null;
    }
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setState({ status: "error", reason: "unsupported" });
      return null;
    }
    setState({ status: "requesting" });
    try {
      stream.current = await navigator.mediaDevices.getUserMedia(media === "video" ? { audio: MIC, video: CAMERA } : { audio: MIC });
    } catch {
      setState({ status: "error", reason: "denied" });
      return null;
    }
    setLive(stream.current);
    return stream.current;
  }, [media]);

  /** Video: turn the camera on so the person can frame themselves first. */
  const prepare = useCallback(async () => {
    clearUrl();
    if (await open()) setState({ status: "ready" });
  }, [clearUrl, open]);

  const start = useCallback(async () => {
    clearUrl();
    const s = await open();
    if (!s) return;
    const mimeType = pickMimeType(media);
    const options: MediaRecorderOptions = { ...(mimeType ? { mimeType } : {}) };
    if (media === "video") {
      options.videoBitsPerSecond = 2_500_000;
      options.audioBitsPerSecond = 128_000;
    }
    const rec = new MediaRecorder(s, options);
    const chunks: Blob[] = [];
    const startedAt = Date.now();
    autoStopped.current = false;
    rec.ondataavailable = (e) => e.data.size > 0 && chunks.push(e.data);
    rec.onstop = () => {
      release();
      const fallback = media === "video" ? "video/webm" : "audio/webm";
      const blob = new Blob(chunks, { type: rec.mimeType || mimeType || fallback });
      const url = URL.createObjectURL(blob);
      urlRef.current = url;
      const seconds = Math.min(maxSeconds, Math.round((Date.now() - startedAt) / 1000));
      setState({ status: "recorded", blob, url, seconds, autoStopped: autoStopped.current });
    };
    recorder.current = rec;
    rec.start(250);
    setState({ status: "recording", elapsed: 0 });
    timer.current = window.setInterval(() => {
      const elapsed = (Date.now() - startedAt) / 1000;
      if (elapsed >= maxSeconds) {
        autoStopped.current = true;
        rec.stop();
      } else {
        setState({ status: "recording", elapsed: Math.floor(elapsed) });
      }
    }, 250);
  }, [clearUrl, maxSeconds, media, open, release]);

  const reset = useCallback(() => {
    clearUrl();
    release();
    setState({ status: "idle" });
  }, [clearUrl, release]);

  return { state, live, prepare, start, stop, reset };
}

/** Normalizes an uploaded file's type, or returns an error key. */
function checkUpload(file: File, media: CaptureMedia): { file: File } | { error: "fileTooLarge" | "fileType" | "videoTooLarge" | "videoType" } {
  const video = media === "video";
  if (file.size > (video ? MAX_VIDEO_UPLOAD_BYTES : MAX_UPLOAD_BYTES)) return { error: video ? "videoTooLarge" : "fileTooLarge" };
  const byExtension = video ? VIDEO_TYPE_BY_EXTENSION : AUDIO_TYPE_BY_EXTENSION;
  let type = file.type.split(";")[0].trim().toLowerCase();
  if (!type) type = byExtension[file.name.split(".").pop()?.toLowerCase() ?? ""] ?? "";
  const accepted: readonly string[] = video ? ACCEPTED_VIDEO_TYPES : ACCEPTED_AUDIO_TYPES;
  if (!accepted.includes(type)) return { error: video ? "videoType" : "fileType" };
  return { file: type === file.type ? file : new File([file], file.name, { type }) };
}

/** The live camera, mirrored like a selfie camera. The recording itself isn't mirrored. */
function CameraPreview({ stream }: { stream: MediaStream }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream;
  }, [stream]);
  return <video ref={ref} autoPlay muted playsInline className="mx-auto block max-h-[60vh] w-full max-w-sm -scale-x-100 rounded-lg bg-black object-contain" />;
}

/**
 * Record or upload one take (sound only, or camera video), play it back, retry,
 * then hand it on. Errors leave the draft untouched and point to the upload
 * and typing alternatives.
 */
export function RecorderPanel({
  onUse,
  busy,
  media = "audio",
  allowUpload = true,
  onTypeInstead,
  uploadFirst = false,
}: {
  onUse: (recording: Blob) => void;
  busy?: boolean;
  media?: CaptureMedia;
  allowUpload?: boolean;
  onTypeInstead?: () => void;
  uploadFirst?: boolean;
}) {
  const { t } = useApp();
  const video = media === "video";
  const { state, live, prepare, start, stop, reset } = useRecorder(media);
  const [upload, setUpload] = useState<{ file: File; url: string } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => () => {
    if (upload) URL.revokeObjectURL(upload.url);
  }, [upload]);

  const onFile = (file: File | undefined) => {
    if (!file) return;
    const checked = checkUpload(file, media);
    if ("error" in checked) {
      setUploadError(t.record[checked.error]);
      return;
    }
    setUploadError(null);
    reset();
    setUpload({ file: checked.file, url: URL.createObjectURL(checked.file) });
  };

  const errorText =
    state.status === "error"
      ? video
        ? { denied: t.record.cameraDenied, unsupported: t.record.cameraUnsupported, insecure: t.record.insecure }[state.reason]
        : { denied: t.record.denied, unsupported: t.record.unsupported, insecure: t.record.insecure }[state.reason]
      : null;
  const ready = state.status === "recorded" ? state.blob : upload?.file;
  const readyUrl = state.status === "recorded" ? state.url : upload?.url;
  const accept = video
    ? [...ACCEPTED_VIDEO_TYPES, ".mp4", ".mov", ".webm", ".m4v"]
    : [...ACCEPTED_AUDIO_TYPES, ".m4a", ".mp3", ".wav", ".ogg", ".webm", ".flac", ".aac"];

  const uploadControl = allowUpload && (
    <>
      <input
        ref={fileInput}
        type="file"
        accept={accept.join(",")}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          onFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <Button variant="outline" className={bigButton} onClick={() => fileInput.current?.click()} disabled={busy}>
        <Upload aria-hidden /> {video ? t.record.chooseVideo : t.record.chooseFile}
      </Button>
    </>
  );

  const startButton = video ? (
    state.status === "ready" ? (
      <Button className={bigButton} onClick={start} disabled={busy}>
        <Video aria-hidden /> {t.record.start}
      </Button>
    ) : (
      <Button className={bigButton} onClick={prepare} disabled={state.status === "requesting" || busy}>
        <Camera aria-hidden /> {t.record.cameraOn}
      </Button>
    )
  ) : (
    <Button className={bigButton} onClick={start} disabled={state.status === "requesting" || busy}>
      <Mic aria-hidden /> {t.record.start}
    </Button>
  );

  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-card p-4">
      <p aria-live="polite" className="min-h-6 font-medium">
        {state.status === "recording" && (
          <span className="flex items-center gap-2">
            <span className="size-3 rounded-full bg-destructive" aria-hidden />
            {t.record.recording(state.elapsed, MAX_RECORDING_SECONDS)}
          </span>
        )}
        {state.status === "ready" && t.record.cameraReady}
        {state.status === "recorded" &&
          (state.autoStopped ? t.record.autoStopped(MAX_RECORDING_SECONDS) : t.record.recorded(state.seconds))}
        {state.status === "idle" && !upload && !uploadFirst && (
          <span className="text-muted-foreground">{video ? t.record.cameraHint : t.record.micHint}</span>
        )}
        {upload && state.status === "idle" && upload.file.name}
      </p>

      {video && live && (state.status === "ready" || state.status === "recording") && <CameraPreview stream={live} />}

      {state.status === "recording" && (
        <div className="h-2 overflow-hidden rounded-full bg-muted" aria-hidden>
          <div className="h-full bg-destructive transition-[width]" style={{ width: `${(state.elapsed / MAX_RECORDING_SECONDS) * 100}%` }} />
        </div>
      )}

      {readyUrl &&
        (video ? (
          <video controls playsInline src={readyUrl} className="mx-auto block max-h-[60vh] w-full max-w-sm rounded-lg bg-black object-contain" />
        ) : (
          <audio controls src={readyUrl} className="w-full" />
        ))}

      {errorText && (
        <Alert variant="destructive">
          <AlertDescription>{errorText}</AlertDescription>
        </Alert>
      )}
      {uploadError && (
        <Alert variant="destructive">
          <AlertDescription>{uploadError}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-wrap gap-3">
        {uploadFirst ? (
          uploadControl
        ) : state.status === "recording" ? (
          <Button className={bigButton} variant="destructive" onClick={stop}>
            <Square aria-hidden /> {t.record.stop}
          </Button>
        ) : ready ? (
          <Button
            variant="outline"
            className={bigButton}
            onClick={() => {
              reset();
              setUpload(null);
            }}
            disabled={busy}
          >
            <RotateCcw aria-hidden /> {t.record.retry}
          </Button>
        ) : (
          startButton
        )}
        {ready && (
          <Button className={bigButton} onClick={() => onUse(ready)} disabled={busy}>
            {busy ? t.common.working : video ? t.record.useVideo : t.record.useIt}
          </Button>
        )}
        {!uploadFirst && state.status !== "recording" && state.status !== "ready" && !ready && uploadControl}
        {onTypeInstead && state.status !== "recording" && (
          <Button variant="ghost" className={bigButton} onClick={onTypeInstead}>
            {t.record.typeInstead}
          </Button>
        )}
      </div>
    </div>
  );
}
