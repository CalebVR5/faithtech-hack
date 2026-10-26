"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useApp } from "@/components/app-state";
import { bigButton } from "@/components/step-shell";
import { buttonVariants } from "@/components/ui/button";
import { LANGUAGES } from "@/lib/domain/languages";
import { LEGAL, LEGAL_FACTS, type Block, type OperatorView } from "@/lib/legal";
import { LEGAL_EFFECTIVE_DATE } from "@/lib/legal/versions";

export type LegalKind = "privacy" | "terms";

/** Operator details plus the contact email, which the page links rather than prints in the text. */
export type LegalOperator = OperatorView & { email: string };

/**
 * One legal notice in the interface language. Shown only with real operator
 * details: a production server won't start without them, and in development
 * the page says which settings are missing instead of inventing any.
 */
export function LegalPage({ kind, operator, missing }: { kind: LegalKind; operator: LegalOperator | null; missing: string[] }) {
  const { t, ui } = useApp();
  if (!operator) {
    return (
      <article className="flex flex-col gap-4">
        <h1 className="font-heading text-3xl font-bold tracking-tight">{kind === "privacy" ? t.legal.privacyTitle : t.legal.termsTitle}</h1>
        <p className="rounded-lg border border-destructive/40 bg-card p-4">
          Development only: set {missing.join(", ")} in .env.local to show this notice. A production server won&apos;t start without them.
        </p>
      </article>
    );
  }

  const doc = LEGAL[ui][kind](operator, LEGAL_FACTS);
  const date = new Intl.DateTimeFormat(LANGUAGES[ui].uiLocale, { dateStyle: "long", timeZone: "UTC" }).format(new Date(LEGAL_EFFECTIVE_DATE));
  const linkClass = "font-medium text-primary underline underline-offset-4";
  const links: Record<string, ReactNode> = {
    "{email}": <a href={`mailto:${operator.email}`} className={linkClass}>{operator.email}</a>,
    "{terms}": <Link href="/terms" className={linkClass}>{t.legal.termsTitle}</Link>,
    "{privacy}": <Link href="/privacy" className={linkClass}>{t.legal.privacyTitle}</Link>,
  };
  const withLinks = (text: string) =>
    text.split(/(\{email\}|\{terms\}|\{privacy\})/).map((part, i) => <span key={i}>{links[part] ?? part}</span>);
  const block = (b: Block, i: number) =>
    typeof b === "string" ? (
      <p key={i}>{withLinks(b)}</p>
    ) : (
      <ul key={i} className="flex list-disc flex-col gap-1.5 pl-5">
        {b.list.map((item) => (
          <li key={item}>{withLinks(item)}</li>
        ))}
      </ul>
    );

  return (
    <article className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="font-heading text-3xl font-bold tracking-tight">{doc.title}</h1>
        <p className="text-sm text-muted-foreground">{t.legal.effective(date)}</p>
      </header>
      {ui !== "en" && <p className="rounded-lg bg-secondary p-3 text-sm">{t.legal.translationNote}</p>}
      <p className="text-lg">{withLinks(doc.summary)}</p>
      <nav aria-labelledby="legal-contents" className="rounded-xl border bg-card p-4">
        <h2 id="legal-contents" className="mb-2 font-semibold">
          {t.legal.contents}
        </h2>
        <ol className="flex list-decimal flex-col gap-1 pl-5">
          {doc.sections.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="underline-offset-4 hover:underline">
                {s.heading}
              </a>
            </li>
          ))}
        </ol>
      </nav>
      {doc.sections.map((s) => (
        <section key={s.id} id={s.id} aria-labelledby={`${s.id}-heading`} className="flex scroll-mt-4 flex-col gap-3">
          <h2 id={`${s.id}-heading`} className="font-heading text-xl font-bold">
            {s.heading}
          </h2>
          {s.blocks.map(block)}
        </section>
      ))}
      <Link href="/" className={`${buttonVariants({ variant: "outline" })} ${bigButton} w-fit`}>
        {t.legal.back}
      </Link>
    </article>
  );
}
