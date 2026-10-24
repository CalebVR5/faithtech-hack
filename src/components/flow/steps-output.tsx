"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AArrowDown, AArrowUp, BadgeCheck, Clapperboard, Image as ImageIcon, LoaderCircle, Mic, MicOff, Video, Volume2 } from "lucide-react";
import { useApp, type OutputChoices } from "@/components/app-state";
import { CloudConsent } from "@/components/cloud-consent";
import { DeleteStory } from "@/components/flow/delete-story";
import { GuardianAssetPanel } from "@/components/flow/guardian-asset";
import { ErrorNote } from "@/components/flow/steps-start";
import { useTranscribe } from "@/components/flow/steps-capture";
import { FaceCoverEditor } from "@/components/face-cover-editor";
import { RecorderPanel } from "@/components/recorder";
import { bigButton, checkRow, OptionButton, StepShell } from "@/components/step-shell";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { api } from "@/lib/client/api";
import { LANGUAGE_IDS, LANGUAGES, isLanguageId, type LanguageId } from "@/lib/domain/languages";
import { CARD_MAX_CHARS } from "@/lib/domain/limits";
import { sentenceSpans } from "@/lib/domain/text";
import type { NarrationMode } from "@/lib/domain/types";

export function FormatStep() {
  const { t, flow, update, go } = useApp();
  const story = flow.story!;
  const { kind, narration } = flow.choices;
  const [reRecord, setReRecord] = useState(!story.take);
  const hasVideo = Boolean(story.take?.videoRef);
  const [reFilm, setReFilm] = useState(!hasVideo);
  const setChoice = (patch: Partial<OutputChoices>) => update((s) => ({ choices: { ...s.choices, ...patch } }));
  // Each choice says in one line what it shares, so the person decides with that in view.
  const voices: Array<{ mode: NarrationMode; title: string; body: string; note: string; icon: React.ReactNode }> = [
    { mode: "recorded", title: t.format.recorded, body: t.format.recordedBody, note: t.format.sharesRecorded, icon: <Mic /> },
    { mode: "synthetic", title: t.format.synthetic, body: t.format.syntheticBody, note: t.format.sharesSynthetic, icon: <Volume2 /> },
    { mode: "none", title: t.format.none, body: t.format.noneBody, note: t.format.sharesNone, icon: <MicOff /> },
  ];

  const next = () => {
    if (kind === "captioned-video" && (reFilm || !hasVideo)) go("script");
    else if (kind === "narrated-video" && narration === "recorded" && (reRecord || !story.take)) go("script");
    else go("preview");
  };

  return (
    <StepShell
      title={t.format.title}
      actions={
        <Button className={bigButton} onClick={next}>
          {t.common.continue}
        </Button>
      }
    >
      <div className="flex flex-col gap-3" role="group" aria-label={t.format.title}>
        <OptionButton
          icon={<Video />}
          title={t.format.faceVideo}
          body={t.format.faceVideoBody}
          note={t.format.sharesFace}
          selected={kind === "captioned-video"}
          onClick={() => setChoice({ kind: "captioned-video" })}
        />
        <OptionButton
          icon={<ImageIcon />}
          title={t.format.card}
          body={t.format.cardBody}
          note={t.format.sharesCard}
          selected={kind === "card"}
          onClick={() => setChoice({ kind: "card" })}
        />
        <OptionButton
          icon={<Clapperboard />}
          title={t.format.video}
          body={t.format.videoBody}
          note={t.format.sharesPlain}
          selected={kind === "narrated-video"}
          onClick={() => setChoice({ kind: "narrated-video" })}
        />
      </div>

      {kind === "captioned-video" && hasVideo && (
        <div className="flex flex-col gap-2 pl-2" role="radiogroup">
          <OptionButton title={t.format.useCaptureVideo} selected={!reFilm} onClick={() => setReFilm(false)} />
          <OptionButton title={t.format.recordVideo} selected={reFilm} onClick={() => setReFilm(true)} />
        </div>
      )}

      {kind === "narrated-video" && (
        <div className="flex flex-col gap-3" role="group" aria-labelledby="voice-title">
          <h2 id="voice-title" className="font-semibold text-lg">
            {t.format.voice}
          </h2>
          {voices.map((v) => (
            <OptionButton
              key={v.mode}
              icon={v.icon}
              title={v.title}
              body={v.body}
              note={v.note}
              selected={narration === v.mode}
              onClick={() => setChoice({ narration: v.mode })}
            />
          ))}
          {narration === "recorded" && story.take && (
            <div className="flex flex-col gap-2 pl-2" role="radiogroup">
              <OptionButton title={t.format.useCapture} selected={!reRecord} onClick={() => setReRecord(false)} />
              <OptionButton title={t.format.recordScript} selected={reRecord} onClick={() => setReRecord(true)} />
            </div>
          )}
        </div>
      )}

      <p className="text-sm text-muted-foreground">{t.format.identityNote}</p>
    </StepShell>
  );
}

