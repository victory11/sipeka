import "dotenv/config";
import { defineConfig } from "drizzle-kit";

/**
 * Membaca DATABASE_URL dari environment agar `npx drizzle-kit push`
 * dapat menarget Neon/Postgres mana pun (bukan hanya lokal).
 * Bila tidak ada, fallback ke Postgres lokal sandbox.
 */
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  dbCredentials: {
    url:
      process.env.DATABASE_URL ||
      "postgresql://neondb_owner:npg_xbJDBf5d1ekF@ep-holy-tree-azvwsi1z-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
  },
});
