"use client";

import { CloudUpload } from "lucide-react";
import { useApp, type CloudPurpose } from "@/components/app-state";
import { bigButton } from "@/components/step-shell";
import { Button } from "@/components/ui/button";

/**
 * Names the service, what's sent, why, retention and alternatives before any
 * transmission (plan section 6, "Website privacy notice"). Recorded in the
 * flow state per purpose; the server also refuses requests without it.
 */
export function CloudConsent({
  purpose,
  keepsRecording,
  onAgree,
  onDecline,
}: {
  purpose: CloudPurpose;
  keepsRecording?: boolean;
  onAgree: () => void;
  onDecline: () => void;
}) {
  const { t, provider, update } = useApp();
  const what = { transcription: t.cloud.transcription, translation: t.cloud.translation, narration: t.cloud.narration }[purpose];
  const why = { transcription: t.cloud.transcriptionWhy, translation: t.cloud.translationWhy, narration: t.cloud.narrationWhy }[purpose];
  const service = provider === "gcp" ? t.cloud.serviceGcp : t.cloud.serviceMock;

  return (
    <div role="group" aria-labelledby={`consent-${purpose}`} className="flex flex-col gap-3 rounded-xl border-2 border-primary/40 bg-card p-4">
      <h2 id={`consent-${purpose}`} className="flex items-center gap-2 font-semibold text-lg">
        <CloudUpload className="size-5" aria-hidden /> {t.cloud.title}
      </h2>
      <p>{t.cloud.sentence(what, service, why)}</p>
      {provider !== "gcp" && <p className="text-sm text-muted-foreground">{t.cloud.mockNote}</p>}
      {keepsRecording && <p className="text-sm">{t.cloud.keepNote}</p>}
      <p className="text-sm text-muted-foreground">{t.cloud.retention}</p>
      <p className="text-sm text-muted-foreground">{t.cloud.alternative}</p>
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button variant="outline" className={bigButton} onClick={onDecline}>
          {t.cloud.decline}
        </Button>
        <Button
          className={bigButton}
          onClick={() => {
            update((s) => ({ cloud: { ...s.cloud, [purpose]: true } }));
            onAgree();
          }}
        >
          {t.cloud.agree}
        </Button>
      </div>
    </div>
  );
}
