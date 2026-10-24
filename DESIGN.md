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
| `--accent` | `#FBF0D2` | Sand notices that aren't errors |
| `--input` | `#6F8E93` | Control borders (3.5:1) |
| `--ring` | `#1C8693` | Focus: a 2px ring with a 2px offset so it shows on gold, teal and white |
| `--destructive` | `#B42318` | Errors and delete |

## Rules

- **One gold button per moment.** Gold follows the next step: "Make preview", then "Approve this version", then "Continue to sharing". Everything else is outline or ghost. Optional paths, such as the demo inbox, are never gold.
- **Teal means selected.** Selected options, checked rows (`checkRow` in [step-shell.tsx](src/components/step-shell.tsx)), chosen sentences and the chosen share destination all use teal border plus `--secondary` tint, or solid teal for compact toggles.
- **No cream, gradients, glass, glows or side-stripe borders.**
- **The result before the settings.** On the preview, the rendered file and "Approve and continue" come first; choices that change it sit below under "Change the details". Nothing needs a separate "make" or "update" button: the preview follows the choices.
- **One tap per decision.** No checkbox in front of a button that already states the decision. Consent is one notice per story; approval is one button that also moves on.
- **Helpers stay compact until needed.** The face-cover editor collapses to one line when the cover was placed automatically and nothing was missed, and opens itself when a face was missed or not found.

## Type

- **Atkinson Hyperlegible** (Regular and Bold) is the app's voice: headings in Bold with slight negative tracking, UI and body in Regular at 17px. It was designed for low-vision readability.
- **Literata** is reserved for the storyteller's own words: the review textarea, the passage chooser, the script reader, and the quote on exported cards. The app never speaks in Literata, so the person's words always look like theirs.
- Paragraphs use `text-wrap: pretty`; headings use `balance`.
- Fonts are bundled in [assets/fonts](assets/fonts) (OFL licenses in [assets/font-licenses](assets/font-licenses)), so FFmpeg renders identically on macOS and Windows.

## Signature: the waterline

- **In the app** ([waterline.tsx](src/components/waterline.tsx)): progress through the four stages is a teal wave up to the current stage and a still dashed line beyond it. When a stage completes, the water advances once (700ms ease-out); with reduced motion it doesn't animate. On phones only the current stage is named ("2/4 · …").
- **On exports**: gold waves drawn with libass vector shapes, one at the top under the label and one at the bottom. On cards, the storyteller's words rest just above the lower waterline, with the name and notes below it, so the open space between the two waves reads as sky. On the plain-background video, the captions sit between the two waves. The person's own video has none.

**Video of me** (the person's own footage) keeps the face and room as the subject: labels and captions sit on 82%-opaque teal boxes for legibility over any picture, captions above the bottom strip where sharing apps draw controls, and no waterline over the footage. Footage is fitted and padded in teal, never cropped.

Motion is limited to state changes. There's no decorative or looping animation.

## Checks

- `npx impeccable detect --viewport 390x844 http://localhost:3000` and the same at 1280x800 should report no findings. They reported none on 2026-10-24.
- Check every new screen at 375px wide, with one gold action visible at a time.
