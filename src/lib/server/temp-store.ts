import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { TEMP_FILE_TTL_MS } from "@/lib/domain/limits";

// Private, session-owned, expiring working files: recordings, converted audio
// and rendered outputs while a story is in progress. Never a lasting store.
// Files live under the OS temp directory (works on macOS and Windows, and is
// in memory on Cloud Run); their records live in memory. A restarted process
// has no record of earlier files, so it deletes them before storing anything:
// a restart deletes everything, as the Privacy Policy says.

const ROOT = path.join(tmpdir(), "testimony-media");

export interface StoredFile {
  id: string;
  sessionId: string;
  mimeType: string;
  bytes: number;
  createdAt: number;
  expiresAt: number;
}

const globalStore = globalThis as unknown as { __tempFiles?: Map<string, StoredFile> };
const files = (globalStore.__tempFiles ??= new Map<string, StoredFile>());

/**
 * Files older than this process were left by an earlier one (a restart), and
 * nothing records them any more. Judged by age rather than a once-only flag:
 * the dev server can evaluate this module more than once, and a second sweep
 * must never touch files this process wrote.
 */
const PROCESS_STARTED_AT = Date.now() - process.uptime() * 1000;
let leftoversCleared: Promise<void> | null = null;
function clearLeftovers(): Promise<void> {
  return (leftoversCleared ??= readdir(ROOT)
    .catch(() => [] as string[])
    .then(async (names) => {
      await Promise.all(
        names.map(async (name) => {
          const p = path.join(ROOT, name);
          const info = await stat(p).catch(() => null);
          if (info && info.mtimeMs < PROCESS_STARTED_AT) await rm(p, { recursive: true, force: true });
        }),
      );
    }));
}

function filePath(id: string): string {
  // ids are server-generated UUIDs; reject anything else before touching disk.
  if (!/^[0-9a-f-]{36}$/.test(id)) throw new Error("Invalid file id");
  return path.join(ROOT, id);
}

export async function putFile(sessionId: string, data: Buffer, mimeType: string): Promise<StoredFile> {
  await clearLeftovers();
  await sweepExpired();
  await mkdir(ROOT, { recursive: true });
  const now = Date.now();
  const record: StoredFile = {
    id: randomUUID(),
    sessionId,
    mimeType,
    bytes: data.length,
    createdAt: now,
    expiresAt: now + TEMP_FILE_TTL_MS,
  };
  await writeFile(filePath(record.id), data);
  files.set(record.id, record);
  return record;
}

/** Returns the file only to the session that owns it. */
export async function getFile(sessionId: string, id: string): Promise<{ record: StoredFile; data: Buffer } | null> {
  const record = files.get(id);
  if (!record || record.sessionId !== sessionId) return null;
  if (record.expiresAt <= Date.now()) {
    await deleteFile(id);
    return null;
  }
  return { record, data: await readFile(filePath(id)) };
}

/** Ownership check without reading the file. */
export function ownsFile(sessionId: string, id: unknown): boolean {
  if (typeof id !== "string") return false;
  const record = files.get(id);
  return Boolean(record && record.sessionId === sessionId && record.expiresAt > Date.now());
}

export async function deleteFile(id: string): Promise<void> {
  files.delete(id);
  await rm(filePath(id), { force: true });
}

export async function deleteSessionFiles(sessionId: string): Promise<void> {
  const owned = [...files.values()].filter((f) => f.sessionId === sessionId);
  await Promise.all(owned.map((f) => deleteFile(f.id)));
}

export async function sweepExpired(now = Date.now()): Promise<void> {
  const expired = [...files.values()].filter((f) => f.expiresAt <= now);
  await Promise.all(expired.map((f) => deleteFile(f.id)));
}
