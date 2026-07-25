import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { db } from "@/db";
import { admins, type Admin } from "@/db/schema";
import { eq } from "drizzle-orm";

const SECRET = process.env.JWT_SECRET || "sipeka-rsud-ppp-dev-secret";
export const TOKEN_TTL_SECONDS = 30 * 60; // 30 menit

function b64url(input: Buffer | string) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export interface TokenPayload {
  sub: string;
  username: string;
  exp: number;
}

export function signToken(admin: Pick<Admin, "id" | "username">): string {
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = b64url(
    JSON.stringify({
      sub: admin.id,
      username: admin.username,
      exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
    } satisfies TokenPayload),
  );
  const signature = b64url(
    createHmac("sha256", SECRET).update(`${header}.${payload}`).digest(),
  );
  return `${header}.${payload}.${signature}`;
}

export function verifyToken(token: string): TokenPayload | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [header, payload, signature] = parts;
  const expected = b64url(
    createHmac("sha256", SECRET).update(`${header}.${payload}`).digest(),
  );
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }
  try {
    const data = JSON.parse(
      Buffer.from(payload.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString(
        "utf8",
      ),
    ) as TokenPayload;
    if (!data.sub || !data.exp) return null;
    if (data.exp * 1000 < Date.now()) return null;
    return data;
  } catch {
    return null;
  }
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, saltHex, hashHex] = stored.split("$");
  if (scheme !== "scrypt" || !saltHex || !hashHex) return false;
  try {
    const hash = scryptSync(password, Buffer.from(saltHex, "hex"), 64);
    const expected = Buffer.from(hashHex, "hex");
    return hash.length === expected.length && timingSafeEqual(hash, expected);
  } catch {
    return false;
  }
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/** Ambil admin dari header Authorization; lempar 401 bila tidak valid. */
export async function requireAdmin(request: Request): Promise<Admin> {
  const header = request.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) throw new ApiError(401, "Autentikasi diperlukan. Silakan login.");
  const payload = verifyToken(token);
  if (!payload) throw new ApiError(401, "Sesi berakhir. Silakan login kembali.");
  const [admin] = await db
    .select()
    .from(admins)
    .where(eq(admins.id, payload.sub))
    .limit(1);
  if (!admin || !admin.isActive) {
    throw new ApiError(401, "Akun tidak ditemukan atau tidak aktif.");
  }
  return admin;
}

export function sanitizeAdmin(a: Admin) {
  return {
    id: a.id,
    username: a.username,
    email: a.email,
    namaLengkap: a.namaLengkap,
    noTelepon: a.noTelepon,
    avatarUrl: a.avatarUrl,
    createdAt: a.createdAt.toISOString(),
  };
}
