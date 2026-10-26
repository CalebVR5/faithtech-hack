import type { LanguageId } from "@/lib/domain/languages";
import type { TimedWord } from "@/lib/domain/timing";
import type { StoryType, Transcript } from "@/lib/domain/types";

// The three managed-API operations (plan section 7). Story text and media are
// passed as data; nothing a provider returns is allowed to grant a permission.

export interface TranscribeInput {
  /** 16 kHz mono 16-bit WAV, already normalized and duration-checked. */
  wav: Buffer;
  sampleRate: number;
  durationMs: number;
  language: LanguageId;
  sttLocale: string;
  /**
   * Mock only: the script shown while a take was recorded, so offline development
   * transcribe something coherent. Real providers must ignore it; captions
   * always follow what was actually said.
   */
  scriptText?: string;
  /** Mock only: picks a sample from the same path to stand in for the recording. */
  storyType?: StoryType;
}

export interface TranslateInput {
  segments: string[];
  from: LanguageId;
  to: LanguageId;
}

export interface SynthesizeInput {
  /** Approved original-language text only. */
  text: string;
  language: LanguageId;
}

export interface SynthesizeOutput {
  audio: Buffer;
  mimeType: "audio/wav";
  durationMs: number;
  /** Every word of the text with the time it is spoken in this audio. */
  words: TimedWord[];
  voice: string;
}

export interface LanguageProvider {
  readonly name: "mock" | "gcp";
  transcribe(input: TranscribeInput): Promise<Transcript>;
  translate(input: TranslateInput): Promise<string[]>;
  synthesize(input: SynthesizeInput): Promise<SynthesizeOutput>;
}

/** Errors whose message is safe to show the person. Never include story text. */
export class ProviderError extends Error {
  constructor(
    message: string,
    readonly status = 502,
  ) {
    super(message);
  }
}
