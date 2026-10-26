# Share your story

Help someone tell their baptism story or testimony in their own words, turn it into a card or short video, and download it to share however they choose.

**Built to keep nothing.** There are no accounts. A story lives only in the server's working memory and temporary files while the person makes it, and it is deleted, with every recording, transcript and output, the moment the finished file is downloaded. If that doesn't happen, it's deleted when the person taps "Delete my story", or at the latest 2 hours after they started. Nothing leaves the app without the storyteller's approval of that exact version. The service is for adults 18 and older. The original plan and reasoning are in [testimony-project-plan.md](testimony-project-plan.md).

## Quick start (macOS or Windows)

Requirements: **Node.js 20.9 or newer** (22 LTS recommended, see `.nvmrc`). Nothing else: FFmpeg comes from the `ffmpeg-static` npm package, which downloads the right binary for your OS during `npm install`. On a machine it doesn't cover (for example Windows on ARM), install FFmpeg yourself and set `FFMPEG_PATH`.

```bash
npm install
cp .env.example .env.local      # Windows PowerShell: Copy-Item .env.example .env.local
npm run dev
```

Open http://localhost:3000, then check http://localhost:3000/api/health. It should report `"ffmpeg": { "ok": true }` and the provider you set.

| Script | What it does |
|---|---|
| `npm run dev` | Dev server on localhost |
| `npm run dev:lan` | Dev server on all interfaces with a self-signed HTTPS cert (for phones on the same Wi-Fi) |
| `npm run build` then `npm run start` | Production build. It refuses to start without the production settings below |
| `npm test` | Unit tests, plus real FFmpeg renders of a card and two videos |
| `npm run smoke` | End-to-end permission and deletion checks against a running dev server in mock mode (`LANGUAGE_PROVIDER=mock npm run dev` first) |
| `npm run typecheck` / `npm run lint` | Static checks |

All scripts are plain `next`/`vitest`/`node` commands with no shell-specific syntax, so they run the same way in macOS Terminal, Windows PowerShell and cmd.

### Pages

| Page | What it is |
|---|---|
| `/` | The storyteller's flow, in English, French, Latin American Spanish or Brazilian Portuguese. Starts by choosing a baptism story or a testimony |
| `/baptism` · `/testimony` | Direct links (for a church or event QR code) that start on one path; Back still leads to the choice |
| `/privacy` · `/terms` | The Privacy Policy and Terms of Use in all four languages (English controls), linked from every page's footer and from the age question |

### Testing on phones

Phone browsers only allow microphone recording on **HTTPS** pages. Use a deployed HTTPS environment, or `npm run dev:lan`, whose self-signed certificate phones ask you to accept. On Windows, allow Node through the firewall when prompted.

## Language provider

`LANGUAGE_PROVIDER=gcp` uses Google Cloud Speech-to-Text, Translation and Text-to-Speech:

1. In a Google Cloud project with billing enabled, enable **Cloud Speech-to-Text API**, **Cloud Translation API** and **Cloud Text-to-Speech API**.
2. Create an **API key** (APIs & Services → Credentials) and restrict it to those three APIs.
3. Create a **budget alert** (Billing → Budgets). Alerts notify but don't stop spending. As a second safety net, the app keeps a per-process usage cap (`src/lib/server/usage.ts`; override with `USAGE_CAP_*` env vars).
4. Set `LANGUAGE_PROVIDER=gcp` and `GOOGLE_API_KEY=...` in `.env.local`, then restart.

If `gcp` is selected without a key, requests fail with a clear error. The app never silently falls back to mock results.

`LANGUAGE_PROVIDER=mock` (the default when unset) is for development and the smoke test only. It makes no network calls and returns visibly labeled results: an example transcript, `[mock pt]` translations and a quiet tone for narration. A production server refuses to run in mock mode.

## Privacy by design

What the app does, and what the Privacy Policy promises (the policy states the same limits the code enforces; a test checks they match):

- **No storage.** Stories, consents and file records are in memory only ([`store.ts`](src/lib/server/store.ts)); media are temporary files ([`temp-store.ts`](src/lib/server/temp-store.ts)). There is no database, no backup and no admin view. A restart deletes everything, and a new process clears any leftover temp files before storing one.
- **Deleted on download.** `POST /api/export` hands over the approved file and deletes the story with everything made from it. The browser keeps the file for sharing and saving, and the share screen says the server copy is gone.
- **Deletion backstop.** Media expire after 1 hour, stories after 2 hours (`STORY_TTL_MS` in [`limits.ts`](src/lib/domain/limits.ts)), and the session cookie after 2 hours.
- **Adults only.** "No, I'm under 18" creates nothing and sends nothing. The server refuses any other answer, and every content and export route checks it.
- **Google only when allowed.** Transcription, translation and synthetic voice each need the one-per-story consent; typing, "No voice" and the story's own language need none. Face detection runs on the device; the server receives only the box to blur. No voiceprints or face templates are made.
- **No tracking.** One essential session cookie. No analytics, ads or third-party scripts.

