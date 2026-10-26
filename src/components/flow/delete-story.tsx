"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useApp } from "@/components/app-state";
import { bigButton } from "@/components/step-shell";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/client/api";

/**
 * Asks whether to delete the current story before starting another, so it
 * isn't left on the server by accident. A kept story can be found again from
 * the start screen until it expires. Once the file was handed over the server
 * copy is already gone, so there's nothing to ask.
 */
export function NewStoryButton() {
  const { t, flow, reset, errorText } = useApp();
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const story = flow.serverCopyDeleted ? null : flow.story;

  const deleteAndStart = async () => {
    if (!story) return reset("welcome");
    setBusy(true);
    try {
      await api.deleteStory(story.id);
      reset("welcome");
    } catch (err) {
      setError(errorText(err));
      setBusy(false);
    }
  };

  if (!asking || !story) {
    return (
      <Button variant="outline" className={bigButton} onClick={() => (story ? setAsking(true) : reset("welcome"))}>
        {t.common.newStory}
      </Button>
    );
  }
  return (
    <div role="group" aria-label={t.common.newStory} className="flex flex-col gap-3 rounded-xl border bg-card p-4">
      <p>{t.common.newStoryConfirm}</p>
      {error && <p className="text-destructive">{error}</p>}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:flex-wrap sm:justify-end">
        <Button variant="ghost" className={bigButton} onClick={() => setAsking(false)} disabled={busy}>
          {t.common.newStoryCancel}
        </Button>
        <Button variant="outline" className={bigButton} onClick={() => reset("welcome")} disabled={busy}>
          {t.common.newStoryKeep}
        </Button>
        <Button variant="destructive" className={bigButton} onClick={deleteAndStart} disabled={busy}>
          {t.common.newStoryDelete}
        </Button>
      </div>
    </div>
  );
}

/** Inline confirmation rather than a browser dialog. */
export function DeleteStory() {
  const { t, flow, reset, errorText } = useApp();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const story = flow.story;
  if (!story || flow.serverCopyDeleted) return null;

  const remove = async () => {
    setBusy(true);
    try {
      await api.deleteStory(story.id);
      reset("deleted");
    } catch (err) {
      setError(errorText(err));
      setBusy(false);
    }
  };

  if (!confirming) {
    return (
      <Button variant="ghost" className={`${bigButton} w-fit text-destructive`} onClick={() => setConfirming(true)}>
        <Trash2 aria-hidden /> {t.common.deleteStory}
      </Button>
    );
  }
  return (
    <div role="group" aria-label={t.common.deleteStory} className="flex flex-col gap-3 rounded-xl border border-destructive/40 bg-card p-4">
      <p>{t.common.deleteConfirm}</p>
      {error && <p className="text-destructive">{error}</p>}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button variant="outline" className={bigButton} onClick={() => setConfirming(false)} disabled={busy}>
          {t.common.keep}
        </Button>
        <Button variant="destructive" className={bigButton} onClick={remove} disabled={busy}>
          {t.common.deleteYes}
        </Button>
      </div>
    </div>
  );
}
