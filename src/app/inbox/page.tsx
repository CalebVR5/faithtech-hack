"use client";

import { useCallback, useEffect, useState } from "react";
import { useApp } from "@/components/app-state";
import { bigButton } from "@/components/step-shell";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LANGUAGES, isLanguageId } from "@/lib/domain/languages";
import { STORY_TYPES, type MockSubmission, type NarrationMode, type OutputKind, type StoryType } from "@/lib/domain/types";

interface InboxItem extends MockSubmission {
  kind: OutputKind;
  storyType: StoryType;
  mimeType: string;
  assetText: string;
  language: string;
  machineTranslated: boolean;
  narration: NarrationMode;
  guardianRequired: boolean;
  fileUrl?: string;
}

// The operator's side of the mock submission (plan section 3, "Send to demo
// inbox"). Protected by a passcode even though the data is fictional.
export default function InboxPage() {
  const { t } = useApp();
  const [items, setItems] = useState<InboxItem[] | null>(null);
  const [locked, setLocked] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<StoryType | "all">("all");
  const shown = items?.filter((item) => filter === "all" || item.storyType === filter);

  const load = useCallback(async () => {
    const res = await fetch("/api/inbox", { cache: "no-store" });
    if (res.status === 401) {
      setLocked(true);
      setItems(null);
      return;
    }
    setLocked(false);
    setItems((await res.json()).items);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch from an external API
    void load();
  }, [load]);

  const unlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/inbox", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passcode }),
    });
    if (!res.ok) return setError(t.inbox.badPasscode);
    setPasscode("");
    await load();
  };

  const lock = async (all: boolean) => {
    await fetch(all ? "/api/inbox?all=1" : "/api/inbox", { method: "DELETE" });
    await load();
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-heading text-3xl font-bold tracking-tight">{t.inbox.title}</h1>
      <Alert>
        <AlertDescription>{t.inbox.banner}</AlertDescription>
      </Alert>

      {locked && (
        <form onSubmit={unlock} className="flex flex-col gap-3 rounded-xl border bg-card p-4">
          <label htmlFor="passcode" className="font-semibold">
            {t.inbox.passcode}
          </label>
          <input
            id="passcode"
            type="password"
            autoComplete="off"
            className="h-11 rounded-lg border border-input bg-background px-3 text-base"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
          />
          {error && <p className="text-destructive">{error}</p>}
          <Button type="submit" className={`${bigButton} w-fit`}>
            {t.inbox.unlock}
          </Button>
        </form>
      )}

      {items && (
        <>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" className={bigButton} onClick={load}>
              {t.inbox.refresh}
            </Button>
            <Button variant="outline" className={bigButton} onClick={() => lock(false)}>
              {t.inbox.lock}
            </Button>
            <Button variant="destructive" className={bigButton} onClick={() => lock(true)}>
              {t.inbox.reset}
            </Button>
          </div>
          <div role="group" aria-label={t.inbox.filterLabel} className="flex flex-wrap gap-2">
            {(["all", ...STORY_TYPES] as const).map((f) => (
              <Button
                key={f}
                variant="outline"
                aria-pressed={filter === f}
                className="h-10 aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground aria-pressed:hover:bg-river-deep"
                onClick={() => setFilter(f)}
              >
                {f === "all" ? t.inbox.filterAll : t.inbox.storyType[f]}
              </Button>
            ))}
          </div>
          {shown?.length === 0 && <p className="text-muted-foreground">{t.inbox.empty}</p>}
          <ul className="flex flex-col gap-4">
            {shown?.map((item) => (
              <li key={item.id} className="flex flex-col gap-3 rounded-xl border bg-card p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>{t.inbox.storyType[item.storyType]}</Badge>
                  <Badge variant="secondary">{t.inbox.scope}</Badge>
                  <Badge variant="outline">{t.inbox.voice[item.narration]}</Badge>
                  {item.machineTranslated && <Badge variant="outline">{t.inbox.machineTranslated}</Badge>}
                  {item.guardianRequired && <Badge variant="outline">{t.inbox.guardian}</Badge>}
                  <span className="text-sm text-muted-foreground">
                    {t.inbox.received} {new Date(item.createdAt).toLocaleString()} · v{item.assetVersion}
                  </span>
                </div>
                {item.state === "withdrawn" ? (
                  <p className="text-muted-foreground">{t.inbox.withdrawn}</p>
                ) : (
                  <>
                    {item.fileUrl && (
                      <div className="w-full max-w-xs overflow-hidden rounded-lg border bg-black">
                        {item.kind === "card" ? (
                          // eslint-disable-next-line @next/next/no-img-element -- protected inbox file
                          <img src={item.fileUrl} alt={item.assetText} className="block w-full" />
                        ) : (
                          <video src={item.fileUrl} controls playsInline className="block w-full" />
                        )}
                      </div>
                    )}
                    <p lang={isLanguageId(item.language) ? LANGUAGES[item.language].uiLocale : undefined}>{item.assetText}</p>
                  </>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
