"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Download, MessageCircle, Share2, ShieldCheck } from "lucide-react";
import { useApp } from "@/components/app-state";
import { DeleteStory, NewStoryButton } from "@/components/flow/delete-story";
import { ErrorNote } from "@/components/flow/steps-start";
import { bigButton, StepShell } from "@/components/step-shell";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/client/api";
import { exportFilename } from "@/lib/domain/output-labels";

type Destination = "whatsapp" | "instagram" | "save";

/** Selection is teal; gold stays reserved for the share action. */
const toggleClass =
  "h-auto min-h-11 whitespace-normal py-2 text-sm aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:font-bold aria-pressed:text-primary-foreground aria-pressed:hover:bg-river-deep";

const saveLinkClass = "inline-flex items-center gap-2 rounded-lg font-medium";

export function ShareStep() {
  const { t, flow, update, errorText } = useApp();
  const asset = flow.asset!.asset;
  const [file, setFile] = useState<{ file: File; url: string } | null>(null);
  const [destination, setDestination] = useState<Destination>("whatsapp");
  const [shareNote, setShareNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => () => {
    if (file) URL.revokeObjectURL(file.url);
  }, [file]);

  const prepare = async () => {
    setBusy(true);
    setError(null);
    try {
      const blob = await api.exportAsset(asset.id);
      // The server deleted the story as it handed this over; this browser's copy is now the only one.
      update({ serverCopyDeleted: true });
      const name = exportFilename(flow.story?.storyType ?? "baptism", asset.spec.kind);
      const f = new File([blob], name, { type: blob.type || asset.mimeType });
      setFile({ file: f, url: URL.createObjectURL(f) });
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  // The approved file is fetched on arrival, so the sharing buttons are ready without an extra step.
  const latestPrepare = useRef(prepare);
  useEffect(() => {
    latestPrepare.current = prepare;
  });
  useEffect(() => {
    const timer = window.setTimeout(() => void latestPrepare.current(), 0);
    return () => window.clearTimeout(timer);
  }, [asset.id, asset.version]);

  const share = async () => {
    if (!file) return;
    const files = [file.file];
    if (!navigator.canShare?.({ files })) {
      setShareNote(t.share.shareUnavailable);
      return;
    }
    await navigator.share({ files }).catch(() => undefined);
    // Closing the share sheet is not evidence of delivery or a post (plan section 3).
    setShareNote(t.share.shareClosed);
  };

  const destinations: Array<{ id: Destination; label: string; icon: React.ReactNode }> = [
    { id: "whatsapp", label: t.share.whatsapp, icon: <MessageCircle /> },
    { id: "instagram", label: t.share.instagram, icon: <Camera /> },
    { id: "save", label: t.share.save, icon: <Download /> },
  ];

  return (
    // No Back: the story behind this file no longer exists on the server.
    <StepShell title={t.share.title} lead={t.share.lead} showBack={!flow.serverCopyDeleted}>
      {!file ? (
        busy || !error ? (
          <p aria-live="polite" className="text-muted-foreground">
            {t.share.preparing}
          </p>
        ) : (
          <Button variant="outline" className={`${bigButton} sm:w-fit`} onClick={prepare} disabled={busy}>
            {t.common.tryAgain}
          </Button>
        )
      ) : (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-2" role="group" aria-label={t.share.relational}>
            {destinations.map((d) => (
              <Button
                key={d.id}
                variant="outline"
                aria-pressed={destination === d.id}
                className={`${toggleClass} flex-col gap-1`}
                onClick={() => {
                  setDestination(d.id);
                  setShareNote(null);
                }}
              >
                <span aria-hidden className="[&_svg]:size-5">{d.icon}</span>
                {d.label}
              </Button>
            ))}
          </div>

          {destination === "instagram" && (
            <h2 className="font-semibold text-lg">{asset.spec.kind === "card" ? t.share.instagramPost : t.share.instagramReel}</h2>
          )}
          <div className="flex flex-wrap gap-3">
            {destination === "save" ? (
              <a href={file.url} download={file.file.name} className={`${saveLinkClass} bg-action font-bold text-action-foreground hover:bg-action-hover ${bigButton}`}>
                <Download className="size-4" aria-hidden /> {t.share.save}
              </a>
            ) : (
              <>
                <Button className={bigButton} onClick={share}>
                  <Share2 aria-hidden /> {t.share.shareButton}
                </Button>
                <a href={file.url} download={file.file.name} className={`${saveLinkClass} border border-border bg-background hover:bg-muted ${bigButton}`}>
                  <Download className="size-4" aria-hidden /> {t.share.save}
                </a>
              </>
            )}
          </div>
          {shareNote && (
            <p aria-live="polite" className="rounded-lg bg-secondary p-3 text-sm">
              {shareNote}
            </p>
          )}

          {destination === "whatsapp" && (
            <ol className="flex list-decimal flex-col gap-1 pl-5">
              {t.share.whatsappSteps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
          )}
          {destination === "instagram" && (
            <>
              <ol className="flex list-decimal flex-col gap-1 pl-5">
                {t.share.instagramSteps.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ol>
              <p className="text-sm text-muted-foreground">{t.share.instagramAudience}</p>
            </>
          )}
          {destination !== "save" && <p className="text-sm text-muted-foreground">{t.share.handoffNote}</p>}
        </div>
      )}
      {error && <ErrorNote message={error} />}

      <div className="flex flex-col gap-4 border-t pt-6">
        {flow.serverCopyDeleted && (
          <p className="flex items-start gap-2 rounded-lg bg-secondary p-3">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
            {t.share.removed}
          </p>
        )}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
          <DeleteStory />
          <NewStoryButton />
        </div>
      </div>
    </StepShell>
  );
}
