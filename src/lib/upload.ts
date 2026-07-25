import { mkdirSync, existsSync } from "fs";
import { randomUUID } from "crypto";
import path from "path";

export const UPLOAD_DIR = path.join(process.cwd(), "uploads");

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
};

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export class UploadError extends Error {}

/** Simpan file foto ke folder uploads/ dan kembalikan URL publiknya. */
export async function saveUpload(file: File): Promise<string> {
  const ext = ALLOWED_TYPES[file.type];
  if (!ext) {
    throw new UploadError("Format file harus JPG, JPEG, atau PNG.");
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new UploadError("Ukuran file maksimal 5MB.");
  }
  if (!existsSync(UPLOAD_DIR)) {
    mkdirSync(UPLOAD_DIR, { recursive: true });
  }
  const name = `${Date.now()}-${randomUUID()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const { writeFile } = await import("fs/promises");
  await writeFile(path.join(UPLOAD_DIR, name), buffer);
  return `/api/files/${name}`;
}
