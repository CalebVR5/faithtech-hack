"use client";

// Riverside's signature: progress through the four stages drawn as a waterline.
// The part already done is a wave in river teal; what's ahead is a still,
// dashed line. When a stage completes, the water moves forward once, and not at
// all for people who prefer reduced motion.

const WAVE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='12' viewBox='0 0 24 12'%3E%3Cpath d='M0 6 Q6 1 12 6 T24 6' fill='none' stroke='black' stroke-width='2.5' stroke-linecap='round'/%3E%3C/svg%3E\")";

export function Waterline({ stage, labels, title }: { stage: number; labels: string[]; title: string }) {
  const filled = ((stage + 1) / labels.length) * 100;
  return (
    <div role="group" aria-label={title} className="mb-8 flex flex-col gap-2">
      <div className="relative h-3" aria-hidden>
        <div
          className="absolute right-0 top-1/2 border-t-2 border-dashed border-input/60 transition-[left] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none"
          style={{ left: `${filled}%` }}
        />
        <div
          className="absolute inset-y-0 left-0 bg-primary transition-[width] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none"
          style={{
            width: `${filled}%`,
            maskImage: WAVE,
            WebkitMaskImage: WAVE,
            maskRepeat: "repeat-x",
            WebkitMaskRepeat: "repeat-x",
            maskSize: "24px 12px",
            WebkitMaskSize: "24px 12px",
          }}
        />
      </div>
      <ol className="flex text-sm sm:grid sm:grid-cols-4 sm:gap-2 sm:text-xs">
        {labels.map((label, i) => (
          <li
            key={label}
            aria-current={i === stage ? "step" : undefined}
            className={
              i === stage
                ? "font-bold text-foreground"
                : `hidden sm:block ${i < stage ? "text-primary" : "text-muted-foreground"}`
            }
          >
            {/* On phones only the current stage is named, with its position. */}
            <span className="sm:hidden">{`${i + 1}/${labels.length} · `}</span>
            {label}
          </li>
        ))}
      </ol>
    </div>
  );
}
