import type { Metadata } from "next";
import { Suspense } from "react";
import { LegalDocument } from "@/components/legal-document";

export const metadata: Metadata = { title: "Terms of Use" };

export default function TermsPage() {
  return (
    <Suspense fallback={null}>
      <LegalDocument kind="terms" />
    </Suspense>
  );
}
