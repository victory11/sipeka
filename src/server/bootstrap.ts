import { sql } from "drizzle-orm";
import { db } from "@/db";

/**
 * Membuat seluruh tabel SIPEKA bila belum ada (idempoten).
 * Dipakai oleh POST /api/seed agar deploy di Vercel + Neon
 * tidak memerlukan `drizzle-kit push` dari mesin lokal.
 * Urutan CREATE TABLE mengikuti dependensi foreign key.
 */
const DDL_STATEMENTS = [
  `create table if not exists admins (
    id uuid primary key default gen_random_uuid(),
    username varchar(50) not null unique,
    email varchar(120) not null unique,
    password varchar(255) not null,
    nama_lengkap varchar(100) not null,
    no_telepon varchar(20),
    avatar_url varchar(255),
    is_active boolean not null default true,
    created_at timestamp not null default now(),
    updated_at timestamp not null default now()
  )`,
  `create table if not exists keluhan (
    id uuid primary key default gen_random_uuid(),
    nomor_tiket varchar(30) not null unique,
    nama_lengkap varchar(100) not null,
    email varchar(120) not null,
    no_telepon varchar(20) not null,
    jenis_kelamin varchar(20) not null,
    pendidikan varchar(10) not null,
    ruangan_pelayanan varchar(100) not null,
    kategori_keluhan varchar(60) not null,
    judul_keluhan varchar(100) not null,
    isi_keluhan text not null,
    foto_keluhan_url text,
    status varchar(20) not null default 'Ditinjau',
    status_diproses_at timestamp,
    status_selesai_at timestamp,
    created_at timestamp not null default now(),
    updated_at timestamp not null default now()
  )`,
  `create table if not exists responses (
    id uuid primary key default gen_random_uuid(),
    keluhan_id uuid not null references keluhan(id) on delete cascade,
    admin_id uuid references admins(id) on delete set null,
    isi_response text not null,
    foto_response_url text,
    rating_kepuasan integer,
    komentar_rating text,
    created_at timestamp not null default now(),
    updated_at timestamp not null default now()
  )`,
  `create index if not exists idx_keluhan_status on keluhan(status)`,
  `create index if not exists idx_keluhan_created_at on keluhan(created_at desc)`,
  `create index if not exists idx_responses_keluhan on responses(keluhan_id)`,
];

export async function ensureSchema(): Promise<boolean[]> {
  const results: boolean[] = [];
  for (const statement of DDL_STATEMENTS) {
    await db.execute(sql.raw(statement));
    results.push(true);
  }
  return results;
}