## Going to production

The production server **refuses to start** ([`src/instrumentation.ts`](src/instrumentation.ts)) unless all of these are set:

| Setting | Why |
|---|---|
| `LANGUAGE_PROVIDER=gcp` and `GOOGLE_API_KEY` | No placeholder results for real people |
| `LEGAL_OPERATOR_NAME`, `LEGAL_CONTACT_EMAIL`, `LEGAL_MAILING_ADDRESS`, `LEGAL_GOVERNING_STATE` | The operator the Terms of Use and Privacy Policy name. Set in the environment, never in code |

Deploying on Google Cloud Run, which the policy describes:

- **Region:** a US region. The policy says the service runs on Google Cloud servers in the United States.
- **One instance per story:** stories live in one instance's memory, so turn on **session affinity** (or cap the service at one instance) rather than adding shared storage.
- **Logs:** keep Cloud Logging retention at 30 days or less, since the policy says request logs are kept up to 30 days. Never log story text.
- **Speech-to-Text data logging:** leave it off (it's opt-in).
- **Secrets:** keep the API key in Secret Manager.

Before launch, have a lawyer review [the notices](src/lib/legal) and have native speakers review the translations. When the notices' wording changes, bump `TERMS_VERSION`, `PRIVACY_VERSION` and `LEGAL_EFFECTIVE_DATE` in [`versions.ts`](src/lib/legal/versions.ts).

## What's built

The storyteller's flow, end to end:

1. **Entry:** interface language by name (no flags). The first tap chooses the path, **My baptism story** or **My testimony**. The path sets the guiding questions (a testimony asks what you were like before knowing Christ, what happened to make you change, and what has changed since), the label on cards and plain-background videos ("MY TESTIMONY" in four languages) and the export filename.
2. **Age and notices:** "Are you 18 or older?" with a plain note on how the story is used and deleted, and links to the Terms and Privacy Policy. Only "Yes" starts a story.
3. **What gets shared:** each format, and each voice choice, carries a one-line note of exactly what it shares ("Shares your face, voice and surroundings…", "No face or voice"), with one line on names and identifying details.
4. **Capture:** type with three optional prompts or "my own way"; record your voice or **film yourself** (camera on to frame, then record; MediaRecorder with detected MIME type, 60-second hard stop, retry, playback); or upload an audio or video file. Story language is separate from interface language, with regional transcription accents (es-MX, es-PE, fr-CA…).
5. **Cloud consent:** one notice per story, shown the first time anything would leave the device. It names the service and lists each use (transcription; translation and synthetic voice only if picked), how long the app keeps a recording, and alternatives. The server refuses requests without it.
6. **Check the words (recordings):** listen back (or watch, for video), edit each sentence, uncertain words highlighted, the identifying-details helper and the optional name. After filming, it goes straight to the preview as *Video of me*.
7. **Story review:** edit text, optional display name, and flags for possible names, places, dates and family members. These are an aid, and the text is never edited automatically.
8. **Formats:** **Option B** *Video of me*: the person's own camera video (720×1280 MP4) with burned-in captions, fitted into 9:16 and padded rather than cropped, with an optional **face cover**. **Option A** story card (1080×1350 PNG). **Option C** narrated video over a plain background with *my recorded voice*, *a synthetic voice* or *no voice*. The path's label is on the card and the plain-background video, never on the person's own video.
9. **Script reader:** the approved text in large adjustable blocks, record/retry/playback, then the take is transcribed and reviewed so captions follow what was actually said.
10. **Preview and approval:** the preview renders by itself and sits at the top with **Approve and continue** right under it. The approval says that continuing hands over the file and deletes the server copy. Any change makes a new version that needs approval again.
11. **Share:** the file is handed over and the story deleted on arrival; the screen confirms it. WhatsApp and Instagram guided handoff with native share where supported, and save to device. It never claims anything was sent or posted.
12. **Delete my story** (before download) removes everything the app holds for it at once.

| Area | Files |
|---|---|
| Shared contract: Story, NarrationTake, RenderSpec, Asset, Consent | [`src/lib/domain/types.ts`](src/lib/domain/types.ts) |
| `authorize()`: the single export check (adults only, exact version, stale story) and `captureAllowed()` | [`src/lib/domain/policy.ts`](src/lib/domain/policy.ts) |
| Word-timed captions ([`timing.ts`](src/lib/domain/timing.ts)), sentence offsets, identifying-detail flags, burned-in labels in four languages | [`src/lib/domain/`](src/lib/domain) |
| Card and video layouts as ASS documents (libass does wrapping with the bundled fonts) | [`src/lib/render/ass.ts`](src/lib/render/ass.ts) |
| FFmpeg renderers and the server-side composer (builds the RenderSpec from the stored story, never from client-sent captions) | [`src/lib/server/render.ts`](src/lib/server/render.ts), [`src/lib/server/compose.ts`](src/lib/server/compose.ts) |
| In-memory working store, ownership guards, temporary media | [`store.ts`](src/lib/server/store.ts), [`guards.ts`](src/lib/server/guards.ts), [`temp-store.ts`](src/lib/server/temp-store.ts) |
| Terms of Use and Privacy Policy in four languages, operator settings, production checks | [`src/lib/legal/`](src/lib/legal), [`production-checks.ts`](src/lib/server/production-checks.ts) |
| Provider interface, mock and Google Cloud adapters | [`src/lib/providers/`](src/lib/providers) |
| UI flow, recorder, consent panel, legal pages | [`src/components/`](src/components) |
| Interface strings: en, fr (Canada), es-419, pt-BR. Drafts pending native-speaker review | [`src/i18n/`](src/i18n) |
| Made-up stories used only by unit tests and mock transcription, never shown to storytellers | [`src/fixtures/stories.ts`](src/fixtures/stories.ts) |

### API

All routes are session-owned (anonymous `sid` cookie). Another session gets `404`. Errors carry a `code` the UI translates.

| Route | Purpose |
|---|---|
| `GET`/`POST /api/stories` · `GET`/`PATCH`/`DELETE /api/stories/:id` | List this session's unfinished stories (so a reload can continue or delete them); create after the path (`storyType`) and `ageGate: "adult"`; update text, take, name, language or privacy (content edits bump the version); delete everything |
| `POST /api/transcribe` | multipart `audio` (audio or camera video; only the sound goes to the speech service), `storyId`, `cloudProcessingAccepted`, optional `sttLocale`, `keep` (keep a converted copy ≤ 1 h for narration), `scriptText` (mock only) |
| `POST /api/render` | `storyId`, `kind` (`card`/`narrated-video`/`captioned-video`), `narration`, `outputLanguage`, `span`, `showName`, `showStoryLabel`, `cloud` consents. Returns the asset and its permission state |
| `GET /api/assets/:id` | In-app preview of the exact file (`?state=1` for permission state) |
| `POST /api/approve` | Approval of one exact asset version (`purpose: "personal-output"`) |
| `POST /api/export` | The only way a file leaves the app: checks `authorize()`, returns the file, and deletes the story (`X-Story-Deleted: true`) |
| `POST /api/translate`, `POST /api/synthesize`, `GET`/`DELETE /api/media/:id`, `GET /api/health` | Lower-level helpers, gated by story ownership and the adults-only check. In production, health returns only the provider and FFmpeg status |

## Not yet verified

- **Live microphone recording and file upload through the UI** (including the script reader), in desktop browsers and on iOS Safari and Android Chrome.
- **Native share sheets** (WhatsApp/Instagram targets) on real phones, and the exact Instagram/WhatsApp steps in the current apps.
- **Camera recording on real phones** (the desktop browser pane has no camera). The video path was tested with a generated portrait video carrying real speech, through Google Speech-to-Text.
- **Legal review.** The Terms and Privacy Policy are drafted from what the code does, for a US-only launch; a lawyer needs to review them, and native speakers the translations.

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
- Try the full flow on iPhone and Android over HTTPS; adjust the WhatsApp/Instagram instructions to what the apps actually show.
- Try the face cover on real phone videos (walking, turning, several people) and decide whether its "help, not a guarantee" wording is enough for launch.

## Credits

Next.js, React, shadcn/ui (Base UI), Tailwind CSS, lucide icons, [MediaPipe Tasks Vision](https://ai.google.dev/edge/mediapipe/solutions/vision/face_detector) and its BlazeFace short-range model (Apache 2.0), FFmpeg via [ffmpeg-static](https://github.com/eugeneware/ffmpeg-static) with libass, Vitest. Fonts (SIL Open Font License, in [`assets/fonts`](assets/fonts) with licenses in [`assets/font-licenses`](assets/font-licenses)): [Atkinson Hyperlegible](https://brailleinstitute.org/freefont) by the Braille Institute, and [Literata](https://github.com/googlefonts/literata) by TypeTogether for Google. Test stories are fabricated for this project.
