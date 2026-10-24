import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { TEMP_FILE_TTL_MS } from "@/lib/domain/limits";

// Private, session-owned, expiring media storage for a single-process local
// demo. Files live under the OS temp directory (works on macOS and Windows);
// metadata lives in memory, so a server restart orphans files until the OS
// cleans its temp folder. Swap for a shared store if the app ever runs on
// more than one process.

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

function filePath(id: string): string {
  // ids are server-generated UUIDs; reject anything else before touching disk.
  if (!/^[0-9a-f-]{36}$/.test(id)) throw new Error("Invalid file id");
  return path.join(ROOT, id);
}

export async function putFile(sessionId: string, data: Buffer, mimeType: string): Promise<StoredFile> {
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
