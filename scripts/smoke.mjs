// End-to-end check of the permission and deletion rules against a running
// server, using the mock provider: adults only, approval per exact version,
// stale stories, cross-session access, the story deleted when its file is
// downloaded, and deletion on request.
//
//   LANGUAGE_PROVIDER=mock npm run dev   (in one terminal)
//   npm run smoke                        (in another; or: node scripts/smoke.mjs http://localhost:3000)

const BASE = process.argv[2] ?? "http://localhost:3000";

// Made-up story text, sent as if typed. Too long for one card, so cards use one sentence of it.
const STORY_TEXT =
  "So okay, I grew up kind of going to church with my grandma but I stopped when I was like fourteen. " +
  "My friend Dani kept inviting me to this Tuesday thing and I kept saying no. Then one night I just went. " +
  "People were just normal and kind. Fast forward a year and I'm in the water at the beach and my grandma is there crying. " +
  "That's it. That's the story. Sorry it's long.";

/** A 4-second 300 Hz tone as 16-bit mono WAV, standing in for a recording. */
function toneWav(seconds = 4, rate = 16000) {
  const n = seconds * rate;
  const buf = Buffer.alloc(44 + n * 2);
  buf.write("RIFF", 0, "ascii");
  buf.writeUInt32LE(36 + n * 2, 4);
  buf.write("WAVEfmt ", 8, "ascii");
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(rate, 24);
  buf.writeUInt32LE(rate * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36, "ascii");
  buf.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) buf.writeInt16LE(Math.round(Math.sin((2 * Math.PI * 300 * i) / rate) * 8000), 44 + i * 2);
  return buf;
}
let failures = 0;

function client() {
  const jar = new Map();
  return async function call(method, path, body, { form } = {}) {
    const headers = { cookie: [...jar].map(([k, v]) => `${k}=${v}`).join("; ") };
    let payload;
    if (form) payload = form;
    else if (body !== undefined) {
      headers["content-type"] = "application/json";
      payload = JSON.stringify(body);
    }
    const res = await fetch(BASE + path, { method, headers, body: payload });
    for (const c of res.headers.getSetCookie()) {
      const [kv] = c.split(";");
      const [k, v] = kv.split("=");
      jar.set(k, v);
    }
    const type = res.headers.get("content-type") ?? "";
    const data = type.includes("json") ? await res.json() : Buffer.from(await res.arrayBuffer());
    return { status: res.status, data, headers: res.headers };
  };
}

function check(name, cond, extra) {
  if (cond) console.log(`  ok   ${name}`);
  else {
    failures++;
    console.log(`  FAIL ${name}`, extra === undefined ? "" : JSON.stringify(extra).slice(0, 400));
  }
}

const a = client();
const b = client();

console.log("health");
const h = await a("GET", "/api/health");
check("ffmpeg ok", h.data.ffmpeg?.ok, h.data);
check("mock provider for this test", h.data.provider === "mock", h.data);

console.log("adults only");
let r = await a("POST", "/api/stories", { ageGate: "adult", interfaceLanguage: "en" });
check("story needs a path", r.status === 400 && r.data.code === "story-type-unanswered", r.data);
for (const ageGate of ["under-18", "not-sure", "unanswered"]) {
  r = await a("POST", "/api/stories", { storyType: "baptism", ageGate, interfaceLanguage: "en" });
  check(`no story for ${ageGate}`, r.status === 403 && r.data.code === "adults-only", r.data);
}
r = await a("GET", "/api/stories");
check("nothing created for refused answers", r.status === 200 && r.data.stories.length === 0, r.data);

