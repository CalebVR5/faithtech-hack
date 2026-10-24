"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Copy, Download, Inbox, MessageCircle, Share2 } from "lucide-react";
import { useApp } from "@/components/app-state";
import { DeleteStory } from "@/components/flow/delete-story";
import { GuardianAssetPanel } from "@/components/flow/guardian-asset";
import { ErrorNote } from "@/components/flow/steps-start";
import { bigButton, OptionButton, StepShell } from "@/components/step-shell";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/client/api";
import { LANGUAGES } from "@/lib/domain/languages";

type Intention = "feedback" | "finished" | "keep";
type Destination = "whatsapp" | "instagram" | "other";

function CopyButton({ text, label }: { text: string; label: string }) {
  const { t } = useApp();
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="outline"
      className={bigButton}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 2000);
        } catch {
          // Clipboard needs a secure page; the text stays visible to copy by hand.
        }
      }}
    >
      <Copy aria-hidden /> <span aria-live="polite">{copied ? t.share.copied : label}</span>
    </Button>
  );
}

export function ShareStep() {
  const { t, flow, update, reset, errorText } = useApp();
  const story = flow.story!;
  const state = flow.asset!;
  const asset = state.asset;
  const [intention, setIntention] = useState<Intention>("feedback");
  const [message, setMessage] = useState(t.share.feedbackMessage);
  const [messageEdited, setMessageEdited] = useState(false);
  const [file, setFile] = useState<{ file: File; url: string } | null>(null);
  const [destination, setDestination] = useState<Destination>("whatsapp");
  const [shareNote, setShareNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inboxChecked, setInboxChecked] = useState(false);
  const idempotency = useRef(new Map<number, string>());

  useEffect(() => () => {
    if (file) URL.revokeObjectURL(file.url);
  }, [file]);

  const chooseIntention = (next: Intention) => {
    setIntention(next);
    if (!messageEdited) setMessage(next === "feedback" ? t.share.feedbackMessage : next === "finished" ? t.share.finishedMessage : "");
    if (next === "keep") setDestination("other");
  };

  const prepare = async () => {
    setBusy(true);
    setError(null);
    try {
      const blob = await api.exportAsset(asset.id);
      const name = asset.spec.kind === "card" ? "baptism-story.png" : "baptism-story.mp4";
      const f = new File([blob], name, { type: blob.type || asset.mimeType });
      setFile({ file: f, url: URL.createObjectURL(f) });
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  const share = async () => {
    if (!file) return;
    const files = [file.file];
    if (!navigator.canShare?.({ files })) {
      setShareNote(t.share.shareUnavailable);
      return;
    }
    try {
      await navigator.share(message.trim() ? { files, text: message } : { files });
    } catch (err) {
      // Some targets reject a file and text together; offer the file alone and keep the message to paste.
      if (err instanceof Error && err.name !== "AbortError" && message.trim()) {
        await navigator.share({ files }).catch(() => undefined);
      }
    }
    // Closing the share sheet is not evidence of delivery or a post (plan section 3).
    setShareNote(t.share.shareClosed);
  };

  const sendToInbox = async () => {
    setBusy(true);
    setError(null);
    try {
      let next = state;
      if (!next.consents.some((c) => c.purpose === "baptize-review" && c.decision === "granted")) {
        next = await api.approve({ assetId: asset.id, assetVersion: asset.version, purpose: "baptize-review", decision: "granted" });
      }
      if (next.submitDecision.ok) {
        let key = idempotency.current.get(asset.version);
        if (!key) {
          key = crypto.randomUUID();
          idempotency.current.set(asset.version, key);
        }
        next = await api.submitToInbox(asset.id, key);
      }
      update({ asset: next });
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  const withdraw = async (id: string) => {
    setBusy(true);
    try {
      await api.withdrawSubmission(id);
      update({ asset: await api.assetState(asset.id) });
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  const submission = state.submissions.find((s) => s.assetVersion === asset.version);
  const inboxConsent = state.consents.find((c) => c.purpose === "baptize-review" && c.decision === "granted");
  const fullText = story.reviewedText;
  const destinations: Array<{ id: Destination; label: string; icon: React.ReactNode }> = [
    { id: "whatsapp", label: t.share.whatsapp, icon: <MessageCircle /> },
    { id: "instagram", label: t.share.instagram, icon: <Camera /> },
    { id: "other", label: t.share.other, icon: <Download /> },
  ];

  return (
    <StepShell title={t.share.title} lead={t.share.lead}>
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-2 font-semibold text-lg">{t.share.intention}</legend>
        <OptionButton title={t.share.feedback} selected={intention === "feedback"} onClick={() => chooseIntention("feedback")} />
        <OptionButton title={t.share.finished} selected={intention === "finished"} onClick={() => chooseIntention("finished")} />
        <OptionButton title={t.share.keepCopy} selected={intention === "keep"} onClick={() => chooseIntention("keep")} />
      </fieldset>

      {intention !== "keep" && (
        <div className="flex flex-col gap-2">
          <label htmlFor="message" className="font-semibold">
            {t.share.message}
          </label>
          <p id="message-hint" className="text-sm text-muted-foreground">
            {t.share.messageHint}
          </p>
          <Textarea
            id="message"
            aria-describedby="message-hint"
            className="text-base md:text-base"
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              setMessageEdited(true);
            }}
          />
          <div className="flex flex-wrap gap-3">
            <CopyButton text={message} label={t.share.copyMessage} />
            <CopyButton text={fullText} label={t.share.copyStory} />
          </div>
        </div>
      )}

      {!file ? (
        <Button className={`${bigButton} sm:w-fit`} onClick={prepare} disabled={busy}>
          {busy ? t.share.preparing : t.share.prepare}
        </Button>
      ) : (
        <div className="flex flex-col gap-4">
          {intention !== "keep" && (
            <div className="grid grid-cols-3 gap-2" role="group" aria-label={t.share.intention}>
              {destinations.map((d) => (
                <Button
                  key={d.id}
                  variant={destination === d.id ? "default" : "outline"}
                  aria-pressed={destination === d.id}
                  className="h-auto min-h-11 flex-col gap-1 whitespace-normal py-2 text-sm"
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
          )}

          <p className="text-sm text-muted-foreground">{t.share.handoffNote}</p>
          {destination === "instagram" && (
            <h2 className="font-semibold text-lg">{asset.spec.kind === "card" ? t.share.instagramPost : t.share.instagramReel}</h2>
          )}
          <div className="flex flex-wrap gap-3">
            {intention !== "keep" && (
              <Button className={bigButton} onClick={share}>
                <Share2 aria-hidden /> {t.share.shareButton}
              </Button>
            )}
            <a href={file.url} download={file.file.name} className={`inline-flex items-center gap-2 rounded-lg border border-border bg-background font-medium hover:bg-muted ${bigButton}`}>
              <Download className="size-4" aria-hidden /> {t.share.save}
            </a>
          </div>
          {shareNote && (
            <p aria-live="polite" className="rounded-lg bg-secondary p-3 text-sm">
              {shareNote}
            </p>
          )}

          {destination === "whatsapp" && intention !== "keep" && (
            <ol className="flex list-decimal flex-col gap-1 pl-5">
              {t.share.whatsappSteps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
          )}
          {destination === "instagram" && intention !== "keep" && (
            <>
              <ol className="flex list-decimal flex-col gap-1 pl-5">
                {t.share.instagramSteps.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ol>
              <Alert>
                <AlertDescription>{t.share.instagramAudience}</AlertDescription>
              </Alert>
            </>
          )}
          <details className="rounded-lg border bg-card p-3 text-sm">
            <summary className="cursor-pointer font-medium">{t.share.findFile}</summary>
            <p className="mt-2">{t.share.findFileBody}</p>
          </details>
        </div>
      )}
      {error && <ErrorNote message={error} />}

      <p className="font-heading text-xl">{t.share.relational}</p>

      <section aria-labelledby="inbox-title" className="flex flex-col gap-3 rounded-xl border border-dashed bg-card p-4">
        <h2 id="inbox-title" className="flex items-center gap-2 font-semibold text-lg">
          <Inbox className="size-5" aria-hidden /> {t.share.inboxTitle}
        </h2>
        <p className="text-sm text-muted-foreground">{t.share.inboxBody}</p>
        {submission ? (
          <div className="flex flex-col gap-3">
            <h3 className="font-semibold">{t.share.receiptTitle}</h3>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
              <dt className="text-muted-foreground">{t.share.receiptTo}</dt>
              <dd>{t.share.receiptToValue}</dd>
              <dt className="text-muted-foreground">{t.share.receiptScope}</dt>
              <dd>{t.share.receiptScopeValue}</dd>
              <dt className="text-muted-foreground">{t.share.receiptVersion}</dt>
              <dd>{submission.assetVersion}</dd>
              <dt className="text-muted-foreground">{t.share.receiptTime}</dt>
              <dd>{new Date(submission.createdAt).toLocaleString(LANGUAGES[flow.story!.interfaceLanguage].uiLocale)}</dd>
              {state.needsGuardian && (
                <>
                  <dt className="text-muted-foreground">{t.share.receiptGuardian}</dt>
                  <dd>{t.share.receiptGuardianValue}</dd>
                </>
              )}
              <dt className="text-muted-foreground">{t.share.receiptState}</dt>
              <dd>{submission.state === "pending" ? t.share.pending : t.share.withdrawn}</dd>
            </dl>
            {submission.state === "pending" && (
              <>
                <Button variant="outline" className={`${bigButton} w-fit`} onClick={() => withdraw(submission.id)} disabled={busy}>
                  {t.share.withdraw}
                </Button>
                <p className="text-sm text-muted-foreground">{t.share.withdrawNote}</p>
              </>
            )}
          </div>
        ) : (
          <>
            <label className="flex cursor-pointer items-start gap-3">
              <Checkbox className="mt-1" checked={inboxChecked} onCheckedChange={(c) => setInboxChecked(c === true)} />
              <span>{t.share.inboxCheck}</span>
            </label>
            {state.needsGuardian && inboxConsent && !state.submitDecision.ok && (
              <>
                <p className="text-sm">{t.share.inboxNeedsGuardian}</p>
                <GuardianAssetPanel state={state} purposes={["baptize-review"]} />
              </>
            )}
            <Button className={`${bigButton} w-fit`} onClick={sendToInbox} disabled={!inboxChecked || busy || (Boolean(inboxConsent) && !state.submitDecision.ok)}>
              {t.share.inboxSend}
            </Button>
          </>
        )}
      </section>

      <div className="flex flex-col gap-3 border-t pt-6 sm:flex-row sm:justify-between">
        <DeleteStory />
        <Button variant="outline" className={bigButton} onClick={() => reset("welcome")}>
          {t.common.newStory}
        </Button>
      </div>
    </StepShell>
  );
}
