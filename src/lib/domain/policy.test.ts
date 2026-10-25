import { describe, expect, it } from "vitest";
import { authorize, captureAllowed, MOCK_INBOX_RECIPIENT, type PolicyContext } from "./policy";
import type { Asset, Consent, Story } from "./types";

const story: Story = {
  id: "story-1",
  fixture: true,
  sessionId: "session-a",
  storyType: "baptism",
  ageGate: "adult",
  guardianCapture: "not-needed",
  interfaceLanguage: "en",
  sourceLanguage: "en",
  privacy: { hideFace: false, hideVoice: false, hideName: true, hideSurroundings: false, notSure: false },
  sourceKind: "text",
  reviewedText: "I was baptized last spring.",
  version: 3,
  createdAt: 0,
};

const asset: Asset = {
  id: "asset-1",
  storyId: "story-1",
  storyVersion: 3,
  version: 2,
  status: "rendered",
  renderedAt: 0,
  spec: {
    storyId: "story-1",
    storyVersion: 3,
    kind: "narrated-video",
    layoutVersion: "v1",
    selectedSpans: [[0, 10]],
    excerpt: true,
    narration: "synthetic",
    narrationLanguage: "en",
    captionLanguage: "en",
    captions: [],
    machineTranslated: false,
    footage: "neutral",
    showStoryLabel: true,
  },
};

function consent(overrides: Partial<Consent> = {}): Consent {
  return {
    id: "c-1",
    storyId: "story-1",
    assetId: "asset-1",
    assetVersion: 2,
    purpose: "personal-output",
    decision: "granted",
    decidedAt: 0,
    consentCopyVersion: "v1",
    ...overrides,
  };
}

function ctx(overrides: Partial<PolicyContext> = {}): PolicyContext {
  return { sessionId: "session-a", story, asset, consents: [consent()], ...overrides };
}

describe("authorize export", () => {
  it("allows an adult's approved, current asset", () => {
    expect(authorize("export", ctx())).toEqual({ ok: true });
  });

  it("denies another session", () => {
    expect(authorize("export", ctx({ sessionId: "session-b" }))).toMatchObject({ ok: false, code: "wrong-session" });
  });

  it("denies without approval", () => {
    expect(authorize("export", ctx({ consents: [] }))).toMatchObject({ ok: false, code: "needs-approval" });
  });

  it("denies when the approval was for an older asset version", () => {
    const result = authorize("export", ctx({ consents: [consent({ assetVersion: 1 })] }));
    expect(result).toMatchObject({ ok: false, code: "needs-approval" });
  });

  it("denies a revoked approval", () => {
    const result = authorize("export", ctx({ consents: [consent({ revokedAt: 5 })] }));
    expect(result).toMatchObject({ ok: false, code: "needs-approval" });
  });

  it("denies a stale asset after the story was edited", () => {
    const result = authorize("export", ctx({ story: { ...story, version: 4 } }));
    expect(result).toMatchObject({ ok: false, code: "asset-stale" });
  });

  it("denies an asset that is not rendered", () => {
    const result = authorize("export", ctx({ asset: { ...asset, status: "failed" } }));
    expect(result).toMatchObject({ ok: false, code: "asset-not-ready" });
  });

  it("denies before the age question is answered", () => {
    const result = authorize("export", ctx({ story: { ...story, ageGate: "unanswered" } }));
    expect(result).toMatchObject({ ok: false, code: "age-unanswered" });
  });

  it.each(["under-18", "not-sure"] as const)("requires guardian approval for %s", (ageGate) => {
    const minor = { ...story, ageGate };
    expect(authorize("export", ctx({ story: minor }))).toMatchObject({ ok: false, code: "needs-guardian" });
    expect(
      authorize("export", ctx({ story: minor, consents: [consent({ guardian: "declined" })] })),
    ).toMatchObject({ ok: false, code: "guardian-declined" });
    expect(
      authorize("export", ctx({ story: minor, consents: [consent({ guardian: "approved-in-simulation" })] })),
    ).toEqual({ ok: true });
  });

  it("guardian approval does not carry over to a changed asset", () => {
    const minor = { ...story, ageGate: "under-18" as const };
    const result = authorize(
      "export",
      ctx({ story: minor, consents: [consent({ assetVersion: 1, guardian: "approved-in-simulation" })] }),
    );
    expect(result).toMatchObject({ ok: false, code: "needs-approval" });
  });
});

describe("authorize mock inbox submission", () => {
  const inbox = consent({ id: "c-2", purpose: "baptize-review", recipient: MOCK_INBOX_RECIPIENT });

  it("is denied with export approval alone", () => {
    expect(authorize("submit-mock-inbox", ctx())).toMatchObject({ ok: false, code: "needs-inbox-consent" });
  });

  it("is denied with inbox consent alone", () => {
    expect(authorize("submit-mock-inbox", ctx({ consents: [inbox] }))).toMatchObject({
      ok: false,
      code: "needs-approval",
    });
  });

  it("requires the named recipient", () => {
    const wrongRecipient = { ...inbox, recipient: "some-church" };
    expect(authorize("submit-mock-inbox", ctx({ consents: [consent(), wrongRecipient] }))).toMatchObject({
      ok: false,
      code: "needs-inbox-consent",
    });
  });

  it("is allowed with both permissions", () => {
    expect(authorize("submit-mock-inbox", ctx({ consents: [consent(), inbox] }))).toEqual({ ok: true });
  });
});

describe("captureAllowed", () => {
  it("blocks capture until the age gate allows it", () => {
    expect(captureAllowed({ ageGate: "unanswered", guardianCapture: "approved-in-simulation" })).toBe(false);
    expect(captureAllowed({ ageGate: "under-18", guardianCapture: "pending" })).toBe(false);
    expect(captureAllowed({ ageGate: "under-18", guardianCapture: "declined" })).toBe(false);
    expect(captureAllowed({ ageGate: "not-sure", guardianCapture: "approved-in-simulation" })).toBe(true);
    expect(captureAllowed(story)).toBe(true);
  });
});
