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
| `npm test` | Unit tests (policy, mock providers, language config) |
| `npm run typecheck` / `npm run lint` | Static checks |

All scripts are plain `next`/`vitest` commands with no shell-specific syntax, so they run the same way in macOS Terminal, Windows PowerShell and cmd.

### Demoing on phones

Phone browsers only allow microphone recording on **HTTPS** pages. Pick one:

1. **Tunnel (recommended):** run `npm run build && npm run start`, then `cloudflared tunnel --url http://localhost:3000` (Cloudflare's cloudflared works on macOS and Windows). Phones get a trusted HTTPS URL. Note that traffic passes through Cloudflare, so say so in the privacy page.
2. **`npm run dev:lan`:** this uses a self-signed certificate that's only trusted on the laptop, so phones show a warning you have to tap through. On Windows, allow Node through the firewall when prompted.

## Language provider: mock first, then Google Cloud

`LANGUAGE_PROVIDER=mock` (the default) returns deterministic results that are visibly labeled, such as a fixture transcript, `[mock pt]` translations and a quiet placeholder tone for narration. It makes no network calls, so the UI and renderer can be built before keys exist.

To switch to Google Cloud's free tier:

1. In a Google Cloud project with billing enabled, enable **Cloud Speech-to-Text API**, **Cloud Translation API** and **Cloud Text-to-Speech API**.
2. Create an **API key** (APIs & Services → Credentials) and restrict it to those three APIs.
3. Create a **budget alert** (Billing → Budgets). Alerts notify but don't stop spending. As a second safety net, the app keeps a per-process usage cap (`src/lib/server/usage.ts`; override with `USAGE_CAP_*` env vars).
4. Set `LANGUAGE_PROVIDER=gcp` and `GOOGLE_API_KEY=...` in `.env.local`, then restart.

If `gcp` is selected without a key, requests fail with a clear error. The app never silently falls back to mock results.

**Spike checklist (first hour):** confirm each locale and voice in [`src/lib/domain/languages.ts`](src/lib/domain/languages.ts) exists. Confirm word timestamps come back for en-US, fr-CA, es-US/es-MX/es-PE and pt-BR. Confirm SSML mark timepoints work for the chosen Standard voices (caption timing depends on it). Check the current free-tier limits on Google's pricing pages.

## What's built

| Area | Files |
|---|---|
| Shared contract: Story, Source, Transcript, Translation, RenderSpec, Asset, Consent, MockSubmission, RenderJob | [`src/lib/domain/types.ts`](src/lib/domain/types.ts) |
| Four languages with display, STT, TTS and translation codes mapped separately | [`src/lib/domain/languages.ts`](src/lib/domain/languages.ts) |
| Limits: 60 s recordings, 1,500 characters, 10 MB uploads, 1 h temp-file expiry | [`src/lib/domain/limits.ts`](src/lib/domain/limits.ts) |
| `authorize()`: the single export/submission permission check (exact asset version, stale story, guardian gate, separate inbox consent) | [`src/lib/domain/policy.ts`](src/lib/domain/policy.ts) |
| Provider interface, mock and Google Cloud adapters | [`src/lib/providers/`](src/lib/providers) |
| FFmpeg runner, audio normalization, Windows-safe filter paths | [`src/lib/server/ffmpeg.ts`](src/lib/server/ffmpeg.ts) |
| Session-owned, expiring temp media store | [`src/lib/server/temp-store.ts`](src/lib/server/temp-store.ts) |
| Fabricated fixtures (en, fr-CA, es-MX, es-PE, pt-BR, an uncertain story, and a minor) | [`src/fixtures/stories.ts`](src/fixtures/stories.ts) |

### API

All POST routes require `cloudProcessingAccepted: true`, even in mock mode, so the UI asks before anything is sent.

| Route | Input | Output |
|---|---|---|
| `POST /api/transcribe` | multipart: `audio` (webm/ogg/mp4/mpeg/wav/flac, ≤ 60 s), `language`, optional `sttLocale` | Draft transcript with segments and words; low-confidence words are flagged `uncertain`. The raw upload is not kept. |
| `POST /api/translate` | JSON: `segments[]`, `from`, `to` | Translated segments labeled `machineGenerated: true`, `reviewStatus: "not-reviewed"` |
| `POST /api/synthesize` | JSON: approved `text`, `language` | `audioRef`, duration, and caption segments timed against that audio |
| `GET` / `DELETE /api/media/:id` | | The audio file, served only to the owning session |
| `GET /api/health` | | Provider, key present (never the key itself), OS, ffmpeg status, usage |

## Next steps by lane (plan section 8)

- **Experience:** age gate → privacy guide → capture (MediaRecorder with a 60 s auto-stop; detect the supported MIME type) → transcript correction → script reader → output preview → approval → WhatsApp/Instagram/download handoff. Four locale string files.
- **Source and permission:** a story/asset/consent store (in-memory is fine for one laptop). `/api/render`, `/api/approve`, `/api/export` and `/api/mock-submissions` must all call `authorize()`. Guardian simulation, the protected mock inbox, and the privacy page.
- **Output and runtime:** narrated-video renderer (static background + WAV + burned-in captions → 720×1280 MP4) from a `RenderSpec`. **Bundle a TTF font** in the repo and pass it with `toFilterPath()`, rather than relying on system fonts, which differ between macOS and Windows. Verify accented characters early.

Known not-yet-verified items: Google Cloud calls (no key yet), real phone recording on iOS Safari and Android Chrome, and the Windows run itself (the code avoids OS-specific paths and shell commands, but nobody has run it on a Windows machine yet).

## Credits

Next.js, React, shadcn/ui (Base UI), Tailwind CSS, lucide icons, FFmpeg via [ffmpeg-static](https://github.com/eugeneware/ffmpeg-static), Vitest. Story fixtures are fabricated for this project.
