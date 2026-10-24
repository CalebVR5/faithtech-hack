"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useApp } from "@/components/app-state";
import { bigButton } from "@/components/step-shell";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/client/api";

/** Inline confirmation rather than a browser dialog. */
export function DeleteStory() {
  const { t, flow, reset, errorText } = useApp();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const story = flow.story;
  if (!story) return null;

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