console.log("adult card flow");
r = await a("POST", "/api/stories", { storyType: "baptism", ageGate: "adult", interfaceLanguage: "en" });
check("create story", r.status === 201, r.data);
const story = r.data.story;
r = await a("PATCH", `/api/stories/${story.id}`, { reviewedText: STORY_TEXT, sourceKind: "text", displayName: "Sam" });
check("typed text bumps version", r.data.story?.version === 2, r.data);
r = await a("PATCH", `/api/stories/${story.id}`, { fixtureId: "sample-a-rambling" });
check("sample stories are gone", r.status === 200 && r.data.story.reviewedText === STORY_TEXT, r.data);
const text = r.data.story.reviewedText;
const excerpt = "People were just normal and kind.";
const span = [text.indexOf(excerpt), text.indexOf(excerpt) + excerpt.length];
r = await a("POST", "/api/render", { storyId: story.id, kind: "card", span, showName: true, outputLanguage: "en" });
check("render card", r.status === 200 && r.data.asset?.status === "rendered", r.data);
let card = r.data.asset;
check("card is excerpt", card.spec.excerpt === true && card.spec.cardText === excerpt);
check("export decision denied before approval", r.data.exportDecision.ok === false && r.data.exportDecision.code === "needs-approval");
r = await a("GET", card.previewUrl);
check("owner preview is a PNG", r.status === 200 && r.data.subarray(1, 4).toString() === "PNG");
r = await b("GET", card.previewUrl);
check("other session can't preview", r.status === 404);
r = await a("POST", "/api/export", { assetId: card.id });
check("export blocked without approval", r.status === 403 && r.data.code === "needs-approval", r.data);
r = await a("POST", "/api/approve", { assetId: card.id, assetVersion: card.version - 1, purpose: "personal-output", decision: "granted" });
check("approving a different version is refused", r.status === 409, r.data);
r = await a("POST", "/api/approve", { assetId: card.id, assetVersion: card.version, purpose: "baptize-review", decision: "granted" });
check("review permission no longer exists", r.status === 400, r.data);
r = await a("POST", "/api/approve", { assetId: card.id, assetVersion: card.version, purpose: "personal-output", decision: "granted" });
check("approve", r.status === 200 && r.data.exportDecision.ok, r.data);
r = await b("POST", "/api/export", { assetId: card.id });
check("other session can't export", r.status === 404, r.data);

r = await a("PATCH", `/api/stories/${story.id}`, { reviewedText: text + " Edited." });
r = await a("POST", "/api/export", { assetId: card.id });
check("edit after approval → export stale", r.status === 403 && r.data.code === "asset-stale", r.data);
r = await a("POST", "/api/render", { storyId: story.id, kind: "card", span, outputLanguage: "en" });
card = r.data.asset;
r = await a("POST", "/api/export", { assetId: card.id });
check("re-render needs fresh approval", r.status === 403 && r.data.code === "needs-approval", r.data);
r = await a("POST", "/api/render", { storyId: story.id, kind: "card", outputLanguage: "en" });
check("full story too long for card", r.status === 422 && r.data.code === "passage-too-long", r.data);
r = await a("POST", "/api/render", { storyId: story.id, kind: "card", span, outputLanguage: "pt-BR" });
check("translation needs consent", r.status === 403 && r.data.code === "translation-consent-needed", r.data);
r = await a("POST", "/api/render", { storyId: story.id, kind: "card", span, outputLanguage: "pt-BR", cloud: { translation: true } });
check("translated card labeled", r.data.asset?.spec.machineTranslated && r.data.asset.spec.cardText.startsWith("[mock pt]"), r.data);

console.log("narrated video");
r = await a("POST", "/api/render", { storyId: story.id, kind: "narrated-video", narration: "synthetic", outputLanguage: "en" });
check("synthetic needs consent", r.status === 403 && r.data.code === "narration-consent-needed", r.data);
r = await a("POST", "/api/render", { storyId: story.id, kind: "narrated-video", narration: "synthetic", outputLanguage: "fr", cloud: { narration: true, translation: true } });
check("synthetic video with translated captions", r.status === 200 && r.data.asset.spec.captions.length > 1 && r.data.asset.spec.machineTranslated, r.data);
const vid = r.data.asset;
check("captions end at audio end", vid.spec.captions.at(-1).endMs === vid.durationMs, vid.spec.captions.at(-1));
r = await a("POST", "/api/render", { storyId: story.id, kind: "narrated-video", narration: "none", outputLanguage: "en" });
check("no-voice video", r.status === 200 && r.data.asset.mimeType === "video/mp4", r.data);
r = await a("POST", "/api/render", { storyId: story.id, kind: "narrated-video", narration: "recorded", outputLanguage: "en" });
check("recorded needs a take", r.status === 409 && r.data.code === "no-take", r.data);

const wav = toneWav();
let form = new FormData();
form.set("storyId", story.id);
form.set("audio", new Blob([wav], { type: "audio/wav" }), "take.wav");
form.set("keep", "true");
r = await a("POST", "/api/transcribe", undefined, { form });
check("transcribe needs consent", r.status === 403, r.data);
form = new FormData();
form.set("storyId", story.id);
form.set("audio", new Blob([wav], { type: "audio/wav" }), "take.wav");
form.set("keep", "true");
form.set("cloudProcessingAccepted", "true");
form.set("scriptText", "I read my story out loud. It was short.");
r = await a("POST", "/api/transcribe", undefined, { form });
check("transcribe scripted take", r.status === 200 && r.data.audioRef && r.data.transcript.text.startsWith("I read"), r.data);
const t = r.data;
r = await b("PATCH", `/api/stories/${story.id}`, { take: null });
check("other session can't patch", r.status === 404);
r = await a("PATCH", `/api/stories/${story.id}`, {
  take: { audioRef: t.audioRef, durationMs: t.durationMs, segments: t.transcript.segments, origin: "script", sttLocale: t.transcript.locale, provider: "mock" },
});
check("save take", r.status === 200 && r.data.story.take?.audioRef === t.audioRef, r.data);
r = await a("POST", "/api/render", { storyId: story.id, kind: "narrated-video", narration: "recorded", outputLanguage: "en", showName: true });
check("recorded video", r.status === 200 && r.data.asset.spec.captions[0].text.startsWith("I read"), r.data);
const recorded = r.data.asset;

