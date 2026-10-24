"use client";

import { useMemo, useState } from "react";
import { AArrowDown, AArrowUp, BadgeCheck, Clapperboard, Image as ImageIcon, Mic, MicOff, Volume2 } from "lucide-react";
import { useApp, type OutputChoices } from "@/components/app-state";
import { CloudConsent } from "@/components/cloud-consent";
import { DeleteStory } from "@/components/flow/delete-story";
import { GuardianAssetPanel } from "@/components/flow/guardian-asset";
import { ErrorNote } from "@/components/flow/steps-start";
import { useTranscribe } from "@/components/flow/steps-capture";
import { RecorderPanel } from "@/components/recorder";
import { bigButton, checkRow, OptionButton, StepShell } from "@/components/step-shell";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { api } from "@/lib/client/api";
import { LANGUAGE_IDS, LANGUAGES, isLanguageId, type LanguageId } from "@/lib/domain/languages";
import { CARD_MAX_CHARS } from "@/lib/domain/limits";
import { conflictsFor, isRecommended } from "@/lib/domain/privacy-guide";
import { sentenceSpans, type SentenceSpan } from "@/lib/domain/text";
import type { NarrationMode } from "@/lib/domain/types";

export function FormatStep() {
  const { t, flow, update, go } = useApp();
  const story = flow.story!;
  const { kind, narration } = flow.choices;
  const [reRecord, setReRecord] = useState(!story.take);
  const suggested = <Badge variant="secondary">{t.format.suggested}</Badge>;
  const setChoice = (patch: Partial<OutputChoices>) => update((s) => ({ choices: { ...s.choices, ...patch } }));
  const voiceConflict = conflictsFor(story.privacy, { kind, narration }).includes("recorded-voice-kept");
  const voices: Array<{ mode: NarrationMode; title: string; body: string; icon: React.ReactNode }> = [
    { mode: "recorded", title: t.format.recorded, body: t.format.recordedBody, icon: <Mic /> },
    { mode: "synthetic", title: t.format.synthetic, body: t.format.syntheticBody, icon: <Volume2 /> },
    { mode: "none", title: t.format.none, body: t.format.noneBody, icon: <MicOff /> },
  ];
  // Respect a choice to hide the voice: lead with the alternatives instead of persuading (plan section 4, option C).
  if (story.privacy.hideVoice) voices.push(voices.shift()!);

  const next = () => {
    if (kind === "narrated-video" && narration === "recorded" && (reRecord || !story.take)) go("script");
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
          icon={<ImageIcon />}
          title={t.format.card}
          body={t.format.cardBody}
          selected={kind === "card"}
          badge={isRecommended(story.privacy, { kind: "card" }) && suggested}
          onClick={() => setChoice({ kind: "card" })}
        />
        <OptionButton
          icon={<Clapperboard />}
          title={t.format.video}
          body={t.format.videoBody}
          selected={kind === "narrated-video"}
          onClick={() => setChoice({ kind: "narrated-video" })}
        />
      </div>

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
              selected={narration === v.mode}
              badge={isRecommended(story.privacy, { kind: "narrated-video", narration: v.mode }) && suggested}
              onClick={() => setChoice({ narration: v.mode })}
            />
          ))}
          {voiceConflict && (
            <Alert>
              <AlertDescription>{t.format.conflictVoice}</AlertDescription>
            </Alert>
          )}
          {narration === "recorded" && story.take && (
            <div className="flex flex-col gap-2 pl-2" role="radiogroup">
              <OptionButton title={t.format.useCapture} selected={!reRecord} onClick={() => setReRecord(false)} />
              <OptionButton title={t.format.recordScript} selected={reRecord} onClick={() => setReRecord(true)} />
            </div>
          )}
        </div>
      )}

      <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
        <h2 className="mb-1 font-semibold">{t.format.unavailableTitle}</h2>
        <ul className="list-disc pl-5">
          {t.format.unavailable.map((u) => (
            <li key={u}>{u}</li>
          ))}
        </ul>
      </div>
    </StepShell>
  );
}

export function ScriptStep() {
  const { t, flow } = useApp();
  const story = flow.story!;
  const [size, setSize] = useState(1);
  const locale = LANGUAGES[story.sourceLanguage].uiLocale;
  const sentences = useMemo(() => sentenceSpans(story.reviewedText, locale), [story.reviewedText, locale]);
  const { busy, error, awaitingConsent, setAwaitingConsent, send, submit } = useTranscribe("script");
  const sizes = ["text-lg", "text-xl", "text-2xl", "text-3xl"];

  return (
    <StepShell title={t.script.title} lead={t.script.lead}>
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
          purpose="transcription"
          keepsRecording
          onAgree={() => {
            const audio = awaitingConsent;
            setAwaitingConsent(null);
            void send(audio, story.reviewedText);
          }}
          onDecline={() => setAwaitingConsent(null)}
        />
      ) : (
        <RecorderPanel onUse={(audio) => submit(audio, story.reviewedText)} busy={busy} />
      )}
      {busy && <p aria-live="polite">{t.record.transcribing}</p>}
      {error && <ErrorNote message={error} />}
    </StepShell>
  );
}

