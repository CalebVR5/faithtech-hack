import { isLanguageId } from "@/lib/domain/languages";
import { isStoryType, type Story } from "@/lib/domain/types";
import { handleRouteError, json, jsonError } from "@/lib/server/http";
import { getOrCreateSessionId, getSessionId } from "@/lib/server/session";
import { db, newId, STORY_TTL_MS, storyView, sweepStories } from "@/lib/server/store";

/**
 * This session's unfinished stories, newest first. A reload or "Start a new
 * story" drops the browser's in-memory draft, so this lets the person find an
 * unfinished story again to continue or delete it before it expires, without
 * keeping anything in browser storage.
 */
export async function GET() {
  try {
    const sessionId = await getSessionId();
    if (!sessionId) return json({ stories: [] });
    sweepStories();
    const stories = [...db.stories.values()]
      .filter((s) => s.sessionId === sessionId)
      .sort((a, b) => b.createdAt - a.createdAt)
      .map(storyView);
    return json({ stories, expiresAfterMs: STORY_TTL_MS });
  } catch (err) {
    return handleRouteError(err);
  }
}

// Starts a story once the path is chosen and the person confirms they're 18
// or older (plan section 3). No name, contact details or date of birth: just
// those answers and language choices. The service is for adults only, so no
// story is created for anyone else.
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const { storyType, ageGate, interfaceLanguage } = body ?? {};
    if (!isStoryType(storyType)) return jsonError(400, "Choose a baptism story or a testimony.", "story-type-unanswered");
    if (ageGate !== "adult") return jsonError(403, "This service is for adults 18 and older.", "adults-only");
    if (!isLanguageId(interfaceLanguage)) return jsonError(400, "Choose a language.");

    const sessionId = await getOrCreateSessionId(request);
    sweepStories();
    const story: Story = {
      id: newId(),
      sessionId,
      storyType,
      ageGate,
      interfaceLanguage,
      sourceLanguage: interfaceLanguage,
      privacy: { hideFace: false, hideVoice: false, hideName: false, hideSurroundings: false, notSure: false },
      sourceKind: "text",
      reviewedText: "",
      version: 1,
      createdAt: Date.now(),
    };
    db.stories.set(story.id, story);
    return json({ story: storyView(story) }, 201);
  } catch (err) {
    return handleRouteError(err);
  }
}
