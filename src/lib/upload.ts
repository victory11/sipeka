import path from "path";

/**
 * Direktori legacy untuk route GET /api/files/[name] (data lama).
 * Upload baru tidak lagi menulis ke filesystem karena Vercel
 * serverless memiliki filesystem read-only — foto disimpan sebagai
 * base64 data-URL langsung ke kolom database.
 */
export const UPLOAD_DIR = path.join(process.cwd(), "uploads");

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "image/jpeg",
  "image/png": "image/png",
};

/**
 * Batas 3MB: aman di bawah limit body request Vercel (4.5MB)
 * setelah diperhitungkan overhead multipart.
 */
export const MAX_FILE_SIZE = 3 * 1024 * 1024;

export class UploadError extends Error {}

/**
 * Validasi foto lalu kembalikan data-URL (data:image/...;base64,...)
 * agar bisa disimpan di kolom `text` dan dirender langsung oleh
 * <img>, lightbox, maupun tautan unduh tanpa file server.
 */
export async function saveUpload(file: File): Promise<string> {
  const mime = ALLOWED_TYPES[file.type];
  if (!mime) {
    throw new UploadError("Format file harus JPG, JPEG, atau PNG.");
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new UploadError("Ukuran file maksimal 3MB.");
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  return `data:${mime};base64,${buffer.toString("base64")}`;
}
