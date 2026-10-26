"use client";

import { useMemo, useState } from "react";
import { FileAudio, Keyboard, Mic, Video } from "lucide-react";
import { useApp, type PendingTranscript } from "@/components/app-state";
import { CloudConsent } from "@/components/cloud-consent";
import { RecorderPanel, type CaptureMedia } from "@/components/recorder";
import { ErrorNote } from "@/components/flow/steps-start";
import { bigButton, OptionButton, StepNumber, StepShell } from "@/components/step-shell";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Prompt } from "@/i18n/en";
import { api } from "@/lib/client/api";
import { findIdentifyingDetails } from "@/lib/domain/identifying";
import { LANGUAGE_IDS, LANGUAGES, isLanguageId, type LanguageId } from "@/lib/domain/languages";
import { MAX_RECORDING_SECONDS, MAX_STORY_CHARS } from "@/lib/domain/limits";
import { sentencesFromWords } from "@/lib/domain/timing";

export function CaptureStep() {
  const { t, flow, update, go, saveStory, errorText } = useApp();
  const story = flow.story!;
  const [error, setError] = useState<string | null>(null);
  const lang = LANGUAGES[story.sourceLanguage];

  const setLanguage = async (value: string) => {
    if (!isLanguageId(value)) return;
    try {
      await saveStory({ sourceLanguage: value });
      update({ sttLocale: null });
    } catch (err) {
      setError(errorText(err));
    }
  };

  return (
    <StepShell title={t.capture.title}>
      <div className="flex flex-col gap-2">
        <label htmlFor="story-language" className="font-semibold">
          {t.capture.storyLanguage}
        </label>
        <p id="story-language-hint" className="text-sm text-muted-foreground">
          {t.capture.storyLanguageHint}
        </p>
        <select
          id="story-language"
          aria-describedby="story-language-hint"
          className="h-11 rounded-lg border border-input bg-background px-3 text-base"
          value={story.sourceLanguage}
          onChange={(e) => setLanguage(e.target.value)}
        >
          {LANGUAGE_IDS.map((id) => (
            <option key={id} value={id} lang={LANGUAGES[id].uiLocale}>
              {LANGUAGES[id].displayName}
            </option>
          ))}
        </select>
        {lang.sttAlternatives.length > 0 && (
          <>
            <label htmlFor="stt-locale" className="mt-2 text-sm font-medium">
              {t.capture.accent}
            </label>
            <select
              id="stt-locale"
              className="h-11 rounded-lg border border-input bg-background px-3 text-base"
              value={flow.sttLocale ?? lang.sttLocale}
              onChange={(e) => update({ sttLocale: e.target.value })}
            >
              {[lang.sttLocale, ...lang.sttAlternatives].map((code) => (
                <option key={code} value={code}>
                  {new Intl.DisplayNames([LANGUAGES[flow.story!.interfaceLanguage].uiLocale], { type: "language" }).of(code) ?? code}
                </option>
              ))}
            </select>
          </>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <OptionButton icon={<Keyboard />} title={t.capture.type} body={t.capture.typeHint} onClick={() => go("write")} />
        <OptionButton
          icon={<Mic />}
          title={t.capture.speak}
          body={t.capture.speakHint(MAX_RECORDING_SECONDS)}
          onClick={() => {
            update({ captureMode: "speak" });
            go("record");
          }}
        />
        <OptionButton
          icon={<Video />}
          title={t.capture.film}
          body={t.capture.filmHint(MAX_RECORDING_SECONDS)}
          onClick={() => {
            update({ captureMode: "film" });
            go("record");
          }}
        />
        <OptionButton
          icon={<FileAudio />}
          title={t.capture.upload}
          body={t.capture.uploadHint}
          onClick={() => {
            update({ captureMode: "upload" });
            go("record");
          }}
        />
      </div>
      {error && <ErrorNote message={error} />}
    </StepShell>
  );
}

export function WriteStep() {
  const { t, flow, update, go, saveStory, errorText } = useApp();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const story = flow.story!;
  const lang = LANGUAGES[story.sourceLanguage].uiLocale;
  const combined = flow.ownWay
    ? flow.ownText.trim()
    : flow.answers.map((a) => a.trim()).filter(Boolean).join("\n\n");
  const left = MAX_STORY_CHARS - combined.length;

  const save = async () => {
    if (!combined) return setError(t.write.empty);
    setBusy(true);
    setError(null);
    try {
      await saveStory({ reviewedText: combined, sourceKind: "text" });
      go("review");
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <StepShell
      title={t.write.title}
      lead={t.write.lead}
      actions={
        <Button className={bigButton} onClick={save} disabled={busy || left < 0}>
          {t.common.continue}
        </Button>
      }
    >
      {flow.ownWay ? (
        <div className="flex flex-col gap-2">
          <label htmlFor="own-way" className="font-semibold">
            {t.write.ownWayLabel}
          </label>
          <Textarea
            id="own-way"
            lang={lang}
            className="min-h-48 text-base md:text-base"
            value={flow.ownText}
            onChange={(e) => update({ ownText: e.target.value })}
          />
        </div>
      ) : (
        t.write.prompts[story.storyType].map((prompt, i) => (
          <div key={prompt.question} className="flex flex-col gap-2">
            <div className="flex items-start gap-3">
              <StepNumber n={i + 1} />
              <div className="flex flex-col gap-0.5 pt-0.5">
                <label htmlFor={`prompt-${i}`} className="font-semibold">
                  {prompt.question}
                </label>
                {prompt.hint && (
                  <p id={`prompt-${i}-hint`} className="text-sm text-muted-foreground">
                    {prompt.hint}
                  </p>
                )}
              </div>
            </div>
            <Textarea
              id={`prompt-${i}`}
              aria-describedby={prompt.hint ? `prompt-${i}-hint` : undefined}
              lang={lang}
              className="min-h-24 text-base md:text-base"
              value={flow.answers[i]}
              onChange={(e) =>
                update((s) => {
                  const answers = [...s.answers] as [string, string, string];
                  answers[i] = e.target.value;
                  return { answers };
                })
              }
            />
          </div>
        ))
      )}
      <Button
        variant="link"
        className="h-auto w-fit p-0 text-base"
        onClick={() => update((s) => ({ ownWay: !s.ownWay, ownText: s.ownText || combined }))}
      >
        {flow.ownWay ? t.write.usePrompts : t.write.ownWay}
      </Button>
      <p aria-live="polite" className={left < 0 ? "font-medium text-destructive" : "text-sm text-muted-foreground"}>
        {left < 0 ? t.write.overLimit(-left) : t.write.charsLeft(left)}
      </p>
      {error && <ErrorNote message={error} />}
    </StepShell>
  );
}

/** Sends one take for transcription after the person has agreed, then opens the correction screen. */
export function useTranscribe(purpose: PendingTranscript["purpose"], media: CaptureMedia = "audio") {
  const { flow, update, go, errorText } = useApp();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [awaitingConsent, setAwaitingConsent] = useState<Blob | null>(null);

  const send = async (recording: Blob, scriptText?: string) => {
    const story = flow.story!;
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.set("storyId", story.id);
      form.set("audio", recording, recording instanceof File ? recording.name : "recording");
      form.set("cloudProcessingAccepted", "true");
      form.set("keep", "true");
      if (flow.sttLocale) form.set("sttLocale", flow.sttLocale);
      if (scriptText) form.set("scriptText", scriptText);
      const result = await api.transcribe(form);
      const locale = LANGUAGES[story.sourceLanguage].uiLocale;
      update((s) => {
        if (s.pending) URL.revokeObjectURL(s.pending.audioUrl);
        return {
          pending: {
            purpose,
            media: result.media,
            audioUrl: URL.createObjectURL(recording),
            audioRef: result.audioRef,
            durationMs: result.durationMs,
            // Whole sentences to check, each with the moment it was said.
            segments: sentencesFromWords(result.transcript.words, locale),
            transcript: result.transcript,
          },
        };
      });
      go("transcript");
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  const submit = (recording: Blob, scriptText?: string) => {
    // The notice shows once per story, and again for a first video: the app keeps footage of the person's face.
    if (flow.cloud.transcription && (media !== "video" || flow.videoNotice)) void send(recording, scriptText);
    else setAwaitingConsent(recording);
  };

  return { busy, error, awaitingConsent, setAwaitingConsent, send, submit };
}

/** The path's guiding questions, in order, read before speaking or filming. */
function PromptList({ prompts }: { prompts: Prompt[] }) {
  return (
    <ol className="flex flex-col gap-3 text-lg">
      {prompts.map((p, i) => (
        <li key={p.question} className="flex items-start gap-3">
          <StepNumber n={i + 1} />
          <span>
            {p.question}
            {p.hint && <span className="block text-base text-muted-foreground">{p.hint}</span>}
          </span>
        </li>
      ))}
    </ol>
  );
}

export function RecordStep() {
  const { t, flow, go } = useApp();
  const media: CaptureMedia = flow.captureMode === "film" ? "video" : "audio";
  const { busy, error, awaitingConsent, setAwaitingConsent, send, submit } = useTranscribe("capture", media);

  return (
    <StepShell title={media === "video" ? t.record.filmTitle : t.record.title} lead={t.record.lead}>
      <PromptList prompts={t.write.prompts[flow.story!.storyType]} />
      {awaitingConsent ? (
        <CloudConsent
          keepsRecording
          keepsVideo={media === "video"}
          onAgree={() => {
            const recording = awaitingConsent;
            setAwaitingConsent(null);
            void send(recording);
          }}
          onDecline={() => setAwaitingConsent(null)}
        />
      ) : (
        <RecorderPanel
          media={media}
          onUse={(recording) => submit(recording)}
          busy={busy}
          uploadFirst={flow.captureMode === "upload"}
          onTypeInstead={() => go("write")}
        />
      )}
      {busy && <p aria-live="polite">{media === "video" ? t.record.transcribingVideo : t.record.transcribing}</p>}
      {error && <ErrorNote message={error} />}
    </StepShell>
  );
}

/** Share of words changed, ignoring case and punctuation. Used only to suggest re-recording. */
function changeRatio(before: string, after: string): number {
  const words = (s: string) => s.toLowerCase().match(/[\p{L}\p{N}']+/gu) ?? [];
  const a = words(before);
  const b = words(after);
  const counts = new Map<string, number>();
  for (const w of a) counts.set(w, (counts.get(w) ?? 0) + 1);
  let common = 0;
  for (const w of b) {
    const n = counts.get(w) ?? 0;
    if (n > 0) {
      common++;
      counts.set(w, n - 1);
    }
  }
  return 1 - common / Math.max(a.length, b.length, 1);
}

/** Possible names, places, dates and family members, as a helper only. */
function IdentifyingFlags({ text, language }: { text: string; language: LanguageId }) {
  const { t } = useApp();
  const flags = useMemo(() => findIdentifyingDetails(text, language), [text, language]);
  return (
    <div className="flex flex-col gap-2 rounded-xl bg-secondary p-4">
      <h2 className="font-semibold">{t.review.flagsTitle}</h2>
      <p className="text-sm text-muted-foreground">{t.review.flagsHint}</p>
      {flags.length === 0 ? (
        <p className="text-sm">{t.review.noFlags}</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {flags.map((f) => (
            <li key={`${f.start}-${f.text}`} className="rounded-lg border bg-card px-2 py-1 text-sm">
              <span className="font-medium">{f.text}</span> <span className="text-muted-foreground">· {t.review.flagKinds[f.kind]}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function DisplayNameField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const { t } = useApp();
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="display-name" className="font-semibold">
        {t.review.displayName}
      </label>
      <p id="display-name-hint" className="text-sm text-muted-foreground">
        {t.review.displayNameHint}
      </p>
      <input
        id="display-name"
        aria-describedby="display-name-hint"
        className="h-11 rounded-lg border border-input bg-background px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring"
        maxLength={40}
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export function TranscriptStep() {
  const { t, flow, update, go, saveStory, errorText } = useApp();
  const pending = flow.pending!;
  const story = flow.story!;
  const [name, setName] = useState(story.displayName ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isCapture = pending.purpose === "capture";
  const uncertain = pending.transcript.words.filter((w) => w.uncertain);
  const original = pending.transcript.segments.map((s) => s.text).join(" ");
  const edited = pending.segments.map((s) => s.text).join(" ");
  const bigChange = changeRatio(original, edited) > 0.3;
  const isMock = pending.transcript.provider === "mock";

  const save = async () => {
    const segments = pending.segments.filter((s) => s.text.trim());
    if (segments.length === 0) return setError(t.transcript.empty);
    setBusy(true);
    setError(null);
    try {
      const take = pending.audioRef
        ? {
            audioRef: pending.audioRef,
            durationMs: pending.durationMs,
            segments,
            origin: pending.purpose,
            scriptVersion: pending.purpose === "script" ? story.version : undefined,
            sttLocale: pending.transcript.locale,
            provider: pending.transcript.provider,
          }
        : null;
      if (isCapture) {
        // One review for a recording: the words, the name and the details to check are all here.
        await saveStory({ reviewedText: segments.map((s) => s.text.trim()).join(" "), sourceKind: "audio", take, displayName: name });
        if (pending.media === "video") {
          // Someone who just filmed themselves wants that video; other formats stay one tap away.
          update((s) => ({ choices: { ...s.choices, kind: "captioned-video" } }));
          go("preview");
        } else {
          update((s) => ({ choices: { ...s.choices, kind: "narrated-video", narration: "recorded" } }));
          go("format");
        }
      } else {
        await saveStory({ take });
        update((s) => ({
          choices: { ...s.choices, ...(pending.media === "video" ? { kind: "captioned-video" } : { kind: "narrated-video", narration: "recorded" }) },
        }));
        go("preview");
      }
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <StepShell
      title={t.transcript.title}
      lead={t.transcript.lead}
      actions={
        <Button className={bigButton} onClick={save} disabled={busy}>
          {t.common.continue}
        </Button>
      }
    >
      <div className="flex flex-col gap-2">
        <span className="font-semibold">{pending.media === "video" ? t.transcript.watch : t.transcript.listen}</span>
        {pending.media === "video" ? (
          <video controls playsInline src={pending.audioUrl} className="mx-auto block max-h-[50vh] w-full max-w-sm rounded-lg bg-black object-contain" />
        ) : (
          <audio controls src={pending.audioUrl} className="w-full" />
        )}
      </div>
      {isMock && (
        <Alert>
          <AlertDescription>{pending.transcript.model === "script-echo" ? t.transcript.mockScript : t.transcript.mockFixture}</AlertDescription>
        </Alert>
      )}
      {uncertain.length > 0 && (
        <div className="flex flex-col gap-2 rounded-xl border-2 border-amber-500/60 bg-amber-50 p-4 text-amber-950">
          <h2 className="font-semibold">{t.transcript.uncertainTitle}</h2>
          <ul className="flex flex-wrap gap-2">
            {uncertain.map((w, i) => (
              <li key={`${w.text}-${i}`}>
                <mark className="rounded bg-amber-200 px-1.5 py-0.5">{w.text}</mark>
              </li>
            ))}
          </ul>
        </div>
      )}
      {pending.segments.map((seg, i) => (
        <div key={i} className="flex flex-col gap-2">
          <label htmlFor={`seg-${i}`} className="text-sm font-medium text-muted-foreground">
            {t.transcript.part(i + 1)} · {(seg.startMs / 1000).toFixed(1)}s
          </label>
          <Textarea
            id={`seg-${i}`}
            lang={LANGUAGES[story.sourceLanguage].uiLocale}
            className="text-base md:text-base"
            value={seg.text}
            onChange={(e) =>
              update((s) => ({
                pending: s.pending && {
                  ...s.pending,
                  segments: s.pending.segments.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)),
                },
              }))
            }
          />
        </div>
      ))}
      {isCapture && (
        <>
          <IdentifyingFlags text={edited} language={story.sourceLanguage} />
          <DisplayNameField value={name} onChange={setName} />
        </>
      )}
      {bigChange && (
        <Alert>
          <AlertDescription>{t.transcript.bigChange}</AlertDescription>
        </Alert>
      )}
      {error && <ErrorNote message={error} />}
    </StepShell>
  );
}

export function ReviewStep() {
  const { t, flow, go, saveStory, errorText } = useApp();
  const story = flow.story!;
  const [text, setText] = useState(story.reviewedText);
  const [name, setName] = useState(story.displayName ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const left = MAX_STORY_CHARS - text.length;
  const takeDiffers = story.take?.origin === "capture" && story.take.segments.map((s) => s.text).join(" ") !== text.trim();

  const save = async () => {
    if (!text.trim()) return setError(t.write.empty);
    setBusy(true);
    setError(null);
    try {
      await saveStory({ reviewedText: text, displayName: name });
      go("format");
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <StepShell
      title={t.review.title}
      lead={t.review.lead}
      actions={
        <Button className={bigButton} onClick={save} disabled={busy || left < 0}>
          {t.common.continue}
        </Button>
      }
    >
      <div className="flex flex-col gap-2">
        <label htmlFor="reviewed" className="sr-only">
          {t.review.title}
        </label>
        <Textarea
          id="reviewed"
          lang={LANGUAGES[story.sourceLanguage].uiLocale}
          className="min-h-48 font-story text-lg leading-relaxed md:text-lg"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <p aria-live="polite" className={left < 0 ? "font-medium text-destructive" : "text-sm text-muted-foreground"}>
          {left < 0 ? t.write.overLimit(-left) : t.write.charsLeft(left)}
        </p>
      </div>
      {takeDiffers && <p className="text-sm text-muted-foreground">{t.review.takeNote}</p>}

      <IdentifyingFlags text={text} language={story.sourceLanguage} />
      <DisplayNameField value={name} onChange={setName} />
      {error && <ErrorNote message={error} />}
    </StepShell>
  );
}
