"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, Sunrise, Waves } from "lucide-react";
import { useApp } from "@/components/app-state";
import { EarlierStories } from "@/components/flow/earlier-stories";
import { bigButton, OptionButton, StepNumber, StepShell } from "@/components/step-shell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/client/api";
import { STORY_TYPES, type StoryType } from "@/lib/domain/types";

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

/**
 * "{terms}" and "{privacy}" in a translated sentence become links, so each
 * language keeps its own word order.
 */
function LegalNotice({ text }: { text: string }) {
  const { t } = useApp();
  const links: Record<string, React.ReactNode> = {
    "{terms}": <Link key="terms" href="/terms" className="font-medium text-primary underline underline-offset-4">{t.legal.termsTitle}</Link>,
    "{privacy}": <Link key="privacy" href="/privacy" className="font-medium text-primary underline underline-offset-4">{t.legal.privacyTitle}</Link>,
  };
  return <p className="text-sm text-muted-foreground">{text.split(/(\{terms\}|\{privacy\})/).map((part) => links[part] ?? part)}</p>;
}

/**
 * The age answer starts the story (plan section 3: no story content before
 * it). The service is for adults only; nothing is created for anyone else.
 */
export function AgeStep() {
  const { t, ui, flow, update, go, errorText } = useApp();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const storyType = flow.storyType;
  if (!storyType) return null;

  const start = async () => {
    setBusy(true);
    setError(null);
    try {
      const { story } = await api.createStory({ storyType, ageGate: "adult", interfaceLanguage: ui });
      update({ story });
      go("capture");
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
      <p className="rounded-lg bg-secondary p-3">{t.age.privacy}</p>
      <div className="flex flex-col gap-3">
        <OptionButton title={t.age.adult} onClick={start} disabled={busy} />
        <OptionButton title={t.age.minor} onClick={() => go("adults-only")} disabled={busy} />
        <LegalNotice text={t.age.legal} />
      </div>
      {error && <ErrorNote message={error} />}
      {/* Someone arriving by a direct link skips the welcome screen, so their unfinished story shows here too. */}
      <EarlierStories />
    </StepShell>
  );
}

/** Shown after "No, I'm under 18". No story was created and nothing was sent. */
export function AdultsOnlyStep() {
  const { t, reset } = useApp();
  return (
    <StepShell
      title={t.adultsOnly.title}
      lead={t.adultsOnly.body}
      actions={
        <Button variant="outline" className={bigButton} onClick={() => reset("welcome")}>
          {t.adultsOnly.back}
        </Button>
      }
    />
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