export function ScriptStep() {
  const { t, flow } = useApp();
  const story = flow.story!;
  const [size, setSize] = useState(1);
  const locale = LANGUAGES[story.sourceLanguage].uiLocale;
  const sentences = useMemo(() => sentenceSpans(story.reviewedText, locale), [story.reviewedText, locale]);
  const media = flow.choices.kind === "captioned-video" ? "video" : "audio";
  const { busy, error, awaitingConsent, setAwaitingConsent, send, submit } = useTranscribe("script", media);
  const sizes = ["text-lg", "text-xl", "text-2xl", "text-3xl"];

  return (
    <StepShell title={media === "video" ? t.script.filmTitle : t.script.title} lead={t.script.lead}>
      <div className="flex gap-2">
        <Button variant="outline" size="icon-lg" aria-label={t.script.smaller} onClick={() => setSize((s) => Math.max(0, s - 1))} disabled={size === 0}>
          <AArrowDown aria-hidden />
        </Button>
        <Button variant="outline" size="icon-lg" aria-label={t.script.larger} onClick={() => setSize((s) => Math.min(sizes.length - 1, s + 1))} disabled={size === sizes.length - 1}>
          <AArrowUp aria-hidden />
        </Button>
      </div>
      {/* The approved words only: no instructions inside the script that could be read aloud as testimony. */}
      <div lang={locale} className={`flex max-h-[50vh] flex-col gap-4 overflow-y-auto rounded-xl border bg-card p-5 font-story leading-relaxed ${sizes[size]}`}>
        {sentences.map((s) => (
          <p key={s.start}>{s.text}</p>
        ))}
      </div>
      {awaitingConsent ? (
        <CloudConsent
          keepsRecording
          keepsVideo={media === "video"}
          onAgree={() => {
            const recording = awaitingConsent;
            setAwaitingConsent(null);
            void send(recording, story.reviewedText);
          }}
          onDecline={() => setAwaitingConsent(null)}
        />
      ) : (
        <RecorderPanel media={media} onUse={(recording) => submit(recording, story.reviewedText)} busy={busy} />
      )}
      {busy && <p aria-live="polite">{media === "video" ? t.record.transcribingVideo : t.record.transcribing}</p>}
      {error && <ErrorNote message={error} />}
    </StepShell>
  );
}

/** Keeps the selection one contiguous passage: extend or trim at the edges, otherwise start again. */
function toggleSentence([start, end]: [number, number], i: number): [number, number] {
  if (i === start - 1) return [i, end];
  if (i === end + 1) return [start, i];
  if (start === end) return [i, i];
  if (i === start) return [start + 1, end];
  if (i === end) return [start, end - 1];
  return [i, i];
}

