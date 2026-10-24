"use client";

import { useState } from "react";
import { ShieldCheck, ShieldX, UserRound } from "lucide-react";
import { useApp } from "@/components/app-state";
import { DeleteStory } from "@/components/flow/delete-story";
import { EarlierStories } from "@/components/flow/earlier-stories";
import { bigButton, checkRow, OptionButton, StepShell } from "@/components/step-shell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { api } from "@/lib/client/api";
import { formatKey, recommendFormats, defaultShowName } from "@/lib/domain/privacy-guide";
import type { AgeGate, PrivacyPreferences } from "@/lib/domain/types";

/**
 * The welcome screen asks the age question directly, so the first tap is a
 * real answer rather than "Start" (plan section 3: no story content before it).
 */
export function WelcomeStep() {
  const { t, ui, update, go, errorText } = useApp();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const answer = async (ageGate: AgeGate) => {
    setBusy(true);
    setError(null);
    try {
      const { story } = await api.createStory({ ageGate, interfaceLanguage: ui });
      update({ story });
      go(ageGate === "adult" ? "privacy" : "guardian");
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <StepShell title={t.welcome.title} lead={t.welcome.lead} showBack={false}>
      <EarlierStories />
      <section aria-labelledby="age-title" className="flex flex-col gap-3">
        <h2 id="age-title" className="font-heading text-xl font-bold">
          {t.age.title}
        </h2>
        <p className="text-muted-foreground">{t.age.why}</p>
        <OptionButton title={t.age.adult} onClick={() => answer("adult")} disabled={busy} />
        <OptionButton title={t.age.minor} onClick={() => answer("under-18")} disabled={busy} />
        {error && <ErrorNote message={error} />}
      </section>
      <details className="rounded-xl border bg-card p-4">
        <summary className="cursor-pointer font-semibold">{t.welcome.stepsTitle}</summary>
        <ol className="mt-3 flex flex-col gap-2">
          {t.welcome.steps.map((s, i) => (
            <li key={s} className="flex items-start gap-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm text-primary-foreground" aria-hidden>
                {i + 1}
              </span>
              <span className="pt-0.5">{s}</span>
            </li>
          ))}
        </ol>
      </details>
      <p className="text-sm text-muted-foreground">{t.common.notConnected}</p>
    </StepShell>
  );
}

export function GuardianStep() {
  const { t, flow, update, go, errorText } = useApp();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const story = flow.story;
  if (!story) return null;

  const decide = async (decision: "approved-in-simulation" | "declined") => {
    setBusy(true);
    setError(null);
    try {
      const { story: updated } = await api.guardianCapture(story.id, decision);
      update({ story: updated });
      if (decision === "approved-in-simulation") go("privacy");
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  if (story.guardianCapture === "declined") {
    return (
      <StepShell title={t.guardian.declinedTitle} lead={t.guardian.declinedBody} showBack={false}>
        <DeleteStory />
      </StepShell>
    );
  }

  return (
    <StepShell title={t.guardian.title} lead={t.guardian.body}>
      <div className="flex flex-col gap-4 rounded-xl border-2 border-dashed border-primary/50 bg-card p-4">
        <h2 className="flex items-center gap-2 font-semibold">
          <UserRound className="size-5" aria-hidden /> {t.guardian.simTitle}
        </h2>
        <p className="text-sm text-muted-foreground">{t.guardian.simBody}</p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button className={bigButton} onClick={() => decide("approved-in-simulation")} disabled={busy}>
            <ShieldCheck aria-hidden /> {t.guardian.approve}
          </Button>
          <Button variant="outline" className={bigButton} onClick={() => decide("declined")} disabled={busy}>
            <ShieldX aria-hidden /> {t.guardian.decline}
          </Button>
        </div>
      </div>
      {error && <ErrorNote message={error} />}
    </StepShell>
  );
}

const PRIVACY_KEYS = ["hideFace", "hideVoice", "hideName", "hideSurroundings"] as const;

export function PrivacyStep() {
  const { t, flow, update, go, saveStory, errorText } = useApp();
  const [prefs, setPrefs] = useState<PrivacyPreferences>(
    flow.story?.privacy ?? { hideFace: false, hideVoice: false, hideName: false, hideSurroundings: false, notSure: false },
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const labels = { hideFace: t.privacy.face, hideVoice: t.privacy.voice, hideName: t.privacy.name, hideSurroundings: t.privacy.surroundings };
  const suggestions = recommendFormats(prefs);

  const save = async (p: PrivacyPreferences) => {
    setBusy(true);
    setError(null);
    try {
      await saveStory({ privacy: p });
      const first = recommendFormats(p)[0];
      update((s) => ({
        choices: {
          ...s.choices,
          kind: first.kind,
          narration: first.kind === "narrated-video" ? first.narration : p.hideVoice ? "synthetic" : "recorded",
          showName: defaultShowName(p),
        },
      }));
      go("capture");
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <StepShell
      title={t.privacy.title}
      lead={t.privacy.lead}
      actions={
        <>
          <Button variant="ghost" className={bigButton} onClick={() => save({ ...prefs, notSure: false, hideFace: false, hideVoice: false, hideName: false, hideSurroundings: false })} disabled={busy}>
            {t.privacy.skip}
          </Button>
          <Button className={bigButton} onClick={() => save(prefs)} disabled={busy}>
            {t.common.continue}
          </Button>
        </>
      }
    >
      <fieldset className="flex flex-col gap-3">
        <legend className="sr-only">{t.privacy.title}</legend>
        {PRIVACY_KEYS.map((key) => (
          <label key={key} className={checkRow}>
            <Checkbox
              checked={prefs[key]}
              onCheckedChange={(checked) => setPrefs((p) => ({ ...p, [key]: checked === true, notSure: false }))}
            />
            <span className="text-base">{labels[key]}</span>
          </label>
        ))}
        <label className={checkRow}>
          <Checkbox
            checked={prefs.notSure}
            onCheckedChange={(checked) =>
              setPrefs(checked === true ? { hideFace: false, hideVoice: false, hideName: false, hideSurroundings: false, notSure: true } : { ...prefs, notSure: false })
            }
          />
          <span className="text-base">{t.privacy.notSure}</span>
        </label>
      </fieldset>

      <div className="rounded-xl bg-secondary p-4" aria-live="polite">
        <h2 className="mb-2 font-semibold">{t.privacy.suggestedTitle}</h2>
        <ul className="flex list-disc flex-col gap-1 pl-5">
          {suggestions.map((s) => (
            <li key={formatKey(s)}>{t.privacy.suggestion[formatKey(s) as keyof typeof t.privacy.suggestion]}</li>
          ))}
        </ul>
        {(prefs.hideFace || prefs.hideSurroundings) && <p className="mt-3 text-sm">{t.privacy.noCamera}</p>}
        {prefs.notSure && <p className="mt-3 text-sm">{t.privacy.notSureNote}</p>}
      </div>
      <p className="text-sm text-muted-foreground">{t.privacy.caveat}</p>
      {error && <ErrorNote message={error} />}
    </StepShell>
  );
}

export function ErrorNote({ message, title }: { message: string; title?: string }) {
  return (
    <Alert variant="destructive" role="alert">
      {title && <AlertTitle>{title}</AlertTitle>}
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
