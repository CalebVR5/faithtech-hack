"use client";

import { useEffect } from "react";
import { useApp, type Step } from "@/components/app-state";
import { CaptureStep, RecordStep, ReviewStep, TranscriptStep, WriteStep } from "@/components/flow/steps-capture";
import { FormatStep, PreviewStep, ScriptStep } from "@/components/flow/steps-output";
import { ShareStep } from "@/components/flow/step-share";
import { AdultsOnlyStep, AgeStep, WelcomeStep } from "@/components/flow/steps-start";
import { bigButton, StepShell } from "@/components/step-shell";
import { Button } from "@/components/ui/button";
import { Waterline } from "@/components/waterline";
import type { StoryType } from "@/lib/domain/types";

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

/**
 * The storyteller's flow. `path` comes from a direct link (/baptism or
 * /testimony): a fresh start skips the welcome screen's choice, and Back still
 * leads to it. Once a path is chosen, the link doesn't override it.
 */
export function Flow({ path }: { path?: StoryType }) {
  const { t, flow, update, reset } = useApp();
  const stage = STAGE[flow.step];

  const startOnPath = path !== undefined && flow.step === "welcome" && !flow.story && !flow.storyType;
  useEffect(() => {
    if (startOnPath) update({ storyType: path, step: "age", history: ["welcome"] });
  }, [path, startOnPath, update]);

  // Steps after the age gate need a story; a missing one means the session was reset.
  const lostStory = !["welcome", "age", "adults-only", "deleted"].includes(flow.step) && !flow.story;
  const lostPath = flow.step === "age" && !flow.storyType;
  useEffect(() => {
    if (lostStory || lostPath) reset("welcome");
  }, [lostStory, lostPath, reset]);
  if (lostStory || lostPath || startOnPath) return null;

  return (
    <>
      {stage !== undefined && <Waterline stage={stage} labels={t.welcome.steps} title={t.welcome.stepsTitle} />}
      {flow.step === "welcome" && <WelcomeStep />}
      {flow.step === "age" && <AgeStep />}
      {flow.step === "adults-only" && <AdultsOnlyStep />}
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
