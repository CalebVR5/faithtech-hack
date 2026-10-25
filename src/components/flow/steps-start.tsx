"use client";

import { useState } from "react";
import { ChevronRight, ShieldCheck, ShieldX, Sunrise, UserRound, Waves } from "lucide-react";
import { useApp } from "@/components/app-state";
import { DeleteStory } from "@/components/flow/delete-story";
import { EarlierStories } from "@/components/flow/earlier-stories";
import { bigButton, OptionButton, StepNumber, StepShell } from "@/components/step-shell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/client/api";
import { STORY_TYPES, type AgeGate, type StoryType } from "@/lib/domain/types";

const PATH_ICONS: Record<StoryType, React.ReactNode> = {
  baptism: <Waves />,
  testimony: <Sunrise />,
};

/** One of the two paths: the screen's main decision, so larger than an ordinary option. */
function PathCard({ type, onClick }: { type: StoryType; onClick: () => void }) {
  const { t } = useApp();
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-start gap-3 rounded-xl border bg-card p-4 text-left transition-colors outline-none hover:border-primary/60 focus-visible:ring-2 focus-visible:ring-ring sm:items-center sm:gap-4 sm:p-5"
    >
      <span aria-hidden className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary sm:size-12 sm:rounded-xl [&_svg]:size-5 sm:[&_svg]:size-6">
        {PATH_ICONS[type]}
      </span>
      <span className="flex flex-1 flex-col gap-1">
        <span className="font-heading text-lg leading-snug font-bold">{t.paths[type].title}</span>
        <span className="text-pretty text-muted-foreground">{t.paths[type].body}</span>
      </span>
      <ChevronRight
        aria-hidden
        className="size-5 shrink-0 self-center text-primary transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
      />
    </button>
  );
}

/**
 * The welcome screen asks which story to tell, so the first tap is a real
 * answer rather than "Start". Nothing is stored until the age question.
 */
export function WelcomeStep() {
  const { t, update, go } = useApp();

  return (
    <StepShell title={t.welcome.title} lead={t.welcome.lead} showBack={false}>
      <section aria-labelledby="paths-title" className="flex flex-col gap-3">
        <h2 id="paths-title" className="font-heading text-xl font-bold">
          {t.paths.title}
        </h2>
        {STORY_TYPES.map((type) => (
          <PathCard
            key={type}
            type={type}
            onClick={() => {
              update({ storyType: type });
              go("age");
            }}
          />
        ))}
      </section>
      <EarlierStories />
      <details className="rounded-xl border bg-card p-4">
        <summary className="cursor-pointer font-semibold">{t.welcome.stepsTitle}</summary>
        <ol className="mt-3 flex flex-col gap-2">
          {t.welcome.steps.map((s, i) => (
            <li key={s} className="flex items-start gap-3">
              <StepNumber n={i + 1} />
              <span className="pt-0.5">{s}</span>
            </li>
          ))}
        </ol>
      </details>
    </StepShell>
  );
}

/** The age question starts the story (plan section 3: no story content before it). */
export function AgeStep() {
  const { t, ui, flow, update, go, errorText } = useApp();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const storyType = flow.storyType;
  if (!storyType) return null;

  const answer = async (ageGate: AgeGate) => {
    setBusy(true);
    setError(null);
    try {
      const { story } = await api.createStory({ storyType, ageGate, interfaceLanguage: ui });
      update({ story });
      go(ageGate === "adult" ? "capture" : "guardian");
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <StepShell
      title={t.age.title}
      lead={t.age.why}
      eyebrow={
        <>
          <span aria-hidden>{PATH_ICONS[storyType]}</span>
          {t.paths.sharing(t.paths[storyType].title)}
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <OptionButton title={t.age.adult} onClick={() => answer("adult")} disabled={busy} />
        <OptionButton title={t.age.minor} onClick={() => answer("under-18")} disabled={busy} />
      </div>
      {error && <ErrorNote message={error} />}
      {/* Someone arriving by a direct link skips the welcome screen, so their earlier story shows here too. */}
      <EarlierStories />
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
      if (decision === "approved-in-simulation") go("capture");
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

export function ErrorNote({ message, title }: { message: string; title?: string }) {
  return (
    <Alert variant="destructive" role="alert">
      {title && <AlertTitle>{title}</AlertTitle>}
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
