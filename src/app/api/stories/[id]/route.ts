import { isLanguageId, LANGUAGES } from "@/lib/domain/languages";
import { alignWords, sentencesFromWords } from "@/lib/domain/timing";
import { MAX_STORY_CHARS } from "@/lib/domain/limits";
import type { NarrationTake, PrivacyPreferences, Story } from "@/lib/domain/types";
import { requireCapture, requireStory } from "@/lib/server/guards";
import { handleRouteError, json, RequestError } from "@/lib/server/http";
import { getOrCreateSessionId, getSessionId } from "@/lib/server/session";
import { deleteStory, heardFor, storyView } from "@/lib/server/store";
import { deleteFile } from "@/lib/server/temp-store";

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

/** The author's reviewed sentences for a take; only their text is used. */
function parseReviewedText(value: unknown): string {
  if (!Array.isArray(value) || value.length === 0) throw new RequestError(400, "bad-take", "The recording's transcript is missing.");
  const texts = value.map((s) => {
    const text = (s as Record<string, unknown> | null)?.text;
    if (typeof text !== "string") throw new RequestError(400, "bad-take", "The recording's transcript is malformed.");
    return text.trim();
  });
  const joined = texts.filter(Boolean).join(" ");
  if (!joined) throw new RequestError(400, "bad-take", "The recording's transcript is empty.");
  if (joined.length > MAX_STORY_CHARS) throw new RequestError(413, "too-long", `Stories can be up to ${MAX_STORY_CHARS} characters.`);
  return joined;
}

/**
 * Builds a take from the author's reviewed words and what the speech service
 * heard in that recording, which the server kept. Every reviewed word gets a
 * time in the real audio, so captions change when the speaker does.
 */
function parseTake(sessionId: string, story: Story, value: unknown): NarrationTake {
  const v = (value ?? {}) as Record<string, unknown>;
  const heard = heardFor(sessionId, v.audioRef);
  if (!heard) throw new RequestError(410, "take-expired", "That recording has expired. Please record it again.");
  const text = parseReviewedText(v.segments);
  const words = alignWords(text, heard.words, heard.durationMs);
  return {
    audioRef: v.audioRef as string,
    videoRef: heard.videoRef,
    media: heard.media,
    durationMs: heard.durationMs,
    segments: sentencesFromWords(words, LANGUAGES[story.sourceLanguage].uiLocale),
    words,
    origin: v.origin === "script" ? "script" : "capture",
    scriptVersion: typeof v.scriptVersion === "number" ? v.scriptVersion : undefined,
    sttLocale: heard.sttLocale,
    provider: heard.provider,
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
    const oldTake = story.take;

    if (isLanguageId(body.interfaceLanguage)) story.interfaceLanguage = body.interfaceLanguage;
    const privacy = parsePrivacy(body.privacy);
    if (privacy) story.privacy = privacy;

    const touchesContent = ["sourceLanguage", "reviewedText", "displayName", "take"].some((k) => k in body);
    if (touchesContent) requireCapture(story);

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
      story.take = body.take === null ? undefined : parseTake(sessionId, story, body.take);
      contentChanged = true;
    }

    if (oldTake && oldTake.audioRef !== story.take?.audioRef) {
      await deleteFile(oldTake.audioRef).catch(() => undefined);
      if (oldTake.videoRef) await deleteFile(oldTake.videoRef).catch(() => undefined);
    }
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
