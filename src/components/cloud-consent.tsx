"use client";

import { CloudUpload } from "lucide-react";
import { useApp } from "@/components/app-state";
import { bigButton } from "@/components/step-shell";
import { Button } from "@/components/ui/button";

/**
 * One notice per story, shown the first time anything would leave the device
 * (plan section 6, "Website privacy notice"): it names the service, each use
 * (transcription, translation, synthetic voice; the last two only when the
 * person picks them), retention and alternatives. Agreeing covers this story;
 * the server still refuses any request without it.
 */
export function CloudConsent({
  keepsRecording,
  keepsVideo,
  onAgree,
  onDecline,
}: {
  keepsRecording?: boolean;
  /** A camera recording: the app keeps the video itself; only its sound is sent. */
  keepsVideo?: boolean;
  onAgree: () => void;
  onDecline: () => void;
}) {
  const { t, provider, update } = useApp();
  const service = provider === "gcp" ? t.cloud.serviceGcp : t.cloud.serviceMock;

  return (
    <div role="group" aria-labelledby="cloud-consent-title" className="flex flex-col gap-3 rounded-xl border-2 border-primary/40 bg-card p-4">
      <h2 id="cloud-consent-title" className="flex items-center gap-2 font-semibold text-lg">
        <CloudUpload className="size-5" aria-hidden /> {t.cloud.title}
      </h2>
      <p>{t.cloud.intro(service)}</p>
      <ul className="flex list-disc flex-col gap-1 pl-5">
        {t.cloud.uses.map((use) => (
          <li key={use}>{use}</li>
        ))}
      </ul>
      {provider !== "gcp" && <p className="text-sm text-muted-foreground">{t.cloud.mockNote}</p>}
      {keepsVideo ? (
        <p className="text-sm">{t.cloud.keepVideoNote}</p>
      ) : (
        keepsRecording && <p className="text-sm">{t.cloud.keepNote}</p>
      )}
      <p className="text-sm text-muted-foreground">{t.cloud.retention}</p>
      <p className="text-sm text-muted-foreground">{t.cloud.alternative}</p>
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button variant="outline" className={bigButton} onClick={onDecline}>
          {t.cloud.decline}
        </Button>
        <Button
          className={bigButton}
          onClick={() => {
            update((s) => ({
              cloud: { transcription: true, translation: true, narration: true },
              videoNotice: s.videoNotice || Boolean(keepsVideo),
            }));
            onAgree();
          }}
        >
          {t.cloud.agree}
        </Button>
      </div>
    </div>
  );
}
