"use client";

import { useState } from "react";
import { ShieldCheck, ShieldX, UserRound } from "lucide-react";
import { useApp } from "@/components/app-state";
import { ErrorNote } from "@/components/flow/steps-start";
import { bigButton } from "@/components/step-shell";
import { Button } from "@/components/ui/button";
import { api, type AssetState } from "@/lib/client/api";
import type { ConsentPurpose } from "@/lib/domain/types";

/**
 * TEST SCENARIO: a simulated guardian decision for one exact version and
 * purpose. Not verification of who the guardian is (plan section 6).
 */
export function GuardianAssetPanel({ state, purposes }: { state: AssetState; purposes: ConsentPurpose[] }) {
  const { t, update, errorText } = useApp();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rows = state.consents.filter((c) => c.decision === "granted" && purposes.includes(c.purpose));
  if (rows.length === 0) return null;

  const decide = async (purpose: ConsentPurpose, decision: "approved-in-simulation" | "declined") => {
    setBusy(true);
    setError(null);
    try {
      const next = await api.guardianAsset({ assetId: state.asset.id, assetVersion: state.asset.version, purpose, decision });
      update({ asset: next });
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-xl border-2 border-dashed border-primary/50 bg-card p-4">
      <h2 className="flex items-center gap-2 font-semibold">
        <UserRound className="size-5" aria-hidden /> {t.guardian.assetTitle}
      </h2>
      <p className="text-sm text-muted-foreground">{t.guardian.assetBody}</p>
      {rows.map((c) => (
        <div key={c.id} className="flex flex-col gap-2 border-t pt-3">
          <p className="font-medium">
            {c.purpose === "personal-output" ? t.guardian.forPersonal : t.guardian.forInbox}:{" "}
            <span aria-live="polite">
              {c.guardian === "approved-in-simulation"
                ? t.guardian.assetApproved
                : c.guardian === "declined"
                  ? t.guardian.assetDeclined
                  : t.guardian.assetPending}
            </span>
          </p>
          {c.guardian === "pending" && (
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button className={bigButton} onClick={() => decide(c.purpose, "approved-in-simulation")} disabled={busy}>
                <ShieldCheck aria-hidden /> {t.guardian.approve}
              </Button>
              <Button variant="outline" className={bigButton} onClick={() => decide(c.purpose, "declined")} disabled={busy}>
                <ShieldX aria-hidden /> {t.guardian.decline}
              </Button>
            </div>
          )}
        </div>
      ))}
      {error && <ErrorNote message={error} />}
    </div>
  );
}
