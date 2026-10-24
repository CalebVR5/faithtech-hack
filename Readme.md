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
| `/` | The storyteller's flow, in English, French, Latin American Spanish or Brazilian Portuguese |
| `/privacy` | Short, truthful privacy notice for this test deployment |
| `/inbox` | The operator's demo inbox. Needs `INBOX_PASSCODE` from `.env.local`; if unset, a random passcode is printed in the server console |

The fastest demo: **Start → Yes, 18 or older → Continue → Use a sample story → pick one → Continue → Story card → Make preview → approve → Continue to sharing**. For the guardian gate, answer "No, I'm under 18" and use the *Simulate* buttons.

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

1. **Entry:** prototype notice, interface language by name (no flags), age question with "I'm not sure".
2. **Guardian gate:** under-18 and not-sure stories can't be written, recorded, rendered, exported or submitted until a *simulated* guardian approves. The server enforces this on every content route, not just the UI. A decline is final for that story.
3. **Privacy guide:** face / voice / name / surroundings / not sure. Recommends formats and explains conflicts; never switches to a more revealing option by itself.
4. **Capture:** type with three optional prompts or "my own way"; record (MediaRecorder, detected MIME type, 60-second hard stop, retry, playback); upload an audio file; or load a fabricated sample. Story language is separate from interface language, with regional transcription accents (es-MX, es-PE, fr-CA…).
5. **Cloud consent** before any transcription, translation or synthetic voice: names the service, what's sent, why, retention and alternatives. The server refuses requests without it.
6. **Transcript correction:** listen back, edit each timed part, uncertain words highlighted and must be checked, warning when edits drift far from the recording.
7. **Story review:** edit text, optional display name, and flags for possible names, places, dates and family members. These are an aid, and the text is never edited automatically.
8. **Formats:** **Option A** story card (1080×1350 PNG) and **Option C** narrated video (720×1280 MP4) with *my recorded voice*, *a synthetic voice* or *no voice*. Captioned camera footage (Option B) and face blur are listed as "not in this prototype".
9. **Script reader:** the approved text in large adjustable blocks, record/retry/playback, then the take is transcribed and reviewed so captions follow what was actually said.
10. **Preview and approval:** pick one contiguous passage by sentence, choose the on-screen language (machine translation is labeled), show or hide name and label, render the **actual export file**, see "What will be included", and approve that exact version. Any change makes a new version that needs approval again.
11. **Share:** feedback / finished / keep-a-copy intentions, an editable accompanying message kept separate from the story, WhatsApp and Instagram guided handoff with native share where supported, download, copy text, and "can't find the file?" help. It never claims anything was sent or posted.
12. **Demo inbox:** a separate, unchecked opt-in (review only, not publication) with its own consent and, for minors, its own guardian decision. Shows a permission receipt with a withdraw button. Repeated clicks make one submission.
13. **Delete my story** (on the preview, share and guardian-declined screens) removes everything the app holds for it: records, recordings, renders and any inbox copy.

| Area | Files |
|---|---|
| Shared contract: Story, NarrationTake, RenderSpec, Asset, Consent, MockSubmission | [`src/lib/domain/types.ts`](src/lib/domain/types.ts) |
| `authorize()`: the single export/submission check (exact version, stale story, guardian, separate inbox consent) and `captureAllowed()` | [`src/lib/domain/policy.ts`](src/lib/domain/policy.ts) |
| Caption chunking and pacing, sentence offsets, identifying-detail flags, privacy recommendations, burned-in labels in four languages | [`src/lib/domain/`](src/lib/domain) |
| Card and video layouts as ASS documents (libass does wrapping with the bundled fonts) | [`src/lib/render/ass.ts`](src/lib/render/ass.ts) |
| FFmpeg renderers and the server-side composer (builds the RenderSpec from the stored story, never from client-sent captions) | [`src/lib/server/render.ts`](src/lib/server/render.ts), [`src/lib/server/compose.ts`](src/lib/server/compose.ts) |
| In-memory story/asset/consent/inbox store, ownership guards | [`src/lib/server/store.ts`](src/lib/server/store.ts), [`src/lib/server/guards.ts`](src/lib/server/guards.ts) |
| Provider interface, mock and Google Cloud adapters | [`src/lib/providers/`](src/lib/providers) |
| Session-owned, expiring temp media store | [`src/lib/server/temp-store.ts`](src/lib/server/temp-store.ts) |
| UI flow, recorder, consent panel | [`src/components/`](src/components) |
| Interface strings: en, fr (Canada), es-419, pt-BR. Drafts, labeled in the UI as unreviewed | [`src/i18n/`](src/i18n) |
| The hackathon's three made-up sample testimonies, verbatim: A long and rambling (English), B very short (English), C Spanish voice note. No French or Portuguese sample yet; mock transcription uses a labeled placeholder there | [`src/fixtures/stories.ts`](src/fixtures/stories.ts) |

### API

All routes are session-owned (anonymous `sid` cookie). Another session gets `404`. Errors carry a `code` the UI translates.

| Route | Purpose |
|---|---|
| `GET`/`POST /api/stories` · `GET`/`PATCH`/`DELETE /api/stories/:id` | List this session's stories (so a reload or "Start a new story" can continue or delete them); create after the age question; update text, take, name, language or privacy (content edits bump the version); delete everything |
| `POST /api/stories/:id/guardian` | **Test scenario:** simulated guardian decision that unlocks capture |
| `POST /api/transcribe` | multipart `audio`, `storyId`, `cloudProcessingAccepted`, optional `sttLocale`, `keep` (keep a converted copy ≤ 1 h for narration), `scriptText` (mock only) |
| `POST /api/render` | `storyId`, `kind` (`card`/`narrated-video`), `narration`, `outputLanguage`, `span`, `showName`, `showStoryLabel`, `cloud` consents. Returns the asset and its permission state |
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
- **Google Cloud calls** (no key yet), including SSML timepoints for each voice.
- **Interface translations** are drafts. Consent and privacy wording in all four languages needs native-speaker and legal review before any real-data use.

## Next steps

- Run the spike checklist above with a real key, then record a take per language through the UI and check caption timing by eye.
- Try the full flow on the team's iPhone and Android phones through the tunnel; adjust the WhatsApp/Instagram instructions to what the apps actually show.
- Stretch (plan section 4): Option B captioned original video, then face blur, only once A and C are solid on phones.

## Credits

Next.js, React, shadcn/ui (Base UI), Tailwind CSS, lucide icons, FFmpeg via [ffmpeg-static](https://github.com/eugeneware/ffmpeg-static) with libass, Vitest. Fonts (SIL Open Font License, in [`assets/fonts`](assets/fonts) with licenses in [`assets/font-licenses`](assets/font-licenses)): [Atkinson Hyperlegible](https://brailleinstitute.org/freefont) by the Braille Institute, and [Literata](https://github.com/googlefonts/literata) by TypeTogether for Google. Story fixtures are fabricated for this project.
