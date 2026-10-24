"use client";

import { useEffect } from "react";
import { useApp, type Step } from "@/components/app-state";
import { CaptureStep, RecordStep, ReviewStep, TranscriptStep, WriteStep } from "@/components/flow/steps-capture";
import { FormatStep, PreviewStep, ScriptStep } from "@/components/flow/steps-output";
import { ShareStep } from "@/components/flow/step-share";
import { AgeStep, GuardianStep, PrivacyStep, WelcomeStep } from "@/components/flow/steps-start";
import { bigButton, StepShell } from "@/components/step-shell";
import { Button } from "@/components/ui/button";

/** Coarse progress through the four stages shown on the welcome screen. */
const STAGE: Partial<Record<Step, number>> = {
  capture: 0,
  write: 0,
  record: 0,
  transcript: 1,
  review: 1,
  format: 2,
  script: 2,
  preview: 3,
  share: 3,
};

export function Flow() {
  const { t, flow, reset } = useApp();
  const stage = STAGE[flow.step];

  // Steps after the age gate need a story; a missing one means the session was reset.
  const lostStory = flow.step !== "welcome" && flow.step !== "age" && flow.step !== "deleted" && !flow.story;
  useEffect(() => {
    if (lostStory) reset("welcome");
  }, [lostStory, reset]);
  if (lostStory) return null;

  return (
    <>
      {stage !== undefined && (
        <ol className="mb-6 grid grid-cols-4 gap-2" aria-label={t.welcome.stepsTitle}>
          {t.welcome.steps.map((label, i) => (
            <li key={label} aria-current={i === stage ? "step" : undefined} className="flex flex-col gap-1">
              <span className={`h-1.5 rounded-full ${i <= stage ? "bg-primary" : "bg-muted"}`} aria-hidden />
              <span className={`text-xs ${i === stage ? "font-semibold text-foreground" : "text-muted-foreground"} hidden sm:block`}>{label}</span>
              <span className="sr-only">{label}</span>
            </li>
          ))}
        </ol>
      )}
      {flow.step === "welcome" && <WelcomeStep />}
      {flow.step === "age" && <AgeStep />}
      {flow.step === "guardian" && <GuardianStep />}
      {flow.step === "privacy" && <PrivacyStep />}
      {flow.step === "capture" && <CaptureStep />}
      {flow.step === "write" && <WriteStep />}
      {flow.step === "record" && <RecordStep />}
      {flow.step === "transcript" && flow.pending && <TranscriptStep />}
      {flow.step === "review" && <ReviewStep />}
      {flow.step === "format" && <FormatStep />}
      {flow.step === "script" && <ScriptStep />}
      {flow.step === "preview" && <PreviewStep />}
      {flow.step === "share" && flow.asset && <ShareStep />}
      {flow.step === "deleted" && (
        <StepShell
          title={t.common.deletedTitle}
          lead={t.common.deletedBody}
          showBack={false}
          actions={
            <Button className={bigButton} onClick={() => reset("welcome")}>
              {t.common.newStory}
            </Button>
          }
        />
      )}
    </>
  );
}
