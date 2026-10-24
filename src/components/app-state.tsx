"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { MESSAGES, type Messages } from "@/i18n";
import { ApiError, api, type AssetState, type StoryView } from "@/lib/client/api";
import { LANGUAGES, type LanguageId } from "@/lib/domain/languages";
import type { NarrationMode, OutputKind, Segment, Transcript } from "@/lib/domain/types";

// Unsaved drafts live in memory only (plan section 6): nothing here is written
// to browser storage. The provider sits in the root layout so a visit to the
// privacy page doesn't lose the draft.

export type Step =
  | "welcome"
  | "age"
  | "guardian"
  | "privacy"
  | "capture"
  | "write"
  | "record"
  | "transcript"
  | "review"
  | "format"
  | "script"
  | "preview"
  | "share"
  | "deleted";

export interface PendingTranscript {
  purpose: "capture" | "script";
  audioUrl: string;
  audioRef?: string;
  durationMs: number;
  segments: Segment[];
  transcript: Transcript;
}

export interface OutputChoices {
  kind: OutputKind;
  narration: NarrationMode;
  outputLanguage: LanguageId | null;
  showName: boolean;
  showStoryLabel: boolean;
  /** Inclusive sentence indices of the selected passage. */
  range: [number, number] | null;
}

export type CloudPurpose = "transcription" | "translation" | "narration";

export interface FlowState {
  step: Step;
  history: Step[];
  story: StoryView | null;
  answers: [string, string, string];
  ownWay: boolean;
  ownText: string;
  captureMode: "speak" | "upload";
  sttLocale: string | null;
  pending: PendingTranscript | null;
  choices: OutputChoices;
  cloud: Record<CloudPurpose, boolean>;
  asset: AssetState | null;
  /** Choices + story version the current preview was made from. */
  renderedKey: string | null;
}

const INITIAL: FlowState = {
  step: "welcome",
  history: [],
  story: null,
  answers: ["", "", ""],
  ownWay: false,
  ownText: "",
  captureMode: "speak",
  sttLocale: null,
  pending: null,
  choices: {
    kind: "card",
    narration: "recorded",
    outputLanguage: null,
    showName: false,
    showStoryLabel: true,
    range: null,
  },
  cloud: { transcription: false, translation: false, narration: false },
  asset: null,
  renderedKey: null,
};

interface AppContextValue {
  ui: LanguageId;
  setUi: (id: LanguageId) => void;
  t: Messages;
  provider: string | null;
  flow: FlowState;
  update: (patch: Partial<FlowState> | ((s: FlowState) => Partial<FlowState>)) => void;
  go: (step: Step) => void;
  back: () => void;
  reset: (step?: Step) => void;
  /** Saves story fields on the server and keeps the returned version. */
  saveStory: (patch: Record<string, unknown>) => Promise<StoryView>;
  errorText: (err: unknown) => string;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [ui, setUiState] = useState<LanguageId>("en");
  const [flow, setFlow] = useState<FlowState>(INITIAL);
  const [provider, setProvider] = useState<string | null>(null);
  const t = MESSAGES[ui];

  useEffect(() => {
    document.documentElement.lang = LANGUAGES[ui].uiLocale;
  }, [ui]);

  useEffect(() => {
    api.health().then((h) => setProvider(h.provider), () => setProvider(null));
  }, []);

  const update = useCallback<AppContextValue["update"]>((patch) => {
    setFlow((s) => ({ ...s, ...(typeof patch === "function" ? patch(s) : patch) }));
  }, []);

  const go = useCallback((step: Step) => {
    setFlow((s) => (s.step === step ? s : { ...s, step, history: [...s.history, s.step] }));
  }, []);

  const back = useCallback(() => {
    setFlow((s) => {
      const history = [...s.history];
      const step = history.pop() ?? "welcome";
      return { ...s, step, history };
    });
  }, []);

  const reset = useCallback((step: Step = "welcome") => {
    setFlow((s) => {
      if (s.pending) URL.revokeObjectURL(s.pending.audioUrl);
      return { ...INITIAL, step };
    });
  }, []);

  const setUi = useCallback(
    (id: LanguageId) => {
      setUiState(id);
      const story = flow.story;
      if (story) void api.updateStory(story.id, { interfaceLanguage: id }).catch(() => undefined);
    },
    [flow.story],
  );

  const saveStory = useCallback(
    async (patch: Record<string, unknown>) => {
      const id = flow.story?.id;
      if (!id) throw new ApiError("No story yet.", 400);
      const { story } = await api.updateStory(id, patch);
      setFlow((s) => ({ ...s, story }));
      return story;
    },
    [flow.story?.id],
  );

  const errorText = useCallback(
    (err: unknown) => {
      if (err instanceof ApiError) return (err.code && t.errors[err.code]) || err.message;
      return t.common.errorFallback;
    },
    [t],
  );

  const value = useMemo(
    () => ({ ui, setUi, t, provider, flow, update, go, back, reset, saveStory, errorText }),
    [ui, setUi, t, provider, flow, update, go, back, reset, saveStory, errorText],
  );
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
