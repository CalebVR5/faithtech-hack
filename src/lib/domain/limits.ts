// Prototype bounds. The plan proposed 90s; capped at 60s so a recording fits a
// single synchronous Speech-to-Text request (inline audio is limited to ~1 min).
export const MAX_RECORDING_SECONDS = 60;
export const MAX_STORY_CHARS = 1500;

// Inline Speech-to-Text payloads are capped at 10 MB; keep uploads under that.
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

// Raw uploads and derived audio expire after one hour (plan section 6).
export const TEMP_FILE_TTL_MS = 60 * 60 * 1000;

export const ACCEPTED_AUDIO_TYPES = [
  "audio/webm",
  "audio/ogg",
  "audio/mp4",
  "audio/mpeg",
  "audio/wav",
  "audio/x-wav",
  "audio/flac",
] as const;

// Word confidence below this marks the word for author correction.
export const UNCERTAIN_WORD_CONFIDENCE = 0.6;
