import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const admins = pgTable("admins", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  email: varchar("email", { length: 120 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(), // scrypt:hexsalt:hexhash
  namaLengkap: varchar("nama_lengkap", { length: 100 }).notNull(),
  noTelepon: varchar("no_telepon", { length: 20 }),
  avatarUrl: varchar("avatar_url", { length: 255 }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const keluhan = pgTable("keluhan", {
  id: uuid("id").primaryKey().defaultRandom(),
  nomorTiket: varchar("nomor_tiket", { length: 30 }).notNull().unique(),

  // Data responden
  namaLengkap: varchar("nama_lengkap", { length: 100 }).notNull(),
  email: varchar("email", { length: 120 }).notNull(),
  noTelepon: varchar("no_telepon", { length: 20 }).notNull(),
  jenisKelamin: varchar("jenis_kelamin", { length: 20 }).notNull(),
  pendidikan: varchar("pendidikan", { length: 10 }).notNull(),

  // Data keluhan
  ruanganPelayanan: varchar("ruangan_pelayanan", { length: 100 }).notNull(),
  kategoriKeluhan: varchar("kategori_keluhan", { length: 60 }).notNull(),
  judulKeluhan: varchar("judul_keluhan", { length: 100 }).notNull(),
  isiKeluhan: text("isi_keluhan").notNull(),
  fotoKeluhanUrl: text("foto_keluhan_url"),

  // Status & tracking
  status: varchar("status", { length: 20 }).notNull().default("Ditinjau"),
  statusDiprosesAt: timestamp("status_diproses_at"),
  statusSelesaiAt: timestamp("status_selesai_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const responses = pgTable("responses", {
  id: uuid("id").primaryKey().defaultRandom(),
  keluhanId: uuid("keluhan_id")
    .notNull()
    .references(() => keluhan.id, { onDelete: "cascade" }),
  adminId: uuid("admin_id").references(() => admins.id, {
    onDelete: "set null",
  }),
  isiResponse: text("isi_response").notNull(),
  fotoResponseUrl: text("foto_response_url"),
  ratingKepuasan: integer("rating_kepuasan"),
  komentarRating: text("komentar_rating"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Admin = typeof admins.$inferSelect;
export type Keluhan = typeof keluhan.$inferSelect;
export type KeluhanResponse = typeof responses.$inferSelect;