export function PreviewStep() {
  const { t, flow, update, go, errorText } = useApp();
  const story = flow.story!;
  const choices = flow.choices;
  const locale = LANGUAGES[story.sourceLanguage].uiLocale;
  const sentences = useMemo(() => sentenceSpans(story.reviewedText, locale), [story.reviewedText, locale]);
  // A whole story that fits is selected for the person; a card from a longer one starts empty, so they choose.
  const wholeFits = sentences.length > 0 && sentences.at(-1)!.end - sentences[0].start <= CARD_MAX_CHARS;
  const range: [number, number] | null =
    choices.range && choices.range[1] < sentences.length
      ? choices.range
      : choices.kind === "card" && !wholeFits
        ? null
        : sentences.length
          ? [0, sentences.length - 1]
          : null;
  const outputLanguage = choices.outputLanguage ?? story.sourceLanguage;
  const usesTake = choices.kind === "captioned-video" || (choices.kind === "narrated-video" && choices.narration === "recorded");
  const span: [number, number] | undefined = range ? [sentences[range[0]].start, sentences[range[1]].end] : undefined;
  const passageChars = span ? span[1] - span[0] : 0;
  const tooLong = choices.kind === "card" && passageChars > CARD_MAX_CHARS;
  const showName = choices.showName && Boolean(story.displayName);
  const coverOn = choices.kind === "captioned-video" && (choices.coverFace ?? false);
  const faceCover = coverOn ? choices.faceCover : null;

  const [askConsent, setAskConsent] = useState<{ language?: LanguageId } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rendering = useRef<string | null>(null);

  const setChoice = (patch: Partial<OutputChoices>) => update((s) => ({ choices: { ...s.choices, ...patch } }));
  const key = JSON.stringify({
    v: story.version,
    kind: choices.kind,
    narration: choices.kind === "card" ? "none" : choices.narration,
    outputLanguage,
    showName,
    span: usesTake ? null : span,
    cover: faceCover,
  });
  const asset = flow.asset?.asset.spec.kind === choices.kind ? flow.asset : null;
  const current = asset && flow.renderedKey === key && asset.asset.status === "rendered";

  // One notice covers translation and the synthetic voice for this story.
  const cloudAgreed = flow.cloud.translation && flow.cloud.narration;
  const needsCloud = outputLanguage !== story.sourceLanguage || (choices.kind === "narrated-video" && choices.narration === "synthetic");
  // With a cover requested, wait until it's placed: never render the uncovered video instead.
  const canRender = (usesTake || range !== null) && !tooLong && (!needsCloud || cloudAgreed) && (!coverOn || faceCover !== null);

  const render = async () => {
    rendering.current = key;
    setBusy(true);
    setError(null);
    try {
      const state = await api.render({
        storyId: story.id,
        kind: choices.kind,
        narration: choices.narration,
        outputLanguage,
        showName,
        span: usesTake ? undefined : span,
        faceCover: faceCover ?? undefined,
        cloud: { translation: cloudAgreed, narration: cloudAgreed },
      });
      update({ asset: state, renderedKey: key });
    } catch (err) {
      update({ asset: null, renderedKey: null });
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };
  const latestRender = useRef(render);
  useEffect(() => {
    latestRender.current = render;
  });

  // The preview follows the choices: it renders on arrival and shortly after any change,
  // so there's no separate "make preview" step. A failed render waits for "Try again".
  useEffect(() => {
    // A key that already failed waits for "Try again"; any change makes a new key and tries again.
    if (!canRender || busy || current || rendering.current === key) return;
    const timer = window.setTimeout(() => void latestRender.current(), 600);
    return () => window.clearTimeout(timer);
  }, [canRender, busy, current, key]);

  const approve = async () => {
    if (!asset) return;
    setBusy(true);
    setError(null);
    try {
      const state = await api.approve({ assetId: asset.asset.id, assetVersion: asset.asset.version, purpose: "personal-output", decision: "granted" });
      update({ asset: state });
      // Approving is the step into sharing; a minor's version still waits for the guardian here.
      if (state.exportDecision.ok) go("share");
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  const chooseLanguage = (value: string) => {
    if (!isLanguageId(value)) return;
    if (value !== story.sourceLanguage && !cloudAgreed) {
      setAskConsent({ language: value });
      return;
    }
    setChoice({ outputLanguage: value });
  };

  const approved = current && asset.exportDecision.ok;
  const personalConsent = asset?.consents.find((c) => c.purpose === "personal-output" && c.decision === "granted");

  const passageField = (
    <>
          {usesTake ? (
            <p className="text-muted-foreground">{choices.kind === "captioned-video" ? t.preview.wholeVideoTake : t.preview.wholeTake}</p>
          ) : (
            <fieldset className="flex flex-col gap-2">
              <legend className="font-semibold text-lg">{t.preview.passage}</legend>
              <p className="text-sm text-muted-foreground">{t.preview.passageHint}</p>
              <div lang={locale} className="flex flex-col gap-1 rounded-xl border bg-card p-3 font-story text-lg leading-relaxed">
                {sentences.map((s, i) => {
                  const on = range !== null && i >= range[0] && i <= range[1];
                  return (
                    <button
                      key={s.start}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setChoice({ range: range ? toggleSentence(range, i) : [i, i] })}
                      className={`rounded-md px-2 py-1 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                        on ? "bg-secondary text-foreground ring-1 ring-primary/50" : "text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {s.text}
                    </button>
                  );
                })}
              </div>
              {choices.kind === "card" && (
                <p aria-live="polite" className={tooLong ? "font-medium text-destructive" : "text-sm text-muted-foreground"}>
                  {range === null
                    ? t.preview.chooseFirst(CARD_MAX_CHARS)
                    : tooLong
                      ? t.preview.passageTooLong(CARD_MAX_CHARS)
                      : t.preview.passageCount(passageChars, CARD_MAX_CHARS)}
                </p>
              )}
            </fieldset>
          )}

    </>
  );

  // The preview and its approval come first; choices to change it sit below.
  const choosePassageFirst = !usesTake && range === null;
  return (
    <StepShell title={t.preview.title}>
      {flow.history.at(-1) !== "format" && (
        <Button variant="link" className="h-auto w-fit p-0 text-base" onClick={() => go("format")}>
          {t.preview.changeFormat}
        </Button>
      )}
      {(askConsent || (needsCloud && !cloudAgreed)) && (
        <CloudConsent
          onAgree={() => {
            if (askConsent?.language) setChoice({ outputLanguage: askConsent.language });
            setAskConsent(null);
          }}
          onDecline={() => {
            setAskConsent(null);
            // Without the service, fall back to what needs none: the story's language and no synthetic voice.
            if (!askConsent) setChoice({ outputLanguage: story.sourceLanguage, ...(choices.narration === "synthetic" ? { narration: "none" } : {}) });
          }}
        />
      )}

      {choosePassageFirst && passageField}

      {current && asset.asset.previewUrl ? (
        <div className="flex flex-col gap-4">
          {/* Capped at about 60% of the screen so "Approve" sits within a short scroll on a phone. */}
          <div className="mx-auto w-fit max-w-full overflow-hidden rounded-xl border bg-black shadow-sm">
            {asset.asset.spec.kind === "card" ? (
              // eslint-disable-next-line @next/next/no-img-element -- private, session-owned file; not for next/image optimization
              <img src={asset.asset.previewUrl} alt={asset.asset.spec.cardText ?? t.preview.previewAlt} className="block max-h-[62vh] w-auto max-w-full" />
            ) : (
              <video src={asset.asset.previewUrl} controls playsInline className="block max-h-[62vh] w-auto max-w-full" />
            )}
          </div>
          {asset.asset.spec.kind !== "card" && (
            <details className="rounded-lg border bg-card p-3 text-sm">
              <summary className="cursor-pointer font-medium">{t.preview.captionWords}</summary>
              <p lang={LANGUAGES[asset.asset.spec.captionLanguage].uiLocale} className="mt-2">
                {asset.asset.spec.captions.map((c) => c.text).join(" ")}
              </p>
            </details>
          )}

          {approved ? (
            <div className="flex flex-col gap-2 rounded-xl border-2 border-primary/50 bg-card p-4">
              <p className="flex items-center gap-2 font-semibold">
                <BadgeCheck className="size-5 text-primary" aria-hidden /> {t.preview.approved(asset.asset.version)}
              </p>
              <p className="text-sm text-muted-foreground">{t.preview.approvedNote}</p>
            </div>
          ) : personalConsent ? null : (
            <div className="flex flex-col gap-3 rounded-xl border bg-card p-4">
              <h2 className="font-semibold text-lg">{t.preview.approveTitle}</h2>
              <p>{t.preview.approveCheck}</p>
              {/* One tap approves this exact file and moves on to sharing. */}
              <Button className={`${bigButton} sm:w-fit`} onClick={approve} disabled={busy}>
                {t.preview.approveAndContinue}
              </Button>
              <p className="text-sm text-muted-foreground">{t.preview.keepPrivate}</p>
            </div>
          )}

          {asset.needsGuardian && personalConsent && <GuardianAssetPanel state={asset} purposes={["personal-output"]} />}

          {approved && (
            <Button className={`${bigButton} sm:w-fit`} onClick={() => go("share")}>
              {t.preview.toShare}
            </Button>
          )}
        </div>
      ) : (
        !choosePassageFirst &&
        !(needsCloud && !cloudAgreed) && (
          <div
            className="mx-auto flex w-full flex-col items-center justify-center gap-3 rounded-xl border bg-muted p-6 text-center"
            style={
              choices.kind === "card"
                ? { aspectRatio: "1080 / 1350", maxWidth: "min(100%, calc(62vh * 1080 / 1350))" }
                : { aspectRatio: "720 / 1280", maxWidth: "min(100%, calc(62vh * 720 / 1280))" }
            }
          >
            {error ? (
              <>
                <ErrorNote message={error} />
                <Button
                  variant="outline"
                  className={bigButton}
                  onClick={() => {
                    rendering.current = null;
                    void render();
                  }}
                  disabled={busy}
                >
                  {t.common.tryAgain}
                </Button>
              </>
            ) : (
              <p aria-live="polite" className="flex items-center gap-2 text-muted-foreground">
                <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" aria-hidden /> {t.preview.making}
              </p>
            )}
          </div>
        )
      )}

      <section aria-labelledby="adjust-title" className="flex flex-col gap-5 border-t pt-6">
        <h2 id="adjust-title" className="font-heading text-xl font-bold">
          {t.preview.adjust}
        </h2>
        {!choosePassageFirst && passageField}
        <div className="flex flex-col gap-2">
          <label htmlFor="output-language" className="font-semibold text-lg">
            {t.preview.language}
          </label>
          <select
            id="output-language"
            className="h-11 rounded-lg border border-input bg-background px-3 text-base"
            value={outputLanguage}
            onChange={(e) => chooseLanguage(e.target.value)}
          >
            {LANGUAGE_IDS.map((id) => (
              <option key={id} value={id} lang={LANGUAGES[id].uiLocale}>
                {id === story.sourceLanguage ? t.preview.original(LANGUAGES[id].displayName) : LANGUAGES[id].displayName}
              </option>
            ))}
          </select>
          {outputLanguage !== story.sourceLanguage && <p className="text-sm">{t.preview.machineTranslated}</p>}
          {choices.kind === "narrated-video" && choices.narration !== "none" && <p className="text-sm text-muted-foreground">{t.preview.narrationStays}</p>}
        </div>

        {choices.kind === "captioned-video" && story.take?.videoRef && (
          <div className="flex flex-col gap-3">
            <label className={checkRow}>
              <Checkbox checked={coverOn} onCheckedChange={(c) => setChoice({ coverFace: c === true })} />
              <span>{t.preview.coverFace}</span>
            </label>
            {coverOn && (
              <FaceCoverEditor
                videoUrl={`/api/media/${story.take.videoRef}`}
                durationMs={story.take.durationMs}
                cover={choices.faceCover}
                onChange={(cover) => setChoice({ faceCover: cover })}
              />
            )}
          </div>
        )}

        <div className="flex flex-col gap-3">
          <label className={checkRow}>
            <Checkbox checked={showName} disabled={!story.displayName} onCheckedChange={(c) => setChoice({ showName: c === true })} />
            <span>
              {t.preview.showName}
              {story.displayName && <span className="text-muted-foreground"> ({story.displayName})</span>}
            </span>
          </label>
          {!story.displayName && <p className="text-sm text-muted-foreground">{t.preview.noName}</p>}
        </div>

      </section>
      <DeleteStory />
    </StepShell>
  );
}
