"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/components/app-state";
import { bigButton } from "@/components/step-shell";
import { Button } from "@/components/ui/button";
import { api, type StoryView } from "@/lib/client/api";
import { LANGUAGES } from "@/lib/domain/languages";

/**
 * Stories this browser session started earlier but no longer has open, after a
 * reload or "Start a new story". Without this they'd sit on the server until
 * they expire, with no way for the person to delete them.
 */
export function EarlierStories() {
  const { t, ui, flow, resume, errorText } = useApp();
  const [stories, setStories] = useState<StoryView[]>([]);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const openId = flow.story?.id;

  useEffect(() => {
    let live = true;
    api.listStories().then(
      (r) => live && setStories(r.stories.filter((s) => s.id !== openId)),
      () => undefined,
    );
    return () => {
      live = false;
    };
  }, [openId]);

  if (stories.length === 0) return null;
  const time = new Intl.DateTimeFormat(LANGUAGES[ui].uiLocale, { timeStyle: "short" });

  const remove = async (id: string) => {
    setBusy(true);
    setError(null);
    try {
      await api.deleteStory(id);
      setStories((list) => list.filter((s) => s.id !== id));
      setConfirming(null);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  // Secondary to the screen's own decision: one compact row per story and no
  // gold, so starting a new story stays the clear first choice.
  return (
    <section aria-labelledby="earlier-title" className="flex flex-col gap-3 rounded-xl border bg-card p-4">
      <h2 id="earlier-title" className="font-semibold">
        {t.welcome.earlierTitle}
      </h2>
      <ul className="flex flex-col divide-y">
        {stories.map((s) => (
          <li key={s.id} className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <p className="flex flex-col">
                <span className="font-semibold text-primary">{t.paths[s.storyType].title}</span>
                <span className="text-sm text-muted-foreground">{t.welcome.earlierStarted(time.format(s.createdAt))}</span>
              </p>
              {confirming !== s.id && (
                <div className="flex gap-2">
                  <Button variant="outline" className="h-10 px-4" onClick={() => resume(s)}>
                    {t.welcome.earlierContinue}
                  </Button>
                  <Button variant="ghost" className="h-10 px-3 text-destructive hover:text-destructive" onClick={() => setConfirming(s.id)}>
                    {t.welcome.earlierDelete}
                  </Button>
                </div>
              )}
            </div>
            {confirming === s.id && (
              <div role="group" aria-label={t.common.deleteStory} className="flex flex-col gap-3">
                <p>{t.common.deleteConfirm}</p>
                <div className="flex flex-col-reverse gap-3 sm:flex-row">
                  <Button variant="outline" className={bigButton} onClick={() => setConfirming(null)} disabled={busy}>
                    {t.common.keep}
                  </Button>
                  <Button variant="destructive" className={bigButton} onClick={() => remove(s.id)} disabled={busy}>
                    {t.common.deleteYes}
                  </Button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
      <p className="text-sm text-muted-foreground">{t.welcome.earlierNote}</p>
      {error && <p className="text-destructive">{error}</p>}
    </section>
  );
}
