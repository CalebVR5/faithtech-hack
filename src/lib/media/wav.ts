// Minimal PCM WAV helpers. Pure Buffer code, no ffmpeg, safe to unit test.

/** Reads the duration of a PCM WAV file from its header. */
export function wavDurationMs(wav: Buffer): number {
  if (wav.length < 12 || wav.toString("ascii", 0, 4) !== "RIFF" || wav.toString("ascii", 8, 12) !== "WAVE") {
    throw new Error("Not a WAV file");
  }
  let offset = 12;
  let byteRate = 0;
  while (offset + 8 <= wav.length) {
    const id = wav.toString("ascii", offset, offset + 4);
    const size = wav.readUInt32LE(offset + 4);
    if (id === "fmt ") byteRate = wav.readUInt32LE(offset + 16);
    if (id === "data") {
      if (!byteRate) throw new Error("WAV data chunk before fmt chunk");
      const dataBytes = Math.min(size, wav.length - offset - 8);
      return Math.round((dataBytes / byteRate) * 1000);
    }
    offset += 8 + size + (size % 2);
  }
  throw new Error("WAV file has no data chunk");
}

/** A quiet 220 Hz tone, so mock narration is audibly a placeholder rather than silence. */
export function toneWav(durationMs: number, sampleRate: number): Buffer {
  const samples = Math.round((durationMs / 1000) * sampleRate);
  const data = Buffer.alloc(samples * 2);
  for (let i = 0; i < samples; i++) {
    const v = Math.sin((2 * Math.PI * 220 * i) / sampleRate) * 0.05;
    data.writeInt16LE(Math.round(v * 32767), i * 2);
  }
  return Buffer.concat([wavHeader(data.length, sampleRate), data]);
}

/** 44-byte header for 16-bit mono PCM. */
export function wavHeader(dataBytes: number, sampleRate: number): Buffer {
  const h = Buffer.alloc(44);
  h.write("RIFF", 0, "ascii");
  h.writeUInt32LE(36 + dataBytes, 4);
  h.write("WAVE", 8, "ascii");
  h.write("fmt ", 12, "ascii");
  h.writeUInt32LE(16, 16); // fmt chunk size
  h.writeUInt16LE(1, 20); // PCM
  h.writeUInt16LE(1, 22); // mono
  h.writeUInt32LE(sampleRate, 24);
  h.writeUInt32LE(sampleRate * 2, 28); // byte rate
  h.writeUInt16LE(2, 32); // block align
  h.writeUInt16LE(16, 34); // bits per sample
  h.write("data", 36, "ascii");
  h.writeUInt32LE(dataBytes, 40);
  return h;
}
