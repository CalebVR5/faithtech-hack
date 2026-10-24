import { isLanguageId } from "@/lib/domain/languages";
import { NO_PREFERENCES } from "@/lib/domain/privacy-guide";
import type { AgeGate, Story } from "@/lib/domain/types";
import { handleRouteError, json, jsonError } from "@/lib/server/http";
import { getOrCreateSessionId } from "@/lib/server/session";
import { db, newId, storyView, sweepStories } from "@/lib/server/store";

const AGE_ANSWERS: AgeGate[] = ["adult", "under-18", "not-sure"];

// Starts a story once the age question is answered (plan section 3). No name,
// contact details or date of birth: just the answer and language choices.
export async function POST(request: Request) {
  try {
    const sessionId = await getOrCreateSessionId(request);
    const body = await request.json().catch(() => null);
    const { ageGate, interfaceLanguage } = body ?? {};
    if (!AGE_ANSWERS.includes(ageGate)) return jsonError(400, "Please answer the age question.", "age-unanswered");
    if (!isLanguageId(interfaceLanguage)) return jsonError(400, "Choose a language.");

    sweepStories();
    const story: Story = {
      id: newId(),
      fixture: false,
      sessionId,
      ageGate,
      guardianCapture: ageGate === "adult" ? "not-needed" : "pending",
      interfaceLanguage,
      sourceLanguage: interfaceLanguage,
      privacy: { ...NO_PREFERENCES },
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
