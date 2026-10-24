# Design system: Riverside

Chosen 2026-10-24 to replace the cream-and-slate look. The world is the water of baptism: river, lake or beach. It shows up in four places only: palette, type, density, and one signature move (the waterline). Layout, navigation and controls stay standard, because this is a task flow people use once, on a phone, often emotionally.

## Palette

Tokens live in [src/app/globals.css](src/app/globals.css). Rendered cards and videos use the same values in [src/lib/render/ass.ts](src/lib/render/ass.ts).

| Token | Hex | Role |
|---|---|---|
| `--river` | `#0E4A55` | The shell (header) and the exported card and video ground. White text on it is 9.9:1 |
| `--river-deep` | `#0A3942` | Pressed or hover on teal; header controls |
| `--river-muted` | `#BFE0E3` | Secondary text on teal (7.0:1) |
| `--background` | `#EEF5F5` | Page ground: shallow water, never cream |
| `--card` | `#FFFFFF` | Work surfaces |
| `--foreground` | `#12262B` | Ink |
| `--muted-foreground` | `#4B6469` | Secondary text (5.7:1 on the ground) |
| `--primary` | `#0E4A55` | Selection, icons, links, progress. Teal means "chosen" or "done" |
| `--action` | `#E9B949` | Sand-gold. **Primary action only**, always with ink text (8.6:1). Never as text on white (1.8:1) |
| `--secondary` | `#E2EFEF` | Selected-row tint, quiet panels |
| `--accent` | `#FBF0D2` | Sand notices that aren't errors (the prototype banner) |
| `--input` | `#6F8E93` | Control borders (3.5:1) |
| `--ring` | `#1C8693` | Focus: a 2px ring with a 2px offset so it shows on gold, teal and white |
| `--destructive` | `#B42318` | Errors and delete |

## Rules

- **One gold button per moment.** Gold follows the next step: "Make preview", then "Approve this version", then "Continue to sharing". Everything else is outline or ghost. Optional paths, such as the demo inbox, are never gold.
- **Teal means selected.** Selected options, checked rows (`checkRow` in [step-shell.tsx](src/components/step-shell.tsx)), chosen sentences and the chosen share destination all use teal border plus `--secondary` tint, or solid teal for compact toggles.
- **No cream, gradients, glass, glows or side-stripe borders.**

## Type

- **Atkinson Hyperlegible** (Regular and Bold) is the app's voice: headings in Bold with slight negative tracking, UI and body in Regular at 17px. It was designed for low-vision readability.
- **Literata** is reserved for the storyteller's own words: the review textarea, the passage chooser, the script reader, and the quote on exported cards. The app never speaks in Literata, so the person's words always look like theirs.
- Paragraphs use `text-wrap: pretty`; headings use `balance`.
- Fonts are bundled in [assets/fonts](assets/fonts) (OFL licenses in [assets/font-licenses](assets/font-licenses)), so FFmpeg renders identically on macOS and Windows.

## Signature: the waterline

- **In the app** ([waterline.tsx](src/components/waterline.tsx)): progress through the four stages is a teal wave up to the current stage and a still dashed line beyond it. When a stage completes, the water advances once (700ms ease-out); with reduced motion it doesn't animate. On phones only the current stage is named ("2/4 · …").
- **On exports**: a gold wave drawn with libass vector shapes. On cards, the storyteller's words rest just above the waterline, with name and labels below it, so open space reads as sky rather than a gap. On videos, the waterline sits below the captions.

Motion is limited to state changes. There's no decorative or looping animation.

## Checks

- `npx impeccable detect --viewport 390x844 http://localhost:3000` and the same at 1280x800 should report no findings. They reported none on 2026-10-24.
- Check every new screen at 375px wide, with one gold action visible at a time.
