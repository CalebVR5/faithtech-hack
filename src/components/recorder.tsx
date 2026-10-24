"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, RotateCcw, Square, Upload } from "lucide-react";
import { useApp } from "@/components/app-state";
import { bigButton } from "@/components/step-shell";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ACCEPTED_AUDIO_TYPES, AUDIO_TYPE_BY_EXTENSION, MAX_RECORDING_SECONDS, MAX_UPLOAD_BYTES } from "@/lib/domain/limits";

type RecorderState =
  | { status: "idle" }
  | { status: "requesting" }
  | { status: "recording"; elapsed: number }
  | { status: "recorded"; blob: Blob; url: string; seconds: number; autoStopped: boolean }
  | { status: "error"; reason: "denied" | "unsupported" | "insecure" };

/** Detects a supported format rather than assuming every device records the same one (plan section 7). */
function pickMimeType(): string {
  const candidates = ["audio/webm;codecs=opus", "audio/mp4", "audio/ogg;codecs=opus", "audio/webm"];
  return candidates.find((t) => MediaRecorder.isTypeSupported?.(t)) ?? "";
}

/** One short recording with a hard stop at the limit. The microphone is requested only on Start. */
export function useRecorder(maxSeconds = MAX_RECORDING_SECONDS) {
  const [state, setState] = useState<RecorderState>({ status: "idle" });
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const timer = useRef<number | null>(null);
  const autoStopped = useRef(false);
  const urlRef = useRef<string | null>(null);

  const release = useCallback(() => {
    if (timer.current) window.clearInterval(timer.current);
    timer.current = null;
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
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

  const start = useCallback(async () => {
    if (!window.isSecureContext) return setState({ status: "error", reason: "insecure" });
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      return setState({ status: "error", reason: "unsupported" });
    }
    clearUrl();
    setState({ status: "requesting" });
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    } catch {
      return setState({ status: "error", reason: "denied" });
    }
    const mimeType = pickMimeType();
    const rec = new MediaRecorder(stream.current, mimeType ? { mimeType } : undefined);
    const chunks: Blob[] = [];
    const startedAt = Date.now();
    autoStopped.current = false;
    rec.ondataavailable = (e) => e.data.size > 0 && chunks.push(e.data);
    rec.onstop = () => {
      release();
      const blob = new Blob(chunks, { type: rec.mimeType || mimeType || "audio/webm" });
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
  }, [clearUrl, maxSeconds, release]);

  const reset = useCallback(() => {
    clearUrl();
    setState({ status: "idle" });
  }, [clearUrl]);

  return { state, start, stop, reset };
}

/** Normalizes an uploaded file's type, or returns an error key. */
function checkUpload(file: File): { file: File } | { error: "fileTooLarge" | "fileType" } {
  if (file.size > MAX_UPLOAD_BYTES) return { error: "fileTooLarge" };
  let type = file.type.split(";")[0].trim().toLowerCase();
  if (!type) type = AUDIO_TYPE_BY_EXTENSION[file.name.split(".").pop()?.toLowerCase() ?? ""] ?? "";
  if (!(ACCEPTED_AUDIO_TYPES as readonly string[]).includes(type)) return { error: "fileType" };
  return { file: type === file.type ? file : new File([file], file.name, { type }) };
}

/**
 * Record or upload one take, listen back, retry, then hand it on. Errors leave
 * the draft untouched and point to the upload and typing alternatives.
 */
export function RecorderPanel({
  onUse,
  busy,
  allowUpload = true,
  onTypeInstead,
  uploadFirst = false,
}: {
  onUse: (audio: Blob) => void;
  busy?: boolean;
  allowUpload?: boolean;
  onTypeInstead?: () => void;
  uploadFirst?: boolean;
}) {
  const { t } = useApp();
  const { state, start, stop, reset } = useRecorder();
  const [upload, setUpload] = useState<{ file: File; url: string } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => () => {
    if (upload) URL.revokeObjectURL(upload.url);
  }, [upload]);

  const onFile = (file: File | undefined) => {
    if (!file) return;
    const checked = checkUpload(file);
    if ("error" in checked) {
      setUploadError(t.record[checked.error]);
      return;
    }
    setUploadError(null);
    reset();
    setUpload({ file: checked.file, url: URL.createObjectURL(checked.file) });
  };

  const errorText =
    state.status === "error" ? { denied: t.record.denied, unsupported: t.record.unsupported, insecure: t.record.insecure }[state.reason] : null;
  const ready = state.status === "recorded" ? state.blob : upload?.file;
  const readyUrl = state.status === "recorded" ? state.url : upload?.url;

  const uploadControl = allowUpload && (
    <>
      <input
        ref={fileInput}
        type="file"
        accept={[...ACCEPTED_AUDIO_TYPES, ".m4a", ".mp3", ".wav", ".ogg", ".webm", ".flac", ".aac"].join(",")}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          onFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <Button variant="outline" className={bigButton} onClick={() => fileInput.current?.click()} disabled={busy}>
        <Upload aria-hidden /> {t.record.chooseFile}
      </Button>
    </>
  );

  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-card p-4">
      <p aria-live="polite" className="min-h-6 font-medium">
        {state.status === "recording" && (
          <span className="flex items-center gap-2">
            <span className="size-3 animate-pulse rounded-full bg-destructive" aria-hidden />
            {t.record.recording(state.elapsed, MAX_RECORDING_SECONDS)}
          </span>
        )}
        {state.status === "recorded" &&
          (state.autoStopped ? t.record.autoStopped(MAX_RECORDING_SECONDS) : t.record.recorded(state.seconds))}
        {state.status === "idle" && !upload && !uploadFirst && <span className="text-muted-foreground">{t.record.micHint}</span>}
        {upload && state.status === "idle" && upload.file.name}
      </p>

      {state.status === "recording" && (
        <div className="h-2 overflow-hidden rounded-full bg-muted" aria-hidden>
          <div className="h-full bg-destructive transition-[width]" style={{ width: `${(state.elapsed / MAX_RECORDING_SECONDS) * 100}%` }} />
        </div>
      )}

      {readyUrl && <audio controls src={readyUrl} className="w-full" />}

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
          <Button className={bigButton} onClick={start} disabled={state.status === "requesting" || busy}>
            <Mic aria-hidden /> {t.record.start}
          </Button>
        )}
        {ready && (
          <Button className={bigButton} onClick={() => onUse(ready)} disabled={busy}>
            {busy ? t.common.working : t.record.useIt}
          </Button>
        )}
        {!uploadFirst && state.status !== "recording" && !ready && uploadControl}
        {onTypeInstead && state.status !== "recording" && (
          <Button variant="ghost" className={bigButton} onClick={onTypeInstead}>
            {t.record.typeInstead}
          </Button>
        )}
      </div>
    </div>
  );
}
