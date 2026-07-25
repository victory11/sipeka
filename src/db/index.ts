import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

const isLocal = /localhost|127\.0\.0\.1/.test(databaseUrl);

const globalForDb = globalThis as typeof globalThis & {
  __sipekaPgPool?: Pool;
};

/**
 * Konfigurasi pool untuk PostgreSQL/Neon.
 *
 * - `max: 3` di produksi: Vercel serverless membuat satu Pool per instance
 *   fungsi yang hangat; pool kecil mencegah melampaui batas koneksi
 *   simultan Neon (free tier) saat trafik naik.
 * - Timeout & keepalive agar koneksi mati tidak menumpuk di instance dingin.
 * - SSL: connection string Neon selalu menyertakan `sslmode=require`;
 *   sebagai jaring pengaman untuk host non-lokal tanpa parameter ssl,
 *   SSL dipaksa secara eksplisit.
 */
export const pool =
  globalForDb.__sipekaPgPool ??
  new Pool({
    connectionString: databaseUrl,
    max: isLocal ? 10 : 3,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    allowExitOnIdle: true,
    ...(isLocal || databaseUrl.includes("sslmode=")
      ? {}
      : { ssl: { rejectUnauthorized: false } }),
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__sipekaPgPool = pool;
}

export const db = drizzle(pool);
