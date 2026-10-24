import { readFile } from "node:fs/promises";
import path from "node:path";
import { jsonError } from "@/lib/server/http";

// Serves the in-browser face detector (MediaPipe's WebAssembly runtime and the
// BlazeFace model) from this app, so face finding runs on the person's device
// without fetching code from a CDN. A fixed allowlist: no other files.
const FILES: Record<string, { from: string[]; type: string }> = {
  "vision_wasm_internal.js": { from: ["node_modules", "@mediapipe", "tasks-vision", "wasm", "vision_wasm_internal.js"], type: "text/javascript" },
  "vision_wasm_internal.wasm": { from: ["node_modules", "@mediapipe", "tasks-vision", "wasm", "vision_wasm_internal.wasm"], type: "application/wasm" },
  "vision_wasm_nosimd_internal.js": { from: ["node_modules", "@mediapipe", "tasks-vision", "wasm", "vision_wasm_nosimd_internal.js"], type: "text/javascript" },
  "vision_wasm_nosimd_internal.wasm": { from: ["node_modules", "@mediapipe", "tasks-vision", "wasm", "vision_wasm_nosimd_internal.wasm"], type: "application/wasm" },
  "blaze_face_short_range.tflite": { from: ["assets", "models", "blaze_face_short_range.tflite"], type: "application/octet-stream" },
};

export async function GET(_request: Request, ctx: RouteContext<"/api/vision/[file]">) {
  const entry = FILES[(await ctx.params).file];
  if (!entry) return jsonError(404, "Not found.");
  try {
    const data = await readFile(path.join(/*turbopackIgnore: true*/ process.cwd(), ...entry.from));
    return new Response(new Uint8Array(data), {
      headers: { "Content-Type": entry.type, "Cache-Control": "public, max-age=86400" },
    });
  } catch {
    return jsonError(404, "Not found.");
  }
}
