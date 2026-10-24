"use client";

import Link from "next/link";
import { useApp } from "@/components/app-state";
import { bigButton } from "@/components/step-shell";
import { buttonVariants } from "@/components/ui/button";

// A truthful short notice for this test deployment, in the interface language
// (plan section 6, "One-day deliverable"). Not a legal privacy policy: the
// operator, contact and legal review are unresolved and the page says so.
export default function PrivacyPage() {
  const { t, provider } = useApp();
  const p = t.privacyPage;
  const providerName = provider === "gcp" ? "Google Cloud" : provider === "mock" ? t.cloud.serviceMock : "…";

  return (
    <article className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-3xl font-bold tracking-tight">{p.title}</h1>
        <p className="text-sm text-muted-foreground">{p.updated}</p>
      </div>
      <p className="text-lg">{p.intro}</p>
      <p className="rounded-lg bg-secondary p-3">{p.providerNow(providerName)}</p>
      {p.sections.map((section) => (
        <section key={section.title} className="flex flex-col gap-2">
          <h2 className="font-semibold text-xl">{section.title}</h2>
          <ul className="flex list-disc flex-col gap-1.5 pl-5">
            {section.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ))}
      <Link href="/" className={`${buttonVariants()} ${bigButton} w-fit`}>
        {p.back}
      </Link>
    </article>
  );
}
