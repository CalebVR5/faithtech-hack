// End-to-end check of the permission rules against a running server, using
// the mock provider. Covers plan section 9: approval per exact version, stale
// stories, guardian gates on direct API calls, cross-session access, separate
// inbox consent, idempotent submission, withdrawal and deletion.
//
//   npm run dev            (in one terminal, LANGUAGE_PROVIDER=mock)
//   npm run smoke          (in another; or: node scripts/smoke.mjs http://localhost:3000)
//
// Needs INBOX_PASSCODE in the server's environment (see .env.example).

const BASE = process.argv[2] ?? "http://localhost:3000";
const PASSCODE = process.env.INBOX_PASSCODE ?? "demo-inbox";

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

console.log("adult card flow");
let r = await a("POST", "/api/stories", { ageGate: "adult", interfaceLanguage: "en" });
check("story needs a path", r.status === 400 && r.data.code === "story-type-unanswered", r.data);
r = await a("POST", "/api/stories", { storyType: "baptism", ageGate: "adult", interfaceLanguage: "en" });
check("create story", r.status === 201, r.data);
const story = r.data.story;
r = await a("PATCH", `/api/stories/${story.id}`, { fixtureId: "sample-a-rambling", displayName: "Sam" });
check("load fixture bumps version", r.data.story?.version === 2, r.data);
const text = r.data.story.reviewedText;
// Sample A is too long for one card, so the card uses a single sentence from it.
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
r = await a("POST", "/api/approve", { assetId: card.id, assetVersion: card.version, purpose: "personal-output", decision: "granted" });
check("approve", r.status === 200 && r.data.exportDecision.ok, r.data);
r = await a("POST", "/api/export", { assetId: card.id });
check("export after approval", r.status === 200 && /attachment; filename="baptism-story.png"/.test(r.headers.get("content-disposition")));
r = await b("POST", "/api/export", { assetId: card.id });
check("other session can't export", r.status === 404, r.data);
r = await a("POST", "/api/mock-submissions", { assetId: card.id, idempotencyKey: "k1" });
check("inbox needs its own consent", r.status === 403 && r.data.code === "needs-inbox-consent", r.data);
r = await a("POST", "/api/approve", { assetId: card.id, assetVersion: card.version, purpose: "baptize-review", decision: "granted" });
check("inbox consent", r.data.submitDecision?.ok, r.data);
r = await a("POST", "/api/mock-submissions", { assetId: card.id, idempotencyKey: "k1" });
check("submit", r.status === 201 && r.data.submissions.length === 1, r.data);
r = await a("POST", "/api/mock-submissions", { assetId: card.id, idempotencyKey: "k1" });
check("repeat click → one submission", r.data.submissions?.length === 1, r.data);
const submissionId = r.data.submissions[0].id;

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

console.log("testimony path");
{
  const c = client();
  let q = await c("POST", "/api/stories", { storyType: "testimony", ageGate: "adult", interfaceLanguage: "en" });
  check("create testimony", q.status === 201 && q.data.story.storyType === "testimony", q.data);
  const tid = q.data.story.id;
  q = await c("PATCH", `/api/stories/${tid}`, { fixtureId: "sample-b-short" });
  check("baptism sample refused on the testimony path", q.status === 400 && q.data.code === "bad-fixture", q.data);
  q = await c("PATCH", `/api/stories/${tid}`, { fixtureId: "sample-t2-quiet" });
  check("testimony sample loads", q.status === 200 && q.data.story.sourceLanguage === "fr", q.data);
  q = await c("POST", "/api/render", { storyId: tid, kind: "card", outputLanguage: "fr" });
  const tc = q.data.asset;
  await c("POST", "/api/approve", { assetId: tc.id, assetVersion: tc.version, purpose: "personal-output", decision: "granted" });
  q = await c("POST", "/api/export", { assetId: tc.id });
  check("testimony export filename", q.status === 200 && /filename="testimony.png"/.test(q.headers.get("content-disposition")), q.data);
  await c("DELETE", `/api/stories/${tid}`);
}

