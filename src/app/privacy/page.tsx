import type { Metadata } from "next";
import { Suspense } from "react";
import { LegalDocument } from "@/components/legal-document";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <Suspense fallback={null}>
      <LegalDocument kind="privacy" />
    </Suspense>
  );
}
