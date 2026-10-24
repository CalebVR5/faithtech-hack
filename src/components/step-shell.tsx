"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { ArrowLeft, Eye } from "lucide-react";
import { cn } from "cn";
import { useApp } from "@/components/app-state";
import { Button } from "@/components/ui/button";

/** One screen of the flow. Moves focus to the heading so screen readers announce each step. */
export function StepShell({
  title,
  lead,
  children,
  actions,
  showBack = true,
}: {
  title: string;
  lead?: ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
  showBack?: boolean;
}) {
  const { t, back, flow } = useApp();
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    window.scrollTo({ top: 0 });
    heading.current?.focus({ preventScroll: true });
  }, [title]);

  return (
    <section className="flex flex-col gap-6" aria-labelledby="step-title">
      {showBack && flow.history.length > 0 && (
        <Button variant="ghost" className="-ml-2 h-10 w-fit" onClick={back}>
          <ArrowLeft aria-hidden /> {t.common.back}
        </Button>
      )}
      <div className="flex flex-col gap-3">
        <h1 id="step-title" ref={heading} tabIndex={-1} className="font-heading text-3xl leading-tight font-bold tracking-tight outline-none">
          {title}
        </h1>
        {lead && <div className="text-lg text-muted-foreground">{lead}</div>}
      </div>
      {children}
      {actions && <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">{actions}</div>}
    </section>
  );
}

/** A large, touch-friendly option with a title and an explanation. */
export function OptionButton({
  title,
  body,
  selected,
  badge,
  icon,
  note,
  className,
  ...props
}: {
  title: string;
  body?: ReactNode;
  /** What this choice shares, in one short line. */
  note?: ReactNode;
  selected?: boolean;
  badge?: ReactNode;
  icon?: ReactNode;
} & Omit<React.ComponentProps<"button">, "title">) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        "flex w-full items-start gap-3 rounded-xl border bg-card p-4 text-left transition-colors outline-none",
        "hover:border-primary/60 focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50",
        selected ? "border-primary bg-secondary/60 ring-2 ring-primary/25" : "border-border",
        className,
      )}
      {...props}
    >
      {icon && <span className="mt-0.5 text-primary [&_svg]:size-5">{icon}</span>}
      <span className="flex flex-1 flex-col gap-1">
        <span className="flex flex-wrap items-center gap-2 font-semibold text-base">
          {title}
          {badge}
        </span>
        {body && <span className="text-sm text-muted-foreground">{body}</span>}
        {note && (
          <span className="flex items-start gap-1.5 text-sm font-medium text-primary">
            <Eye className="mt-0.5 size-4 shrink-0" aria-hidden /> {note}
          </span>
        )}
      </span>
    </button>
  );
}

export const bigButton = "h-11 px-5 text-base";

/** A tappable row holding a checkbox and its label; matches a selected OptionButton when checked. */
export const checkRow =
  "flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border bg-card px-4 py-3 transition-colors hover:border-primary/60 has-data-checked:border-primary has-data-checked:bg-secondary/60";
