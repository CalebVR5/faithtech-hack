"use client";

import Link from "next/link";
import { useApp } from "@/components/app-state";

/** The legal notices, reachable from every screen. */
export function SiteFooter() {
  const { t } = useApp();
  const link = "rounded-sm underline decoration-input underline-offset-4 outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring";
  return (
    <footer className="border-t">
      <nav aria-label={t.legal.contents} className="mx-auto flex w-full max-w-2xl flex-wrap gap-x-6 gap-y-2 px-4 py-6 text-sm text-muted-foreground">
        <Link href="/privacy" className={link}>
          {t.legal.privacyTitle}
        </Link>
        <Link href="/terms" className={link}>
          {t.legal.termsTitle}
        </Link>
      </nav>
    </footer>
  );
}
