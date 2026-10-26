// Bounds. The plan proposed 90s; capped at 60s so a recording fits a
// single synchronous Speech-to-Text request (inline audio is limited to ~1 min).
export const MAX_RECORDING_SECONDS = 60;
export const MAX_STORY_CHARS = 1500;

// Inline Speech-to-Text payloads are capped at 10 MB; keep uploads under that.
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

// Raw uploads and derived audio expire after one hour (plan section 6).
export const TEMP_FILE_TTL_MS = 60 * 60 * 1000;

// Nothing is stored for later. A story is deleted when its finished file is
// downloaded, and at the latest this long after it started. The privacy
// policy and session cookie use the same figure.
export const STORY_TTL_MS = 2 * 60 * 60 * 1000;

export const ACCEPTED_AUDIO_TYPES = [
  "audio/webm",
  "audio/ogg",
  "audio/mp4",
  "audio/mpeg",
  "audio/mp3",
  "audio/aac",
  // iPhone voice memos and many Android recorders report .m4a this way.
  "audio/x-m4a",
  "audio/m4a",
  "audio/wav",
  "audio/x-wav",
  "audio/wave",
  "audio/flac",
  "audio/x-flac",
] as const;

/** For uploads where the browser reports no MIME type. */
export const AUDIO_TYPE_BY_EXTENSION: Record<string, string> = {
  webm: "audio/webm",
  ogg: "audio/ogg",
  oga: "audio/ogg",
  opus: "audio/ogg",
  m4a: "audio/mp4",
  mp4: "audio/mp4",
  aac: "audio/aac",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  flac: "audio/flac",
};

// Camera recordings and phone videos for "Video of me". The speech service
// only receives the extracted sound, so the 10 MB inline limit doesn't apply.
export const MAX_VIDEO_UPLOAD_BYTES = 150 * 1024 * 1024;

export const ACCEPTED_VIDEO_TYPES = ["video/webm", "video/mp4", "video/quicktime", "video/x-m4v"] as const;

/** For video uploads where the browser reports no MIME type. */
export const VIDEO_TYPE_BY_EXTENSION: Record<string, string> = {
  webm: "video/webm",
  mp4: "video/mp4",
  mov: "video/quicktime",
  m4v: "video/x-m4v",
};

// Word confidence below this marks the word for author correction.
export const UNCERTAIN_WORD_CONFIDENCE = 0.6;

// Card excerpts (option A). Font size steps down in fixed tiers, never
// indefinitely: past this length the author picks a shorter passage instead.
export const CARD_MAX_CHARS = 320;
// Translations run longer than their source; the template has room for this.
export const CARD_MAX_TRANSLATED_CHARS = 420;

// Longest narrated video. A full 1,500-character story read aloud fits inside it.
export const MAX_RENDER_SECONDS = 150;
