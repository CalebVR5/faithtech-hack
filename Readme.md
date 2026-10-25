# Note for Baptize the World Compatibility
This application could be easily deployed using Vercel to line up with Baptize the World's tech stack, while still utilizing Google Cloud APIs for translation, text-to-speech, and speech-to-text which are relatively easy to set up, just requiring a fresh google cloud project and a couple quick steps.

# Testimony sharing (FaithTech hackathon prototype)

Help someone tell their baptism story in their own words, prepare something they're comfortable sharing, and choose who receives it.

**Prototype rules:** fabricated stories only, no connection to baptize.org, nothing leaves the app without the storyteller's approval, and minors need guardian approval. The full plan and reasoning are in [testimony-project-plan.md](testimony-project-plan.md).

## Quick start (macOS or Windows)

Requirements: **Node.js 20.9 or newer** (22 LTS recommended, see `.nvmrc`). Nothing else: FFmpeg comes from the `ffmpeg-static` npm package, which downloads the right binary for your OS during `npm install`. On a machine it doesn't cover (for example Windows on ARM), install FFmpeg yourself and set `FFMPEG_PATH`.

```bash
npm install
cp .env.example .env.local      # Windows PowerShell: Copy-Item .env.example .env.local
npm run dev
```

Open http://localhost:3000, then check http://localhost:3000/api/health. It should report `"ffmpeg": { "ok": true }` and `"provider": "mock"`.

| Script | What it does |
|---|---|
| `npm run dev` | Dev server on localhost |
| `npm run dev:lan` | Dev server on all interfaces with a self-signed HTTPS cert (for phones on the same Wi-Fi) |
| `npm run build` then `npm run start:lan` | Production build served to the local network |
| `npm test` | Unit tests, plus real FFmpeg renders of a card and two videos |
| `npm run smoke` | End-to-end permission checks against a running server (start `npm run dev` first) |
| `npm run typecheck` / `npm run lint` | Static checks |

All scripts are plain `next`/`vitest`/`node` commands with no shell-specific syntax, so they run the same way in macOS Terminal, Windows PowerShell and cmd. Verified on Windows 11 with Node 22.11.

### Demo pages

| Page | What it is |
|---|---|
| `/` | The storyteller's flow, in English, French, Latin American Spanish or Brazilian Portuguese. Starts by choosing a baptism story or a testimony |
| `/baptism` · `/testimony` | Direct links (for a church or event QR code) that start on one path; Back still leads to the choice |
| `/privacy` | Short, truthful privacy notice for this test deployment |
| `/inbox` | The operator's demo inbox. Needs `INBOX_PASSCODE` from `.env.local`; if unset, a random passcode is printed in the server console |

The fastest demo: **My baptism story (or My testimony) → Yes, 18 or older → Continue → Use a sample story → pick one → Continue → Story card → Make preview → approve → Continue to sharing**. For the guardian gate, answer "No, I'm under 18" and use the *Simulate* buttons.

### Demoing on phones

Phone browsers only allow microphone recording on **HTTPS** pages. Pick one:

