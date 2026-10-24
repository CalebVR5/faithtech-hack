import { STORY_FIXTURES } from "@/fixtures/stories";
import { isLanguageId } from "@/lib/domain/languages";
import { MAX_RECORDING_SECONDS, MAX_STORY_CHARS } from "@/lib/domain/limits";
import type { NarrationTake, PrivacyPreferences, Segment } from "@/lib/domain/types";
import { requireCapture, requireStory } from "@/lib/server/guards";
import { handleRouteError, json, RequestError } from "@/lib/server/http";
import { getOrCreateSessionId, getSessionId } from "@/lib/server/session";
import { deleteStory, storyView } from "@/lib/server/store";
import { deleteFile, ownsFile } from "@/lib/server/temp-store";

const MAX_NAME_CHARS = 40;

export async function GET(_request: Request, ctx: RouteContext<"/api/stories/[id]">) {
  try {
    const sessionId = (await getSessionId()) ?? "";
    const story = requireStory(sessionId, (await ctx.params).id);
    return json({ story: storyView(story) });
  } catch (err) {
    return handleRouteError(err);
  }
}

function parsePrivacy(value: unknown): PrivacyPreferences | undefined {
  if (!value || typeof value !== "object") return undefined;
  const v = value as Record<string, unknown>;
  return {
    hideFace: v.hideFace === true,
    hideVoice: v.hideVoice === true,
    hideName: v.hideName === true,
    hideSurroundings: v.hideSurroundings === true,
    notSure: v.notSure === true,
  };
}

function parseSegments(value: unknown, durationMs: number): Segment[] {
  if (!Array.isArray(value) || value.length === 0) throw new RequestError(400, "bad-take", "The recording's transcript is missing.");
  let chars = 0;
  const segments = value.map((s) => {
    const { text, startMs, endMs } = (s ?? {}) as Record<string, unknown>;
    if (typeof text !== "string" || typeof startMs !== "number" || typeof endMs !== "number") {
      throw new RequestError(400, "bad-take", "The recording's transcript is malformed.");
    }
    if (startMs < 0 || endMs < startMs || endMs > durationMs + 1000) {
      throw new RequestError(400, "bad-take", "Caption times don't match the recording.");
    }
    chars += text.length;
    return { text: text.trim(), startMs, endMs };
  });
  if (chars > MAX_STORY_CHARS) throw new RequestError(413, "too-long", `Stories can be up to ${MAX_STORY_CHARS} characters.`);
  return segments.filter((s) => s.text);
}

function parseTake(sessionId: string, value: unknown): NarrationTake {
  const v = (value ?? {}) as Record<string, unknown>;
  if (!ownsFile(sessionId, v.audioRef)) throw new RequestError(410, "take-expired", "That recording has expired. Please record it again.");
  const durationMs = Number(v.durationMs);
  if (!Number.isFinite(durationMs) || durationMs <= 0 || durationMs > (MAX_RECORDING_SECONDS + 1) * 1000) {
    throw new RequestError(400, "bad-take", "The recording's length is invalid.");
  }
  return {
    audioRef: v.audioRef as string,
    durationMs,
    segments: parseSegments(v.segments, durationMs),
    origin: v.origin === "script" ? "script" : "capture",
    scriptVersion: typeof v.scriptVersion === "number" ? v.scriptVersion : undefined,
    sttLocale: typeof v.sttLocale === "string" ? v.sttLocale.slice(0, 16) : "",
    provider: typeof v.provider === "string" ? v.provider.slice(0, 16) : "",
  };
}

/**
 * Updates story settings. Edits to anything an output is made from (text,
 * recording, name, story language) bump the version, which makes existing
 * assets stale and voids their approvals (plan section 3).
 */
export async function PATCH(request: Request, ctx: RouteContext<"/api/stories/[id]">) {
  try {
    const sessionId = await getOrCreateSessionId(request);
    const story = requireStory(sessionId, (await ctx.params).id);
    const body = (await request.json().catch(() => null)) ?? {};
    let contentChanged = false;
    const oldTakeRef = story.take?.audioRef;

    if (isLanguageId(body.interfaceLanguage)) story.interfaceLanguage = body.interfaceLanguage;
    const privacy = parsePrivacy(body.privacy);
    if (privacy) story.privacy = privacy;

    const touchesContent = ["sourceLanguage", "reviewedText", "fixtureId", "displayName", "take"].some((k) => k in body);
    if (touchesContent) requireCapture(story);

    if ("fixtureId" in body) {
      const fixture = STORY_FIXTURES.find((f) => f.id === body.fixtureId);
      if (!fixture) throw new RequestError(400, "bad-fixture", "Unknown sample story.");
      story.fixture = true;
      story.reviewedText = fixture.text;
      story.sourceLanguage = fixture.language;
      story.sourceKind = "text";
      story.take = undefined;
      contentChanged = true;
    }
    if (isLanguageId(body.sourceLanguage) && body.sourceLanguage !== story.sourceLanguage) {
      story.sourceLanguage = body.sourceLanguage;
      contentChanged = true;
    }
    if (typeof body.reviewedText === "string") {
      if (body.reviewedText.length > MAX_STORY_CHARS) {
        throw new RequestError(413, "too-long", `Stories can be up to ${MAX_STORY_CHARS} characters.`);
      }
      if (body.reviewedText !== story.reviewedText) {
        story.reviewedText = body.reviewedText;
        contentChanged = true;
      }
      if (body.sourceKind === "audio" || body.sourceKind === "text") story.sourceKind = body.sourceKind;
    }
    if ("displayName" in body) {
      const name = typeof body.displayName === "string" ? body.displayName.trim().slice(0, MAX_NAME_CHARS) : "";
      if ((name || undefined) !== story.displayName) {
        story.displayName = name || undefined;
        contentChanged = true;
      }
    }
    if ("take" in body) {
      story.take = body.take === null ? undefined : parseTake(sessionId, body.take);
      contentChanged = true;
    }

    if (oldTakeRef && oldTakeRef !== story.take?.audioRef) await deleteFile(oldTakeRef).catch(() => undefined);
    if (contentChanged) story.version += 1;
    return json({ story: storyView(story) });
  } catch (err) {
    return handleRouteError(err);
  }
}

/** Deletes the story and everything the app controls for it (plan section 7, DELETE /api/stories/:id). */
export async function DELETE(_request: Request, ctx: RouteContext<"/api/stories/[id]">) {
  try {
    const sessionId = (await getSessionId()) ?? "";
    const story = requireStory(sessionId, (await ctx.params).id);
    await deleteStory(story.id);
    return new Response(null, { status: 204 });
  } catch (err) {
    return handleRouteError(err);
  }
}
