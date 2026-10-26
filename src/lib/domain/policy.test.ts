import { describe, expect, it } from "vitest";
import { authorize, captureAllowed, type PolicyContext } from "./policy";
import type { Asset, Consent, Story } from "./types";

const story: Story = {
  id: "story-1",
  sessionId: "session-a",
  storyType: "baptism",
  ageGate: "adult",
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
    expect(authorize(ctx())).toEqual({ ok: true });
  });

  it("denies another session", () => {
    expect(authorize(ctx({ sessionId: "session-b" }))).toMatchObject({ ok: false, code: "wrong-session" });
  });

  it("denies without approval", () => {
    expect(authorize(ctx({ consents: [] }))).toMatchObject({ ok: false, code: "needs-approval" });
  });

  it("denies when the approval was for an older asset version", () => {
    const result = authorize(ctx({ consents: [consent({ assetVersion: 1 })] }));
    expect(result).toMatchObject({ ok: false, code: "needs-approval" });
  });

  it("denies a revoked approval", () => {
    const result = authorize(ctx({ consents: [consent({ revokedAt: 5 })] }));
    expect(result).toMatchObject({ ok: false, code: "needs-approval" });
  });

  it("denies a stale asset after the story was edited", () => {
    const result = authorize(ctx({ story: { ...story, version: 4 } }));
    expect(result).toMatchObject({ ok: false, code: "asset-stale" });
  });

  it("denies an asset that is not rendered", () => {
    const result = authorize(ctx({ asset: { ...asset, status: "failed" } }));
    expect(result).toMatchObject({ ok: false, code: "asset-not-ready" });
  });

  it.each(["unanswered", "under-18", "not-sure"] as const)("denies a story whose age answer is %s", (ageGate) => {
    expect(authorize(ctx({ story: { ...story, ageGate } }))).toMatchObject({ ok: false, code: "adults-only" });
  });
});

describe("captureAllowed", () => {
  it("allows adults only", () => {
    expect(captureAllowed({ ageGate: "unanswered" })).toBe(false);
    expect(captureAllowed({ ageGate: "under-18" })).toBe(false);
    expect(captureAllowed({ ageGate: "not-sure" })).toBe(false);
    expect(captureAllowed(story)).toBe(true);
  });
});
