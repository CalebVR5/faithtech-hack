import { isLanguageId } from "@/lib/domain/languages";
import type { NarrationMode } from "@/lib/domain/types";
import { renderAsset, type RenderChoices } from "@/lib/server/compose";
import { assetState, requireCapture, requireStory } from "@/lib/server/guards";
import { handleRouteError, hasCloudConsent, json, jsonError } from "@/lib/server/http";
import { getOrCreateSessionId } from "@/lib/server/session";

const NARRATIONS: NarrationMode[] = ["recorded", "synthetic", "none"];

// Creates a new preview version of a card or narrated video. Rendering never
// approves, exports or submits anything: the result starts unapproved.
export async function POST(request: Request) {
  try {
    const sessionId = await getOrCreateSessionId(request);
    const body = (await request.json().catch(() => null)) ?? {};
    const story = requireStory(sessionId, body.storyId);
    requireCapture(story);

    if (body.kind !== "card" && body.kind !== "narrated-video" && body.kind !== "captioned-video") return jsonError(400, "Choose a format.");
    if (body.kind === "narrated-video" && !NARRATIONS.includes(body.narration)) return jsonError(400, "Choose a voice option.");
    const outputLanguage = isLanguageId(body.outputLanguage) ? body.outputLanguage : story.sourceLanguage;
    const span =
      Array.isArray(body.span) && body.span.length === 2 && body.span.every(Number.isInteger)
        ? ([body.span[0], body.span[1]] as [number, number])
        : undefined;

    const choices: RenderChoices = {
      kind: body.kind,
      narration: body.kind === "card" ? "none" : body.kind === "captioned-video" ? "recorded" : body.narration,
      outputLanguage,
      showName: body.showName === true,
      showStoryLabel: body.showStoryLabel !== false,
      span,
      cloud: {
        translation: hasCloudConsent(body.cloud?.translation),
        narration: hasCloudConsent(body.cloud?.narration),
      },
    };
    const asset = await renderAsset(sessionId, story, choices);
    return json(assetState(sessionId, story, asset));
  } catch (err) {
    return handleRouteError(err);
  }
}