console.log("minor flow");
r = await a("POST", "/api/stories", { storyType: "baptism", ageGate: "under-18", interfaceLanguage: "en" });
const minor = r.data.story;
check("minor starts pending", minor.guardianCapture === "pending");
r = await a("PATCH", `/api/stories/${minor.id}`, { fixtureId: "sample-b-short" });
check("content blocked before guardian", r.status === 403 && r.data.code === "capture-blocked", r.data);
r = await a("POST", "/api/render", { storyId: minor.id, kind: "card", outputLanguage: "en" });
check("render blocked before guardian", r.status === 403, r.data);
r = await a("POST", `/api/stories/${minor.id}/guardian`, { decision: "approved-in-simulation" });
check("guardian sim approves capture", r.data.story?.guardianCapture === "approved-in-simulation", r.data);
r = await a("PATCH", `/api/stories/${minor.id}`, { fixtureId: "sample-b-short" });
r = await a("POST", "/api/render", { storyId: minor.id, kind: "card", outputLanguage: "en" });
let mcard = r.data.asset;
r = await a("POST", "/api/approve", { assetId: mcard.id, assetVersion: mcard.version, purpose: "personal-output", decision: "granted" });
check("minor approval alone isn't enough", r.data.exportDecision?.code === "needs-guardian", r.data);
r = await a("POST", "/api/export", { assetId: mcard.id });
check("export blocked for minor", r.status === 403 && r.data.code === "needs-guardian", r.data);
r = await a("POST", "/api/guardian-simulation", { assetId: mcard.id, assetVersion: mcard.version, purpose: "personal-output", decision: "approved-in-simulation" });
check("guardian sim approves asset", r.data.exportDecision?.ok, r.data);
r = await a("POST", "/api/render", { storyId: minor.id, kind: "card", outputLanguage: "en" });
mcard = r.data.asset;
r = await a("POST", "/api/approve", { assetId: mcard.id, assetVersion: mcard.version, purpose: "personal-output", decision: "granted" });
check("changed asset needs guardian again", r.data.exportDecision?.code === "needs-guardian", r.data);

r = await a("POST", "/api/stories", { storyType: "testimony", ageGate: "not-sure", interfaceLanguage: "fr" });
const unsure = r.data.story;
r = await a("POST", `/api/stories/${unsure.id}/guardian`, { decision: "declined" });
r = await a("POST", `/api/stories/${unsure.id}/guardian`, { decision: "approved-in-simulation" });
check("declined stays declined", r.status === 409, r.data);

console.log("inbox");
const op = client();
r = await op("GET", "/api/inbox");
check("inbox locked", r.status === 401);
r = await op("POST", "/api/inbox", { passcode: "wrong" });
check("wrong passcode", r.status === 401);
r = await op("POST", "/api/inbox", { passcode: PASSCODE });
r = await op("GET", "/api/inbox");
check("inbox lists submission", r.status === 200 && r.data.items.some((i) => i.id === submissionId), r.data);
check("inbox shows the path", r.data.items.find((i) => i.id === submissionId)?.storyType === "baptism", r.data);
const item = r.data.items.find((i) => i.id === submissionId);
r = await op("GET", item.fileUrl);
check("inbox file", r.status === 200 && r.data.length > 1000);
r = await a("GET", item.fileUrl);
check("storyteller session can't open inbox", r.status === 401);
r = await b("DELETE", `/api/mock-submissions/${submissionId}`);
check("other session can't withdraw", r.status === 404);
r = await a("DELETE", `/api/mock-submissions/${submissionId}`);
check("withdraw", r.status === 204);
r = await op("GET", item.fileUrl);
check("withdrawn file gone", r.status === 404);

console.log("concurrent submissions");
{
  const c = client();
  let q = await c("POST", "/api/stories", { storyType: "baptism", ageGate: "adult", interfaceLanguage: "en" });
  const sid = q.data.story.id;
  await c("PATCH", `/api/stories/${sid}`, { fixtureId: "sample-b-short" });
  q = await c("POST", "/api/render", { storyId: sid, kind: "card", outputLanguage: "en" });
  const rc = q.data.asset;
  for (const purpose of ["personal-output", "baptize-review"]) {
    await c("POST", "/api/approve", { assetId: rc.id, assetVersion: rc.version, purpose, decision: "granted" });
  }
  // Six requests at once with one key, as a double click or a retry can produce.
  const burst = await Promise.all(Array.from({ length: 6 }, () => c("POST", "/api/mock-submissions", { assetId: rc.id, idempotencyKey: "race" })));
  check("concurrent same-key requests → one created", burst.filter((x) => x.status === 201).length === 1, burst.map((x) => x.status));
  q = await c("POST", "/api/mock-submissions", { assetId: rc.id, idempotencyKey: "another-key" });
  check("new key, same version → still one submission", q.status === 200 && q.data.submissions.length === 1, q.data);
  await c("DELETE", `/api/stories/${sid}`);
}

console.log("delete");
r = await a("GET", "/api/stories");
check("session lists its earlier story", r.status === 200 && r.data.stories.some((s) => s.id === story.id), r.data);
check("story list hides session id", r.data.stories.every((s) => !("sessionId" in s)), r.data);
r = await b("GET", "/api/stories");
check("other session can't list it", r.status === 200 && !r.data.stories.some((s) => s.id === story.id), r.data);
r = await a("DELETE", `/api/stories/${story.id}`);
check("delete story", r.status === 204);
r = await a("GET", `/api/stories/${story.id}`);
check("story gone", r.status === 404);
r = await a("GET", "/api/stories");
check("deleted story leaves the list", !r.data.stories.some((s) => s.id === story.id), r.data);
r = await a("GET", vid.previewUrl);
check("assets gone", r.status === 404);

console.log(failures ? `\n${failures} FAILED` : "\nall passed");
process.exit(failures ? 1 : 0);
