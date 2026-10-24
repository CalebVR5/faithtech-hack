"use client";

import Link from "next/link";
import { FlaskConical } from "lucide-react";
import { useApp } from "@/components/app-state";
import { LANGUAGE_IDS, LANGUAGES, isLanguageId } from "@/lib/domain/languages";

/** The river-teal shell that frames every screen, plus the prototype notice. */
export function SiteHeader() {
  const { t, ui, setUi, provider } = useApp();
  return (
    <header>
      <div className="bg-river text-river-foreground">
        <div className="mx-auto flex w-full max-w-2xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="font-heading text-lg font-bold text-river-foreground no-underline">
            {t.common.appName}
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <label className="flex items-center gap-2">
              <span className="sr-only">{t.common.interfaceLanguage}</span>
              <select
                className="h-9 rounded-lg border border-river-muted/50 bg-river-deep px-2 text-sm text-river-foreground outline-none focus-visible:ring-2 focus-visible:ring-action"
                value={ui}
                onChange={(e) => isLanguageId(e.target.value) && setUi(e.target.value)}
                aria-label={t.common.interfaceLanguage}
              >
                {LANGUAGE_IDS.map((id) => (
                  <option key={id} value={id} lang={LANGUAGES[id].uiLocale}>
                    {LANGUAGES[id].displayName}
                  </option>
                ))}
              </select>
            </label>
            <Link
              href="/privacy"
              className="rounded-sm text-river-foreground underline decoration-river-muted underline-offset-4 outline-none hover:decoration-action focus-visible:ring-2 focus-visible:ring-action"
            >
              {t.common.privacy}
            </Link>
          </div>
        </div>
      </div>
      <div className="border-b border-border bg-accent text-accent-foreground">
        <div className="mx-auto flex w-full max-w-2xl items-start gap-2 px-4 py-2 text-sm">
          <FlaskConical className="mt-0.5 size-4 shrink-0" aria-hidden />
          <p>
            <strong>{t.common.prototypeTitle}.</strong> {t.common.prototypeBody}
            {provider === "mock" && <span className="text-muted-foreground"> {t.common.mockMode}.</span>}
            {ui !== "en" && <span className="text-muted-foreground"> {t.common.draftTranslation}</span>}
          </p>
        </div>
      </div>
    </header>
  );
}
