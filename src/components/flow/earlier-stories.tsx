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

  return (
    <section aria-labelledby="earlier-title" className="flex flex-col gap-3 rounded-xl border border-primary/30 bg-card p-5">
      <h2 id="earlier-title" className="font-semibold">
        {t.welcome.earlierTitle}
      </h2>
      <ul className="flex flex-col gap-4">
        {stories.map((s) => (
          <li key={s.id} className="flex flex-col gap-3">
            <p>
              <span className="block font-semibold text-primary">{t.paths[s.storyType].title}</span>
              {t.welcome.earlierBody(time.format(s.createdAt))}
            </p>
            {confirming === s.id ? (
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
            ) : (
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button className={bigButton} onClick={() => resume(s)}>
                  {t.welcome.earlierContinue}
                </Button>
                <Button variant="outline" className={`${bigButton} text-destructive`} onClick={() => setConfirming(s.id)}>
                  {t.welcome.earlierDelete}
                </Button>
              </div>
            )}
          </li>
        ))}
      </ul>
      {error && <p className="text-destructive">{error}</p>}
    </section>
  );
}