/** The default card passage is the longest run of opening sentences that fits; the author changes it freely. */
function defaultRange(sentences: SentenceSpan[], kind: OutputChoices["kind"]): [number, number] {
  if (sentences.length === 0) return [0, 0];
  if (kind !== "card") return [0, sentences.length - 1];
  let end = 0;
  while (end + 1 < sentences.length && sentences[end + 1].end - sentences[0].start <= CARD_MAX_CHARS) end++;
  return [0, end];
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
  const range = choices.range && choices.range[1] < sentences.length ? choices.range : defaultRange(sentences, choices.kind);
  const outputLanguage = choices.outputLanguage ?? story.sourceLanguage;
  const usesTake = choices.kind === "narrated-video" && choices.narration === "recorded";
  const span: [number, number] | undefined = sentences.length ? [sentences[range[0]].start, sentences[range[1]].end] : undefined;
  const passageChars = span ? span[1] - span[0] : 0;
  const tooLong = choices.kind === "card" && passageChars > CARD_MAX_CHARS;
  const showName = choices.showName && Boolean(story.displayName);
  const nameConflict = conflictsFor(story.privacy, { kind: choices.kind, showName }).includes("name-shown");

  const [consentFor, setConsentFor] = useState<"translation" | "narration" | null>(null);
  const [pendingLanguage, setPendingLanguage] = useState<LanguageId | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  const setChoice = (patch: Partial<OutputChoices>) => update((s) => ({ choices: { ...s.choices, ...patch } }));
  const key = JSON.stringify({
    v: story.version,
    kind: choices.kind,
    narration: choices.kind === "card" ? "none" : choices.narration,
    outputLanguage,
    showName,
    label: choices.showStoryLabel,
    span: usesTake ? null : span,
  });
  const asset = flow.asset?.asset.spec.kind === choices.kind ? flow.asset : null;
  const current = asset && flow.renderedKey === key && asset.asset.status === "rendered";

  const render = async (narrationAgreed = flow.cloud.narration) => {
    if (choices.kind === "narrated-video" && choices.narration === "synthetic" && !narrationAgreed) {
      setConsentFor("narration");
      return;
    }
    setBusy(true);
    setError(null);
    setChecked(false);
    try {
      const state = await api.render({
        storyId: story.id,
        kind: choices.kind,
        narration: choices.narration,
        outputLanguage,
        showName,
        showStoryLabel: choices.showStoryLabel,
        span: usesTake ? undefined : span,
        cloud: { ...flow.cloud, narration: narrationAgreed },
      });
      update({ asset: state, renderedKey: key });
    } catch (err) {
      update({ asset: null, renderedKey: null });
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  const approve = async () => {
    if (!asset) return;
    setBusy(true);
    setError(null);
    try {
      const state = await api.approve({ assetId: asset.asset.id, assetVersion: asset.asset.version, purpose: "personal-output", decision: "granted" });
      update({ asset: state });
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  const chooseLanguage = (value: string) => {
    if (!isLanguageId(value)) return;
    if (value !== story.sourceLanguage && !flow.cloud.translation) {
      setPendingLanguage(value);
      setConsentFor("translation");
      return;
    }
    setChoice({ outputLanguage: value });
  };

  const approved = current && asset.exportDecision.ok;
  const personalConsent = asset?.consents.find((c) => c.purpose === "personal-output" && c.decision === "granted");
  const included = t.preview.included;

  return (
    <StepShell title={t.preview.title}>
      {usesTake ? (
        <p className="text-muted-foreground">{t.preview.wholeTake}</p>
      ) : (
        <fieldset className="flex flex-col gap-2">
          <legend className="font-semibold text-lg">{t.preview.passage}</legend>
          <p className="text-sm text-muted-foreground">{t.preview.passageHint}</p>
          <div lang={locale} className="flex flex-col gap-1 rounded-xl border bg-card p-3 font-story text-lg leading-relaxed">
            {sentences.map((s, i) => {
              const on = i >= range[0] && i <= range[1];
              return (
                <button
                  key={s.start}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setChoice({ range: toggleSentence(range, i) })}
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
              {tooLong ? t.preview.passageTooLong(CARD_MAX_CHARS) : t.preview.passageCount(passageChars, CARD_MAX_CHARS)}
            </p>
          )}
        </fieldset>
      )}

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

      {consentFor && (
        <CloudConsent
          purpose={consentFor}
          onAgree={() => {
            if (consentFor === "translation" && pendingLanguage) setChoice({ outputLanguage: pendingLanguage });
            // Agreeing to narration was part of asking for the preview, so carry on with it.
            if (consentFor === "narration") void render(true);
            setConsentFor(null);
            setPendingLanguage(null);
          }}
          onDecline={() => {
            setConsentFor(null);
            setPendingLanguage(null);
          }}
        />
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
        {nameConflict && (
          <Alert>
            <AlertDescription>{t.preview.nameConflict}</AlertDescription>
          </Alert>
        )}
        <label className={checkRow}>
          <Checkbox checked={choices.showStoryLabel} onCheckedChange={(c) => setChoice({ showStoryLabel: c === true })} />
          <span>{t.preview.showLabel}</span>
        </label>
      </div>

      {/* One gold action per moment: making the preview, then approving it, then sharing. */}
      <Button
        variant={current ? "outline" : "default"}
        className={`${bigButton} sm:w-fit`}
        onClick={() => render()}
        disabled={busy || tooLong || Boolean(consentFor)}
      >
        {asset ? t.preview.update : t.preview.make}
      </Button>
      {busy && <p aria-live="polite">{t.preview.making}</p>}
      {error && <ErrorNote message={error} />}
      {asset && !current && !busy && (
        <Alert>
          <AlertDescription>{t.preview.outdated}</AlertDescription>
        </Alert>
      )}

      {current && asset.asset.previewUrl && (
        <div className="flex flex-col gap-4">
          <div className="mx-auto w-full max-w-sm overflow-hidden rounded-xl border bg-black shadow-sm">
            {asset.asset.spec.kind === "card" ? (
              // eslint-disable-next-line @next/next/no-img-element -- private, session-owned file; not for next/image optimization
              <img src={asset.asset.previewUrl} alt={asset.asset.spec.cardText ?? t.preview.previewAlt} className="block w-full" />
            ) : (
              <video src={asset.asset.previewUrl} controls playsInline className="block w-full" />
            )}
          </div>
          {asset.asset.spec.kind === "narrated-video" && (
            <details className="rounded-lg border bg-card p-3 text-sm">
              <summary className="cursor-pointer font-medium">{t.preview.included.words}</summary>
              <p lang={LANGUAGES[asset.asset.spec.captionLanguage].uiLocale} className="mt-2">
                {asset.asset.spec.captions.map((c) => c.text).join(" ")}
              </p>
            </details>
          )}

          <div className="rounded-xl border bg-card p-4">
            <h2 className="mb-3 font-semibold text-lg">{t.preview.includedTitle}</h2>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="text-muted-foreground">{included.format}</dt>
              <dd>{asset.asset.spec.kind === "card" ? included.card : included.video}</dd>
              <dt className="text-muted-foreground">{included.words}</dt>
              <dd>
                {usesTake ? included.wholeTake : asset.asset.spec.excerpt ? included.excerpt(passageChars) : included.whole}
              </dd>
              <dt className="text-muted-foreground">{included.name}</dt>
              <dd>{asset.asset.spec.displayName ? included.nameShown(asset.asset.spec.displayName) : included.nameHidden}</dd>
              <dt className="text-muted-foreground">{included.voice}</dt>
              <dd>{{ recorded: included.recorded, synthetic: included.synthetic, none: included.none }[asset.asset.spec.narration]}</dd>
              {asset.asset.spec.narration !== "none" && (
                <>
                  <dt className="text-muted-foreground">{included.spoken}</dt>
                  <dd>{LANGUAGES[asset.asset.spec.narrationLanguage].displayName}</dd>
                </>
              )}
              <dt className="text-muted-foreground">{included.text}</dt>
              <dd>
                {LANGUAGES[asset.asset.spec.captionLanguage].displayName}
                {asset.asset.spec.machineTranslated && ` · ${t.preview.machineTranslated}`}
              </dd>
              <dt className="text-muted-foreground">{included.visuals}</dt>
              <dd>{included.plain}</dd>
            </dl>
          </div>

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
              <label className="flex cursor-pointer items-start gap-3">
                <Checkbox className="mt-1" checked={checked} onCheckedChange={(c) => setChecked(c === true)} />
                <span>{t.preview.approveCheck}</span>
              </label>
              <Button className={`${bigButton} sm:w-fit`} onClick={approve} disabled={!checked || busy}>
                {t.preview.approve}
              </Button>
            </div>
          )}

          {asset.needsGuardian && personalConsent && <GuardianAssetPanel state={asset} purposes={["personal-output"]} />}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">{t.preview.keepPrivate}</p>
            <Button variant={approved ? "default" : "outline"} className={bigButton} onClick={() => go("share")} disabled={!approved}>
              {t.preview.toShare}
            </Button>
          </div>
        </div>
      )}
      <DeleteStory />
    </StepShell>
  );
}