1. **Tunnel (recommended):** run `npm run build && npm run start`, then `cloudflared tunnel --url http://localhost:3000` (Cloudflare's cloudflared works on macOS and Windows). Phones get a trusted HTTPS URL. Traffic passes through Cloudflare; the privacy page says so.
2. **`npm run dev:lan`:** this uses a self-signed certificate that's only trusted on the laptop, so phones show a warning you have to tap through. On Windows, allow Node through the firewall when prompted.

## Language provider: mock first, then Google Cloud

`LANGUAGE_PROVIDER=mock` (the default) returns deterministic results that are visibly labeled, such as a fixture transcript, `[mock pt]` translations and a quiet placeholder tone for narration. It makes no network calls. When someone reads their script aloud in mock mode, the "transcript" repeats the script so the demo stays coherent, and the screen says so.

To switch to Google Cloud's free tier:

1. In a Google Cloud project with billing enabled, enable **Cloud Speech-to-Text API**, **Cloud Translation API** and **Cloud Text-to-Speech API**.
2. Create an **API key** (APIs & Services → Credentials) and restrict it to those three APIs.
3. Create a **budget alert** (Billing → Budgets). Alerts notify but don't stop spending. As a second safety net, the app keeps a per-process usage cap (`src/lib/server/usage.ts`; override with `USAGE_CAP_*` env vars).
4. Set `LANGUAGE_PROVIDER=gcp` and `GOOGLE_API_KEY=...` in `.env.local`, then restart.

If `gcp` is selected without a key, requests fail with a clear error. The app never silently falls back to mock results.

**Spike checklist (first hour):** confirm each locale and voice in [`src/lib/domain/languages.ts`](src/lib/domain/languages.ts) exists. Confirm word timestamps come back for en-US, fr-CA, es-US/es-MX/es-PE and pt-BR. Confirm SSML mark timepoints work for the chosen Standard voices (caption timing depends on it). Check the current free-tier limits on Google's pricing pages.

## What's built

The storyteller's flow (plan section 3), end to end:

1. **Entry:** interface language by name (no flags). The first tap chooses the path, **My baptism story** or **My testimony**, then the age question starts the story. The path sets the guiding questions (a testimony asks what you were like before knowing Christ, what happened to make you change, and what has changed since), the sample stories, the label on cards and plain-background videos ("MY TESTIMONY" in four languages) and the export filename.
2. **Guardian gate:** under-18 and not-sure stories can't be written, recorded, rendered, exported or submitted until a *simulated* guardian approves. The server enforces this on every content route, not just the UI. A decline is final for that story.
3. **What gets shared:** no separate privacy screen. Each format, and each voice choice, carries a one-line note of exactly what it shares ("Shares your face, voice and surroundings…", "No face or voice"), with one line on names and identifying details.
4. **Capture:** type with three optional prompts or "my own way"; record your voice or **film yourself** (camera on to frame, then record; MediaRecorder with detected MIME type, 60-second hard stop, retry, playback); upload an audio or video file; or load a fabricated sample. Story language is separate from interface language, with regional transcription accents (es-MX, es-PE, fr-CA…).
5. **Cloud consent:** one notice per story, shown the first time anything would leave the device. It names the service and lists each use (transcription; translation and synthetic voice only if picked), retention and alternatives. A first camera video also explains that the app keeps the video for up to an hour. The server refuses requests without it.
6. **Check the words (recordings):** one screen: listen back (or watch, for video), edit each sentence, uncertain words highlighted, the identifying-details helper and the optional name. After filming, it goes straight to the preview as *Video of me*.
7. **Story review:** edit text, optional display name, and flags for possible names, places, dates and family members. These are an aid, and the text is never edited automatically.
8. **Formats:** **Option B** *Video of me*: the person's own camera video (720×1280 MP4) with burned-in captions, fitted into 9:16 and padded rather than cropped, with an optional **face cover**. **Option A** story card (1080×1350 PNG). **Option C** narrated video over a plain background with *my recorded voice*, *a synthetic voice* or *no voice*. The "My baptism story" label is on the card and the plain-background video, never on the person's own video.
9. **Script reader:** the approved text in large adjustable blocks, record/retry/playback, then the take is transcribed and reviewed so captions follow what was actually said.
10. **Preview and approval:** the preview renders by itself (and again shortly after any change) and sits at the top with **Approve and continue** right under it; one tap approves that exact file and moves to sharing. Below: the passage (a long card starts with none selected), on-screen language (machine translation is labeled), face cover and name. Any change makes a new version that needs approval again.
11. **Share:** feedback / finished / keep-a-copy intentions, an editable accompanying message kept separate from the story, WhatsApp and Instagram guided handoff with native share where supported, download, copy text, and "can't find the file?" help. It never claims anything was sent or posted.
12. **Demo inbox:** a separate, unchecked opt-in (review only, not publication) with its own consent and, for minors, its own guardian decision. Shows a permission receipt with a withdraw button. Repeated clicks make one submission.
13. **Delete my story** (on the preview, share and guardian-declined screens) removes everything the app holds for it: records, recordings, renders and any inbox copy.

| Area | Files |
|---|---|
| Shared contract: Story, NarrationTake, RenderSpec, Asset, Consent, MockSubmission | [`src/lib/domain/types.ts`](src/lib/domain/types.ts) |
| `authorize()`: the single export/submission check (exact version, stale story, guardian, separate inbox consent) and `captureAllowed()` | [`src/lib/domain/policy.ts`](src/lib/domain/policy.ts) |
| Word-timed captions ([`timing.ts`](src/lib/domain/timing.ts)), sentence offsets, identifying-detail flags, burned-in labels in four languages | [`src/lib/domain/`](src/lib/domain) |
| Card and video layouts as ASS documents (libass does wrapping with the bundled fonts) | [`src/lib/render/ass.ts`](src/lib/render/ass.ts) |
| FFmpeg renderers and the server-side composer (builds the RenderSpec from the stored story, never from client-sent captions) | [`src/lib/server/render.ts`](src/lib/server/render.ts), [`src/lib/server/compose.ts`](src/lib/server/compose.ts) |
| In-memory story/asset/consent/inbox store, ownership guards | [`src/lib/server/store.ts`](src/lib/server/store.ts), [`src/lib/server/guards.ts`](src/lib/server/guards.ts) |
| Provider interface, mock and Google Cloud adapters | [`src/lib/providers/`](src/lib/providers) |
| Session-owned, expiring temp media store | [`src/lib/server/temp-store.ts`](src/lib/server/temp-store.ts) |
| UI flow, recorder, consent panel | [`src/components/`](src/components) |
| Interface strings: en, fr (Canada), es-419, pt-BR. Drafts, labeled in the UI as unreviewed | [`src/i18n/`](src/i18n) |
| Made-up samples for each path. Baptism: the hackathon's three, verbatim (A long and rambling, B very short, C Spanish voice note). Testimony: T1 before/how/after (English), T2 raised in church (French), T3 voice note (Portuguese), T4 a family member (Spanish). Mock transcription returns a sample from the story's own path and language, or a labeled placeholder | [`src/fixtures/stories.ts`](src/fixtures/stories.ts) |

### API

All routes are session-owned (anonymous `sid` cookie). Another session gets `404`. Errors carry a `code` the UI translates.

| Route | Purpose |
|---|---|
| `GET`/`POST /api/stories` · `GET`/`PATCH`/`DELETE /api/stories/:id` | List this session's stories (so a reload or "Start a new story" can continue or delete them); create after the path (`storyType`: `baptism`/`testimony`) and age question; update text, take, name, language or privacy (content edits bump the version); delete everything |
| `POST /api/stories/:id/guardian` | **Test scenario:** simulated guardian decision that unlocks capture |
| `POST /api/transcribe` | multipart `audio` (audio or camera video; only the sound goes to the speech service), `storyId`, `cloudProcessingAccepted`, optional `sttLocale`, `keep` (keep a converted copy ≤ 1 h for narration), `scriptText` (mock only) |
| `POST /api/render` | `storyId`, `kind` (`card`/`narrated-video`/`captioned-video`), `narration`, `outputLanguage`, `span`, `showName`, `showStoryLabel`, `cloud` consents. Returns the asset and its permission state |
| `GET /api/assets/:id` | In-app preview of the exact file (`?state=1` for permission state) |
| `POST /api/approve` | Consent for one asset version and purpose (`personal-output` or `baptize-review`) |
| `POST /api/guardian-simulation` | **Test scenario:** guardian decision for one asset version and purpose |
| `POST /api/export` | The only way a file leaves the app; calls `authorize("export")` |
| `POST /api/mock-submissions` · `DELETE /api/mock-submissions/:id` | Idempotent demo-inbox submission (calls `authorize("submit-mock-inbox")`); withdraw |
| `GET`/`POST`/`DELETE /api/inbox` · `GET /api/inbox/:id` | Operator inbox behind a passcode |
| `POST /api/translate`, `POST /api/synthesize`, `GET`/`DELETE /api/media/:id`, `GET /api/health` | Lower-level helpers from the scaffold, now also gated by story ownership and the age gate |

## Fixed while getting it running on Windows

- **`npm test` didn't start** on Node 22.11 (`ERR_REQUIRE_ESM`): Vite 7 is ESM-only and the config was loaded as CommonJS. The config is now `vitest.config.mts`.
- **`toFilterPath()` escaped only one of FFmpeg's two filter-string levels,** so a Windows drive colon still split the option (`Unable to parse option value … as image size`). It now quotes the value correctly. A test renders through a temp path containing a colon, a space and an apostrophe.

## Not yet verified

- **Live microphone recording and file upload through the UI** (including the script reader), in desktop browsers and on iOS Safari and Android Chrome. The recorder, MIME detection and upload checks are built and the server side is tested with generated audio, but no one has recorded or uploaded through the UI yet.
- **Native share sheets** (WhatsApp/Instagram targets) on real phones, and the exact Instagram/WhatsApp steps in the current apps.
- **Camera recording on real phones** (the desktop browser pane has no camera). The video path was tested with a generated portrait video carrying real speech, through Google Speech-to-Text.
- **Interface translations** are drafts. Consent and privacy wording in all four languages needs native-speaker and legal review before any real-data use.

## Face cover (Option B)

- **On the person's device:** MediaPipe's face detector ([`@mediapipe/tasks-vision`](https://www.npmjs.com/package/@mediapipe/tasks-vision), BlazeFace short-range model in [`assets/models`](assets/models)) runs in the browser. This app serves the runtime and model itself from `/api/vision/*`, so no video goes anywhere to find the face and nothing is fetched from a CDN.
- **One conservative cover:** the whole clip is sampled about 4 times a second; the cover is the union of every detected face position, padded for hair, chin and movement. The person can drag, resize (or use Bigger/Smaller and the arrow keys). Moments where a detected face falls outside the cover are listed ("0:12"), as are moments with more than one face. If no face is found, the person places the cover by hand.
- **In the export:** FFmpeg blurs that region of every source frame before scaling, padding and captions (a blur, not pixelation, so the region is never shrunk by rounding). If a cover is requested and anything fails, there is no fallback to the uncovered video; a malformed cover is refused.
- **Honest limits:** the screen says it plainly: covering the face helps but isn't a guarantee; voice, body, clothes and surroundings still show, and the person should watch the whole video before approving.

## How captions stay in sync

Every caption is built from **words with their own times in the audio actually used**, in [`src/lib/domain/timing.ts`](src/lib/domain/timing.ts):

- **Synthetic voice:** Google Text-to-Speech returns a timing mark for every word (long stories are synthesized in sentence batches under Google's 5,000-byte limit and joined).
- **Your recorded voice or video:** Speech-to-Text word times drift by a word or a few hundred milliseconds. The server finds the recording's real pauses (FFmpeg `silencedetect`, threshold relative to the recording's own loudness), snaps each pause to the nearest punctuated word boundary, and spreads the words between pauses over the time actually spoken. The author's corrected transcript is then aligned word by word to those times, so edits keep their timing.
- **Slides are whole thoughts:** a slide never crosses a sentence boundary. Long sentences split at a comma, a pause or a conjunction ("and", "pero", "mais", "mas"…) before a plain word break; two very short sentences may share a slide. Each slide appears 120 ms before its first word and stays until the next begins (or briefly after its last word).
- **Translated captions** translate each slide as a unit and keep its timing.

Checked on 2026-10-24 against real Google audio: synthetic-voice slides start within about 10–90 ms of the sound (measured with FFmpeg's silence detector), and recorded slides that follow a pause start within 10 ms of the speaker resuming.

## Next steps

- Film a real take per language on phones and check caption timing by eye, especially Peruvian Spanish (it uses the older transcription model).
- Try the full flow on the team's iPhone and Android phones through the tunnel; adjust the WhatsApp/Instagram instructions to what the apps actually show.
- Try the face cover on real phone videos (walking, turning, several people) and decide whether its "help, not a guarantee" wording is enough for the pilot.

## Credits

Next.js, React, shadcn/ui (Base UI), Tailwind CSS, lucide icons, [MediaPipe Tasks Vision](https://ai.google.dev/edge/mediapipe/solutions/vision/face_detector) and its BlazeFace short-range model (Apache 2.0), FFmpeg via [ffmpeg-static](https://github.com/eugeneware/ffmpeg-static) with libass, Vitest. Fonts (SIL Open Font License, in [`assets/fonts`](assets/fonts) with licenses in [`assets/font-licenses`](assets/font-licenses)): [Atkinson Hyperlegible](https://brailleinstitute.org/freefont) by the Braille Institute, and [Literata](https://github.com/googlefonts/literata) by TypeTogether for Google. Story fixtures are fabricated for this project.