console.log("download deletes everything");
r = await a("GET", "/api/stories");
check("session lists its unfinished story", r.data.stories.some((s) => s.id === story.id), r.data);
check("story list hides session id", r.data.stories.every((s) => !("sessionId" in s)), r.data);
r = await b("GET", "/api/stories");
check("other session can't list it", !r.data.stories.some((s) => s.id === story.id), r.data);
r = await a("POST", "/api/approve", { assetId: recorded.id, assetVersion: recorded.version, purpose: "personal-output", decision: "granted" });
r = await a("POST", "/api/export", { assetId: recorded.id });
check(
  "export hands over the file",
  r.status === 200 && /attachment; filename="baptism-story.mp4"/.test(r.headers.get("content-disposition")) && r.data.length > 1000,
);
check("export says the server copy is gone", r.headers.get("x-story-deleted") === "true");
r = await a("GET", `/api/stories/${story.id}`);
check("story gone after download", r.status === 404, r.data);
for (const [name, url] of [["card", card.previewUrl], ["synthetic video", vid.previewUrl], ["recorded video", recorded.previewUrl]]) {
  r = await a("GET", url);
  check(`${name} file gone`, r.status === 404);
}
r = await a("POST", "/api/export", { assetId: recorded.id });
check("can't download twice", r.status === 404, r.data);
r = await a("GET", "/api/stories");
check("downloaded story leaves the list", !r.data.stories.some((s) => s.id === story.id), r.data);

console.log("testimony path");
{
  const c = client();
  let q = await c("POST", "/api/stories", { storyType: "testimony", ageGate: "adult", interfaceLanguage: "fr" });
  check("create testimony", q.status === 201 && q.data.story.storyType === "testimony", q.data);
  const tid = q.data.story.id;
  q = await c("PATCH", `/api/stories/${tid}`, { reviewedText: "J'ai grandi à l'église. Aujourd'hui, je prie pour vrai.", sourceLanguage: "fr" });
  q = await c("POST", "/api/render", { storyId: tid, kind: "card", outputLanguage: "fr" });
  const tc = q.data.asset;
  await c("POST", "/api/approve", { assetId: tc.id, assetVersion: tc.version, purpose: "personal-output", decision: "granted" });
  q = await c("POST", "/api/export", { assetId: tc.id });
  check("testimony export filename", q.status === 200 && /filename="testimony.png"/.test(q.headers.get("content-disposition")), q.data);
  q = await c("GET", `/api/stories/${tid}`);
  check("testimony gone after download", q.status === 404, q.data);
}

console.log("delete on request");
{
  const c = client();
  let q = await c("POST", "/api/stories", { storyType: "baptism", ageGate: "adult", interfaceLanguage: "en" });
  const sid = q.data.story.id;
  await c("PATCH", `/api/stories/${sid}`, { reviewedText: "I was lost. Now I'm not. Got baptized Sunday." });
  q = await c("POST", "/api/render", { storyId: sid, kind: "card", outputLanguage: "en" });
  const preview = q.data.asset.previewUrl;
  q = await b("DELETE", `/api/stories/${sid}`);
  check("other session can't delete", q.status === 404);
  q = await c("DELETE", `/api/stories/${sid}`);
  check("delete story", q.status === 204);
  q = await c("GET", `/api/stories/${sid}`);
  check("story gone", q.status === 404);
  q = await c("GET", preview);
  check("its files gone", q.status === 404);
}

console.log("prototype endpoints removed");
for (const [method, path] of [["GET", "/api/inbox"], ["POST", "/api/mock-submissions"], ["POST", "/api/submissions"], ["POST", "/api/guardian-simulation"]]) {
  r = await a(method, path, method === "POST" ? {} : undefined);
  check(`${method} ${path} is gone`, r.status === 404 || r.status === 405, r.status);
}

console.log(failures ? `\n${failures} FAILED` : "\nall passed");
process.exit(failures ? 1 : 0);
