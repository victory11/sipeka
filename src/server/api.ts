import { NextRequest } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  isNotNull,
  lte,
  or,
  sql,
} from "drizzle-orm";
import { db } from "@/db";
import { admins, keluhan, responses, type Keluhan } from "@/db/schema";
import {
  ApiError,
  hashPassword,
  requireAdmin,
  sanitizeAdmin,
  signToken,
  verifyPassword,
} from "@/lib/auth";
import { saveUpload, UploadError, UPLOAD_DIR } from "@/lib/upload";
import {
  KATEGORI_FORM,
  KATEGORI_LIST,
  PENDIDIKAN_LIST,
  RUANGAN_LAINNYA,
  RUANGAN_LIST,
  STATUS_LIST,
  type StatusKeluhan,
} from "@/lib/constants";
import { EMAIL_RE, PHONE_RE } from "@/lib/utils";
import type { DashboardStats, KeluhanView } from "@/lib/types";

const json = (data: unknown, status = 200) => Response.json(data, { status });
const iso = (d: Date | null) => (d ? d.toISOString() : null);

/* ================= util ================= */

export function normalizeTicket(input: string) {
  let t = input.trim().toUpperCase().replace(/\s+/g, "");
  if (!t) return "";
  if (t.startsWith("SIPEKA-")) return t;
  if (t.startsWith("SIPEKA")) return `SIPEKA-${t.slice(6).replace(/^-+/, "")}`;
  return `SIPEKA-${t.replace(/^-+/, "")}`;
}

function generateTicket(date = new Date()) {
  const yy = String(date.getFullYear());
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const rand = String(Math.floor(10000 + Math.random() * 90000));
  return `SIPEKA-${yy}${mm}${dd}${rand}`;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type JoinedRow = {
  k: Keluhan;
  r: {
    id: string | null;
    isiResponse: string | null;
    fotoResponseUrl: string | null;
    ratingKepuasan: number | null;
    komentarRating: string | null;
    createdAt: Date | null;
  } | null;
  adminNama: string | null;
};

function joinedQuery(where?: ReturnType<typeof eq>) {
  return db
    .select({
      k: keluhan,
      r: {
        id: responses.id,
        isiResponse: responses.isiResponse,
        fotoResponseUrl: responses.fotoResponseUrl,
        ratingKepuasan: responses.ratingKepuasan,
        komentarRating: responses.komentarRating,
        createdAt: responses.createdAt,
      },
      adminNama: admins.namaLengkap,
    })
    .from(keluhan)
    .leftJoin(responses, eq(responses.keluhanId, keluhan.id))
    .leftJoin(admins, eq(admins.id, responses.adminId))
    .where(where);
}

function toView(row: JoinedRow): KeluhanView {
  const { k } = row;
  // Drizzle mengembalikan null untuk objek join yang tidak punya baris cocok.
  const r = row.r ?? null;
  return {
    id: k.id,
    nomorTiket: k.nomorTiket,
    namaLengkap: k.namaLengkap,
    email: k.email,
    noTelepon: k.noTelepon,
    jenisKelamin: k.jenisKelamin,
    pendidikan: k.pendidikan,
    ruanganPelayanan: k.ruanganPelayanan,
    kategoriKeluhan: k.kategoriKeluhan,
    judulKeluhan: k.judulKeluhan,
    isiKeluhan: k.isiKeluhan,
    fotoKeluhanUrl: k.fotoKeluhanUrl,
    status: k.status,
    statusDiprosesAt: iso(k.statusDiprosesAt),
    statusSelesaiAt: iso(k.statusSelesaiAt),
    createdAt: iso(k.createdAt)!,
    response: r && r.id
      ? {
          id: r.id,
          isiResponse: r.isiResponse ?? "",
          fotoResponseUrl: r.fotoResponseUrl,
          ratingKepuasan: r.ratingKepuasan,
          komentarRating: r.komentarRating,
          createdAt: iso(r.createdAt)!,
          adminNama: row.adminNama,
        }
      : null,
  };
}

async function optionalUpload(
  data: FormData,
  key: string,
): Promise<string | null> {
  const file = data.get(key);
  if (!file || typeof file === "string" || (file as File).size === 0) return null;
  try {
    return await saveUpload(file as File);
  } catch (e) {
    if (e instanceof UploadError) throw new ApiError(400, e.message);
    throw e;
  }
}

function statusPatch(
  status: StatusKeluhan,
  existing: Keluhan,
): Partial<typeof keluhan.$inferInsert> {
  const now = new Date();
  const patch: Partial<typeof keluhan.$inferInsert> = {
    status,
    updatedAt: now,
  };
  if (status === "Ditinjau") {
    patch.statusDiprosesAt = null;
    patch.statusSelesaiAt = null;
  }
  if (status === "Sedang Diproses") {
    patch.statusDiprosesAt = existing.statusDiprosesAt ?? now;
    patch.statusSelesaiAt = null;
  }
  if (status === "Selesai") {
    patch.statusDiprosesAt = existing.statusDiprosesAt ?? now;
    patch.statusSelesaiAt = existing.statusSelesaiAt ?? now;
  }
  return patch;
}

/* ================= PUBLIC: keluhan ================= */

async function createKeluhan(request: NextRequest) {
  let data: FormData;
  try {
    data = await request.formData();
  } catch {
    throw new ApiError(400, "Data form tidak valid.");
  }
  const str = (key: string) => {
    const v = data.get(key);
    return typeof v === "string" ? v.trim() : "";
  };

  const namaLengkap = str("namaLengkap").slice(0, 100);
  const email = str("email").slice(0, 120);
  const noTelepon = str("noTelepon").replace(/[^\d]/g, "");
  const jenisKelamin = str("jenisKelamin");
  const pendidikan = str("pendidikan");
  let ruangan = str("ruanganPelayanan");
  const ruanganLainnya = str("ruanganLainnya");
  const kategoriKeluhan = str("kategoriKeluhan");
  const judulKeluhan = str("judulKeluhan").slice(0, 100);
  const isiKeluhan = str("isiKeluhan").slice(0, 2000);

  if (!namaLengkap || namaLengkap.length < 3)
    throw new ApiError(400, "Nama lengkap wajib diisi (min. 3 karakter).");
  if (!EMAIL_RE.test(email))
    throw new ApiError(400, "Format email tidak valid.");
  if (!PHONE_RE.test(noTelepon))
    throw new ApiError(400, "No. telepon harus 10-12 digit dan diawali angka 0.");
  if (!["Laki-laki", "Perempuan"].includes(jenisKelamin))
    throw new ApiError(400, "Jenis kelamin wajib dipilih.");
  if (!PENDIDIKAN_LIST.includes(pendidikan))
    throw new ApiError(400, "Pendidikan terakhir wajib dipilih.");

  if (ruangan === RUANGAN_LAINNYA) {
    if (!ruanganLainnya)
      throw new ApiError(400, "Silakan ketik nama ruangan Anda.");
    ruangan = ruanganLainnya.slice(0, 100);
  } else if (!(RUANGAN_LIST as readonly string[]).includes(ruangan)) {
    throw new ApiError(400, "Ruangan pelayanan wajib dipilih.");
  }
  if (!KATEGORI_FORM.some((k) => k.nama === kategoriKeluhan))
    throw new ApiError(400, "Kategori keluhan wajib dipilih.");
  if (!judulKeluhan || judulKeluhan.length < 5)
    throw new ApiError(400, "Judul keluhan wajib diisi (min. 5 karakter).");
  if (!isiKeluhan || isiKeluhan.length < 20)
    throw new ApiError(400, "Isi keluhan wajib diisi (min. 20 karakter).");

  const fotoUrl = await optionalUpload(data, "foto");

  for (let attempt = 0; attempt < 5; attempt++) {
    const ticket = generateTicket();
    try {
      const [row] = await db
        .insert(keluhan)
        .values({
          nomorTiket: ticket,
          namaLengkap,
          email,
          noTelepon,
          jenisKelamin,
          pendidikan,
          ruanganPelayanan: ruangan,
          kategoriKeluhan,
          judulKeluhan,
          isiKeluhan,
          fotoKeluhanUrl: fotoUrl,
          status: "Ditinjau",
        })
        .returning();
      return json(
        {
          tiket: row.nomorTiket,
          email: row.email,
          emailTerkirim: true,
          id: row.id,
        },
        201,
      );
    } catch (e) {
      if ((e as { code?: string }).code === "23505") continue;
      throw e;
    }
  }
  throw new ApiError(500, "Gagal membuat nomor tiket, silakan coba lagi.");
}

/** Helper yang dipakai route handler & server pages. */
export async function fetchKeluhanView(
  ticketInput: string,
): Promise<KeluhanView | null> {
  const ticket = normalizeTicket(ticketInput);
  if (!ticket) return null;
  const rows = (await joinedQuery(eq(keluhan.nomorTiket, ticket)).limit(
    1,
  )) as JoinedRow[];
  return rows.length ? toView(rows[0]) : null;
}

async function getKeluhanByTicket(ticketParam: string) {
  const view = await fetchKeluhanView(decodeURIComponent(ticketParam));
  if (!view)
    throw new ApiError(404, "Nomor tiket tidak ditemukan. Periksa kembali nomor tiket Anda.");
  return json({ view });
}

async function submitRating(ticketParam: string, request: NextRequest) {
  const ticket = normalizeTicket(decodeURIComponent(ticketParam));
  let body: { rating?: unknown; komentar?: unknown };
  try {
    body = await request.json();
  } catch {
    throw new ApiError(400, "Body tidak valid.");
  }
  const rating = Number(body.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5)
    throw new ApiError(400, "Rating harus berupa angka 1 sampai 5.");
  const komentar =
    typeof body.komentar === "string" ? body.komentar.trim().slice(0, 500) : null;

  const [k] = await db
    .select()
    .from(keluhan)
    .where(eq(keluhan.nomorTiket, ticket))
    .limit(1);
  if (!k) throw new ApiError(404, "Nomor tiket tidak ditemukan.");
  const [resp] = await db
    .select()
    .from(responses)
    .where(eq(responses.keluhanId, k.id))
    .limit(1);
  if (!resp)
    throw new ApiError(
      409,
      "Keluhan belum direspons admin. Rating dapat diberikan setelah ada respons.",
    );
  if (resp.ratingKepuasan)
    throw new ApiError(409, "Rating sudah pernah diberikan untuk tiket ini.");

  await db
    .update(responses)
    .set({ ratingKepuasan: rating, komentarRating: komentar, updatedAt: new Date() })
    .where(eq(responses.id, resp.id));

  const rows = (await joinedQuery(eq(keluhan.id, k.id)).limit(1)) as JoinedRow[];
  return json({ view: toView(rows[0]) });
}

async function publicStats() {
  const [totalRow] = await db.select({ n: count() }).from(keluhan);
  const [selesaiRow] = await db
    .select({ n: count() })
    .from(keluhan)
    .where(eq(keluhan.status, "Selesai"));
  const [diprosesRow] = await db
    .select({ n: count() })
    .from(keluhan)
    .where(eq(keluhan.status, "Sedang Diproses"));
  const [avgRow] = await db
    .select({ avg: sql<number | null>`avg(${responses.ratingKepuasan})` })
    .from(responses)
    .where(isNotNull(responses.ratingKepuasan));
  return json({
    total: Number(totalRow?.n ?? 0),
    selesai: Number(selesaiRow?.n ?? 0),
    diproses: Number(diprosesRow?.n ?? 0),
    avgRating: avgRow?.avg ? Math.round(Number(avgRow.avg) * 10) / 10 : null,
  });
}

/* ================= FILES ================= */

async function serveFile(name: string) {
  if (!/^[\w][\w.-]*$/.test(name)) throw new ApiError(400, "Nama file tidak valid.");
  try {
    const filePath = path.join(UPLOAD_DIR, name);
    const buffer = await readFile(filePath);
    const ext = name.split(".").pop()?.toLowerCase();
    const mime =
      ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
    return new Response(buffer, {
      headers: {
        "Content-Type": mime,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    throw new ApiError(404, "File tidak ditemukan.");
  }
}

/* ================= ADMIN ================= */

async function adminLogin(request: NextRequest) {
  let body: { username?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    throw new ApiError(400, "Body tidak valid.");
  }
  const identifier = String(body.username ?? "").trim();
  const password = String(body.password ?? "");
  if (!identifier || !password)
    throw new ApiError(400, "Username dan password wajib diisi.");
  const rows = await db
    .select()
    .from(admins)
    .where(or(eq(admins.username, identifier), eq(admins.email, identifier)))
    .limit(1);
  const admin = rows[0];
  if (!admin || !verifyPassword(password, admin.password))
    throw new ApiError(401, "Username atau password salah.");
  if (!admin.isActive) throw new ApiError(403, "Akun Anda tidak aktif.");
  const token = signToken(admin);
  return json({ token, admin: sanitizeAdmin(admin) });
}

async function adminMe(request: NextRequest) {
  const admin = await requireAdmin(request);
  return json({ admin: sanitizeAdmin(admin) });
}

async function adminList(request: NextRequest) {
  await requireAdmin(request);
  const sp = request.nextUrl.searchParams;
  const scope = sp.get("scope") === "selesai" ? "selesai" : "masuk";
  const q = (sp.get("q") || "").trim();
  const status = sp.get("status") || "";
  const kategori = sp.get("kategori") || "";
  const ruangan = sp.get("ruangan") || "";
  const dateFrom = sp.get("from") || "";
  const dateTo = sp.get("to") || "";
  const sort = sp.get("sort") || "terbaru";
  const page = Math.max(1, Number(sp.get("page")) || 1);
  const pageSize = Math.min(50, Math.max(5, Number(sp.get("pageSize")) || 10));

  const conds: ReturnType<typeof eq>[] = [];
  if (scope === "selesai") {
    conds.push(eq(keluhan.status, "Selesai"));
  } else if (status && status !== "Semua") {
    if (!(STATUS_LIST as readonly string[]).includes(status))
      throw new ApiError(400, "Status tidak valid.");
    conds.push(eq(keluhan.status, status as StatusKeluhan));
  } else if (scope === "masuk" && (!status || status === "Semua")) {
    conds.push(inArray(keluhan.status, ["Ditinjau", "Sedang Diproses"]));
  }
  if (kategori && kategori !== "Semua") conds.push(eq(keluhan.kategoriKeluhan, kategori));
  if (ruangan && ruangan !== "Semua") conds.push(eq(keluhan.ruanganPelayanan, ruangan));
  if (q) {
    const like = `%${q}%`;
    conds.push(
      or(
        ilike(keluhan.namaLengkap, like),
        ilike(keluhan.nomorTiket, like),
        ilike(keluhan.judulKeluhan, like),
        ilike(keluhan.kategoriKeluhan, like),
      )!,
    );
  }
  if (dateFrom) {
    const d = new Date(dateFrom);
    if (!Number.isNaN(d.getTime())) conds.push(gte(keluhan.createdAt, d));
  }
  if (dateTo) {
    const d = new Date(dateTo);
    if (!Number.isNaN(d.getTime()))
      conds.push(lte(keluhan.createdAt, new Date(d.getTime() + 86399999)));
  }
  const where = conds.length ? and(...conds) : undefined;

  const order =
    sort === "tertua"
      ? asc(keluhan.createdAt)
      : sort === "az"
        ? asc(keluhan.namaLengkap)
        : desc(keluhan.createdAt);

  const [totalRow] = await db
    .select({ n: count() })
    .from(keluhan)
    .where(where);
  const total = Number(totalRow?.n ?? 0);

  const rows = (await joinedQuery(where)
    .orderBy(order)
    .limit(pageSize)
    .offset((page - 1) * pageSize)) as JoinedRow[];

  let avgRating: number | null = null;
  if (scope === "selesai") {
    const [agg] = await db
      .select({ avg: sql<number | null>`avg(${responses.ratingKepuasan})` })
      .from(responses)
      .innerJoin(keluhan, eq(keluhan.id, responses.keluhanId))
      .where(and(where ?? sql`1=1`, isNotNull(responses.ratingKepuasan)));
    avgRating = agg?.avg ? Math.round(Number(agg.avg) * 10) / 10 : null;
  }

  return json({
    items: rows.map(toView),
    meta: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
    avgRating,
  });
}

async function adminDetail(_request: NextRequest, id: string) {
  await requireAdmin(_request);
  if (!UUID_RE.test(id)) throw new ApiError(400, "ID keluhan tidak valid.");
  const rows = (await joinedQuery(eq(keluhan.id, id)).limit(1)) as JoinedRow[];
  if (rows.length === 0) throw new ApiError(404, "Keluhan tidak ditemukan.");
  return json({ view: toView(rows[0]) });
}

async function updateStatus(request: NextRequest, id: string) {
  await requireAdmin(request);
  if (!UUID_RE.test(id)) throw new ApiError(400, "ID keluhan tidak valid.");
  let body: { status?: unknown };
  try {
    body = await request.json();
  } catch {
    throw new ApiError(400, "Body tidak valid.");
  }
  const status = String(body.status ?? "");
  if (!(STATUS_LIST as readonly string[]).includes(status))
    throw new ApiError(400, "Status tidak valid.");
  const [existing] = await db.select().from(keluhan).where(eq(keluhan.id, id)).limit(1);
  if (!existing) throw new ApiError(404, "Keluhan tidak ditemukan.");
  await db
    .update(keluhan)
    .set(statusPatch(status as StatusKeluhan, existing))
    .where(eq(keluhan.id, id));
  const rows = (await joinedQuery(eq(keluhan.id, id)).limit(1)) as JoinedRow[];
  return json({ view: toView(rows[0]) });
}

async function respond(request: NextRequest, id: string) {
  const admin = await requireAdmin(request);
  if (!UUID_RE.test(id)) throw new ApiError(400, "ID keluhan tidak valid.");
  let data: FormData;
  try {
    data = await request.formData();
  } catch {
    throw new ApiError(400, "Data form tidak valid.");
  }
  const isiResponse = String(data.get("isiResponse") ?? "").trim().slice(0, 2000);
  if (isiResponse.length < 5)
    throw new ApiError(400, "Isi respons wajib diisi (min. 5 karakter).");
  let status = String(data.get("status") ?? "Selesai");
  if (!(STATUS_LIST as readonly string[]).includes(status)) status = "Selesai";

  const [existing] = await db.select().from(keluhan).where(eq(keluhan.id, id)).limit(1);
  if (!existing) throw new ApiError(404, "Keluhan tidak ditemukan.");

  const fotoUrl = await optionalUpload(data, "foto");

  const [existingResp] = await db
    .select()
    .from(responses)
    .where(eq(responses.keluhanId, id))
    .limit(1);
  if (existingResp) {
    await db
      .update(responses)
      .set({
        isiResponse,
        adminId: admin.id,
        fotoResponseUrl: fotoUrl ?? existingResp.fotoResponseUrl,
        updatedAt: new Date(),
      })
      .where(eq(responses.id, existingResp.id));
  } else {
    await db.insert(responses).values({
      keluhanId: id,
      adminId: admin.id,
      isiResponse,
      fotoResponseUrl: fotoUrl,
    });
  }

  await db
    .update(keluhan)
    .set(statusPatch(status as StatusKeluhan, existing))
    .where(eq(keluhan.id, id));

  const rows = (await joinedQuery(eq(keluhan.id, id)).limit(1)) as JoinedRow[];
  return json({
    view: toView(rows[0]),
    message: "Respons terkirim. Email notifikasi dikirim ke responden.",
  });
}

async function updateProfile(request: NextRequest) {
  const admin = await requireAdmin(request);
  let body: { namaLengkap?: unknown; email?: unknown; noTelepon?: unknown };
  try {
    body = await request.json();
  } catch {
    throw new ApiError(400, "Body tidak valid.");
  }
  const namaLengkap = String(body.namaLengkap ?? "").trim().slice(0, 100);
  const email = String(body.email ?? "").trim().slice(0, 120);
  const noTelepon = String(body.noTelepon ?? "").trim().slice(0, 20) || null;
  if (!namaLengkap) throw new ApiError(400, "Nama admin wajib diisi.");
  if (!EMAIL_RE.test(email)) throw new ApiError(400, "Format email tidak valid.");
  if (noTelepon && !PHONE_RE.test(noTelepon))
    throw new ApiError(400, "No. telepon harus 10-12 digit dan diawali angka 0.");
  try {
    const [updated] = await db
      .update(admins)
      .set({ namaLengkap, email, noTelepon, updatedAt: new Date() })
      .where(eq(admins.id, admin.id))
      .returning();
    return json({ admin: sanitizeAdmin(updated) });
  } catch (e) {
    if ((e as { code?: string }).code === "23505")
      throw new ApiError(409, "Email sudah digunakan akun lain.");
    throw e;
  }
}

async function changePassword(request: NextRequest) {
  const admin = await requireAdmin(request);
  let body: { passwordLama?: unknown; passwordBaru?: unknown };
  try {
    body = await request.json();
  } catch {
    throw new ApiError(400, "Body tidak valid.");
  }
  const lama = String(body.passwordLama ?? "");
  const baru = String(body.passwordBaru ?? "");
  if (!verifyPassword(lama, admin.password))
    throw new ApiError(400, "Password lama salah.");
  if (baru.length < 6)
    throw new ApiError(400, "Password baru minimal 6 karakter.");
  await db
    .update(admins)
    .set({ password: hashPassword(baru), updatedAt: new Date() })
    .where(eq(admins.id, admin.id));
  return json({ message: "Password berhasil diubah." });
}

/* ================= ADMIN STATS ================= */

async function adminStats(request: NextRequest) {
  await requireAdmin(request);
  const rows = await db
    .select({
      status: keluhan.status,
      jenisKelamin: keluhan.jenisKelamin,
      pendidikan: keluhan.pendidikan,
      ruanganPelayanan: keluhan.ruanganPelayanan,
      kategoriKeluhan: keluhan.kategoriKeluhan,
      createdAt: keluhan.createdAt,
      rating: responses.ratingKepuasan,
    })
    .from(keluhan)
    .leftJoin(responses, eq(responses.keluhanId, keluhan.id));

  const now = new Date();
  const total = rows.length;
  const ditinjau = rows.filter((r) => r.status === "Ditinjau").length;
  const diproses = rows.filter((r) => r.status === "Sedang Diproses").length;
  const selesai = rows.filter((r) => r.status === "Selesai").length;
  const rated = rows.filter((r) => r.rating != null);
  const avgRating = rated.length
    ? Math.round((rated.reduce((s, r) => s + (r.rating ?? 0), 0) / rated.length) * 10) /
      10
    : null;

  const bulanIni = rows.filter(
    (r) =>
      r.createdAt.getMonth() === now.getMonth() &&
      r.createdAt.getFullYear() === now.getFullYear(),
  ).length;
  const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const bulanLalu = rows.filter(
    (r) =>
      r.createdAt.getMonth() === lm.getMonth() &&
      r.createdAt.getFullYear() === lm.getFullYear(),
  ).length;
  const persenPerubahan =
    bulanLalu > 0
      ? Math.round(((bulanIni - bulanLalu) / bulanLalu) * 100)
      : null;

  const tally = (key: (r: (typeof rows)[number]) => string) => {
    const m = new Map<string, number>();
    for (const r of rows) m.set(key(r), (m.get(key(r)) || 0) + 1);
    return m;
  };

  const genderMap = tally((r) => r.jenisKelamin);
  const jenisKelamin = ["Laki-laki", "Perempuan"]
    .map((name) => ({ name, value: genderMap.get(name) || 0 }))
    .filter((g) => g.value > 0);

  const eduMap = tally((r) => r.pendidikan);
  const pendidikan = PENDIDIKAN_LIST.map((name) => ({
    name,
    value: eduMap.get(name) || 0,
  }));

  const roomMap = tally((r) => r.ruanganPelayanan);
  const ruangan = [...roomMap.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  const katMap = tally((r) => r.kategoriKeluhan);
  const kategori = [...katMap.entries()]
    .map(([name, value]) => ({
      name,
      value,
      color: KATEGORI_LIST.find((k) => k.nama === name)?.warna ?? "#64748B",
    }))
    .sort((a, b) => b.value - a.value);

  const hari = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
  const trend: DashboardStats["trend"] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const dayRows = rows.filter(
      (r) =>
        r.createdAt.getFullYear() === d.getFullYear() &&
        r.createdAt.getMonth() === d.getMonth() &&
        r.createdAt.getDate() === d.getDate(),
    );
    trend.push({
      label: `${hari[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}`,
      Ditinjau: dayRows.filter((r) => r.status === "Ditinjau").length,
      "Sedang Diproses": dayRows.filter((r) => r.status === "Sedang Diproses").length,
      Selesai: dayRows.filter((r) => r.status === "Selesai").length,
    });
  }

  const distribusi = [1, 2, 3, 4, 5].map((stars) => ({
    stars,
    count: rows.filter((r) => r.rating === stars).length,
  }));

  const terbaruRows = await db
    .select({
      nomorTiket: keluhan.nomorTiket,
      namaLengkap: keluhan.namaLengkap,
      kategoriKeluhan: keluhan.kategoriKeluhan,
      status: keluhan.status,
      createdAt: keluhan.createdAt,
    })
    .from(keluhan)
    .orderBy(desc(keluhan.createdAt))
    .limit(6);

  const stats: DashboardStats = {
    kpi: {
      total,
      ditinjau,
      diproses,
      selesai,
      avgRating,
      bulanIni,
      bulanLalu,
      persenPerubahan,
    },
    jenisKelamin,
    pendidikan,
    ruangan,
    kategori,
    trend,
    kepuasan: {
      avg: avgRating,
      totalRated: rated.length,
      distribusi,
    },
    terbaru: terbaruRows.map((t) => ({
      ...t,
      createdAt: t.createdAt.toISOString(),
    })),
  };
  return json(stats);
}

/* ================= SEED ================= */

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SEED_NAMES = [
  "Budi Santoso", "Siti Rahma", "Ahmad Wijaya", "Dewi Lestari", "Rudi Hartono",
  "Ani Suryani", "Joko Prasetyo", "Fitri Handayani", "Agus Salim", "Rina Marlina",
  "Hendra Gunawan", "Maya Sari", "Taufik Hidayat", "Lina Kartika", "Bayu Aji",
  "Nur Aini", "Rizky Ramadhan", "Putu Ayu", "Made Wirawan", "Lalu Muhammad",
  "Baiq Nurul", "Saprudin Hadi", "Zainab Wati", "Fajar Siddiq", "Intan Permatasari",
  "Yusuf Efendi", "Ratna Juwita", "Doni Kurniawan", "Sri Wahyuni", "Ilham Maulana",
];

const SEED_ROOMS: Array<[string, number]> = [
  ["IGD (Instalasi Gawat Darurat)", 18],
  ["Poliklinik", 16],
  ["Loket Pendaftaran", 12],
  ["Farmasi", 9],
  ["Paviliun Wijaya Kusuma", 7],
  ["Paviliun Kenanga", 6],
  ["Laboratorium", 5],
  ["Radiologi", 5],
  ["MNE (Maternal Neonatal Emergency)", 4],
  ["Instalasi Bedah Sentral (IBS)", 4],
  ["ICU", 3],
  ["Hemodialisa", 3],
  ["Klinik Rehab Medik", 3],
  ["Kantin / Koperasi Rumah Sakit", 2],
  ["Post Satpam", 2],
  ["Paviliun Tulip", 1],
];

const SEED_TITLES: Record<string, string[]> = {
  "Keluhan Pelayanan": [
    "Pelayanan lambat di loket",
    "Antrian tidak teratur",
    "Petugas kurang responsif",
    "Menunggu lama tanpa kepastian",
    "Alur layanan membingungkan",
  ],
  "Administrasi Rumah Sakit": [
    "Proses administrasi berbelit",
    "Dokumen persyaratan tidak jelas",
    "Kesalahan input data pasien",
    "Biaya administrasi tidak transparan",
    "Legalisir dokumen lambat",
  ],
  "Fasilitas Sarana Prasarana": [
    "Toilet kurang bersih",
    "AC ruangan tidak dingin",
    "Kursi ruang tunggu rusak",
    "Area parkir semrawut",
    "Lift sering macet",
  ],
  "Keluhan Medis": [
    "Dokter terlambat datang",
    "Penjelasan diagnosis kurang jelas",
    "Jadwal operasi mundur",
    "Hasil lab lama keluar",
    "Dosis obat tidak dijelaskan",
  ],
  "Keluhan Petugas Medis": [
    "Perawat kurang ramah",
    "Komunikasi dokter terburu-buru",
    "Petugas kurang sopan",
    "Kurangnya empati petugas",
    "Perawat lambat merespons bel",
  ],
};

const SEED_BODIES: Record<string, string[]> = {
  "Keluhan Pelayanan": [
    "Saat saya datang, antrian sangat panjang dan tidak ada petugas yang mengarahkan. Saya menunggu lebih dari dua jam tanpa informasi yang jelas. Mohon pelayanan dapat ditingkatkan agar pasien tidak terlantar.",
    "Petugas di bagian pelayanan terlihat sibuk mengobrol sementara banyak pasien menunggu. Mohon agar lebih responsif dan sigap dalam melayani pasien yang datang.",
    "Alur pelayanan tidak jelas, saya harus bolak-balik antar loket karena informasi yang berbeda-beda. Harap ada papan informasi atau petugas pengarah.",
  ],
  "Administrasi Rumah Sakit": [
    "Proses pendaftaran memakan waktu sangat lama karena persyaratan yang tidak diinformasikan sejak awal. Saya harus pulang untuk mengambil dokumen tambahan.",
    "Ada perbedaan biaya yang tercantum di kwitansi dengan informasi awal. Mohon transparansi biaya administrasi diperbaiki.",
    "Data pasien salah input sehingga proses klaim asuransi tertunda. Mohon ketelitian petugas administrasi ditingkatkan.",
  ],
  "Fasilitas Sarana Prasarana": [
    "Toilet di lantai dua sangat kotor dan tidak ada air. Kondisi ini tentu tidak layak untuk standar rumah sakit. Mohon segera dibersihkan dan dirawat.",
    "AC di ruang tunggu tidak berfungsi sehingga ruangan sangat panas. Banyak pasien lansia yang kepanasan saat menunggu.",
    "Kursi ruang tunggu banyak yang rusak dan area parkir tidak tertata. Mohon fasilitas diperbaiki demi kenyamanan pengunjung.",
  ],
  "Keluhan Medis": [
    "Dokter spesialis baru datang dua jam setelah jadwal praktik yang tertera. Pasien yang sudah menunggu dari pagi merasa dirugikan.",
    "Penjelasan mengenai diagnosis dan rencana pengobatan sangat minim. Kami sebagai keluarga pasien merasa bingung dan khawatir.",
    "Hasil pemeriksaan laboratorium baru keluar setelah tiga hari padahal diinformasikan satu hari. Mohon ketepatan waktu diperbaiki.",
  ],
  "Keluhan Petugas Medis": [
    "Perawat di ruangan berbicara dengan nada tinggi kepada pasien lansia. Mohon etika dan keramahan petugas lebih diperhatikan.",
    "Dokter memeriksa dengan sangat terburu-buru tanpa memberi kesempatan bertanya. Kami merasa keluhan tidak didengarkan dengan baik.",
    "Bel panggilan di kamar rawat inap beberapa kali tidak direspons dalam waktu lama. Mohon pengawasan jaga diperketat.",
  ],
};

const SEED_RESPONSES: Record<string, string[]> = {
  "Keluhan Pelayanan": [
    "Terima kasih atas masukan Anda. Kami telah berkoordinasi dengan bagian terkait untuk menambah petugas pengarah antrian dan memperbaiki sistem nomor antrian digital. Kami mohon maaf atas ketidaknyamanan yang terjadi.",
    "Mohon maaf atas pelayanan yang kurang memuaskan. Kami telah memberikan pembinaan kepada petugas terkait dan menambah jadwal pengawasan di jam sibuk.",
  ],
  "Administrasi Rumah Sakit": [
    "Terima kasih atas laporannya. Kami telah meninjau ulang prosedur administrasi dan memperbarui papan informasi persyaratan di loket serta website resmi. Mohon maaf atas ketidaknyamanan Anda.",
    "Kami memohon maaf atas kendala administrasi yang terjadi. Tim kami telah memperbaiki alur pendaftaran dan memberikan pelatihan ulang kepada petugas loket.",
  ],
  "Fasilitas Sarana Prasarana": [
    "Terima kasih atas informasinya. Tim sarana prasarana telah melakukan perbaikan dan pembersihan pada fasilitas yang dimaksud. Jadwal perawatan rutin juga telah kami perketat.",
    "Mohon maaf atas ketidaknyamanan Anda. Perbaikan fasilitas sedang/telah kami laksanakan dan akan dipantau secara berkala oleh tim teknis rumah sakit.",
  ],
  "Keluhan Medis": [
    "Kami memohon maaf atas keterlambatan yang terjadi. Komite Medik telah meninjau jadwal praktik dokter dan menetapkan kebijakan toleransi keterlambatan maksimal beserta notifikasi kepada pasien.",
    "Terima kasih atas masukannya. Kami telah menginstruksikan dokter penanggung jawab untuk memberikan edukasi yang lebih menyeluruh kepada pasien dan keluarga.",
  ],
  "Keluhan Petugas Medis": [
    "Kami memohon maaf yang sebesar-besarnya atas sikap petugas kami. Yang bersangkutan telah mendapat pembinaan dan kami tegaskan kembali standar pelayanan ramah pasien (service excellent).",
    "Terima kasih telah melaporkan. Kami telah melakukan pembinaan etika komunikasi kepada seluruh tim jaga dan menambah supervisi kepala ruangan.",
  ],
};

const SEED_RATING_COMMENTS = [
  "Terima kasih, responsnya cepat dan solutif.",
  "Cukup puas, semoga terus ditingkatkan.",
  "Respons baik namun tindak lanjut di lapangan perlu dipercepat.",
  "Sangat puas dengan penanganan keluhan ini.",
  "Sudah ada perbaikan yang terlihat.",
];

const DOMAINS = ["gmail.com", "yahoo.com", "outlook.com"];

async function seedDemo(_request: NextRequest) {
  const [existing] = await db.select({ n: count() }).from(keluhan);
  if (Number(existing?.n ?? 0) > 0) {
    return json({
      seeded: false,
      message: "Database sudah berisi data. Seed dilewati.",
      login: { username: "admin", password: "admin123" },
    });
  }

  // Admin
  let adminRows = await db.select().from(admins).limit(2);
  if (adminRows.length === 0) {
    adminRows = await db
      .insert(admins)
      .values([
        {
          username: "admin",
          email: "admin@rsudppp.go.id",
          password: hashPassword("admin123"),
          namaLengkap: "Administrator SIPEKA",
          noTelepon: "081901234567",
        },
        {
          username: "siti.nuraeni",
          email: "siti.nuraeni@rsudppp.go.id",
          password: hashPassword("admin123"),
          namaLengkap: "Siti Nuraeni, S.KM",
          noTelepon: "081802345678",
        },
      ])
      .returning();
  }

  const rng = mulberry32(20240115);
  const pick = <T,>(arr: T[]): T => arr[Math.floor(rng() * arr.length)];
  const weighted = <T,>(pairs: Array<[T, number]>): T => {
    const totalW = pairs.reduce((s, [, w]) => s + w, 0);
    let roll = rng() * totalW;
    for (const [item, w] of pairs) {
      roll -= w;
      if (roll <= 0) return item;
    }
    return pairs[pairs.length - 1][0];
  };

  const now = Date.now();
  type Draft = {
    createdAt: Date;
    namaLengkap: string;
    email: string;
    noTelepon: string;
    jenisKelamin: string;
    pendidikan: string;
    ruanganPelayanan: string;
    kategoriKeluhan: string;
    judulKeluhan: string;
    isiKeluhan: string;
  };

  const drafts: Draft[] = [];
  const N = 62;
  for (let i = 0; i < N; i++) {
    const daysAgo = Math.floor(Math.pow(rng(), 1.45) * 30);
    const d = new Date(now - daysAgo * 86400000);
    d.setHours(7 + Math.floor(rng() * 13), Math.floor(rng() * 60), 0, 0);
    const nama = pick(SEED_NAMES);
    const slug = nama.toLowerCase().replace(/[^a-z]+/g, ".");
    const kategori = weighted<string>([
      ["Keluhan Pelayanan", 28],
      ["Fasilitas Sarana Prasarana", 22],
      ["Keluhan Petugas Medis", 18],
      ["Keluhan Medis", 17],
      ["Administrasi Rumah Sakit", 15],
    ]);
    drafts.push({
      createdAt: d,
      namaLengkap: nama,
      email: `${slug}@${pick(DOMAINS)}`,
      noTelepon: `08${String(Math.floor(rng() * 1e10)).padStart(10, "0").slice(0, 10)}`,
      jenisKelamin: rng() < 0.42 ? "Laki-laki" : "Perempuan",
      pendidikan: weighted<string>([
        ["SD", 9],
        ["SMP", 14],
        ["SMA", 28],
        ["D3", 10],
        ["S1", 26],
        ["S2", 9],
        ["S3", 4],
      ]),
      ruanganPelayanan: weighted(SEED_ROOMS),
      kategoriKeluhan: kategori,
      judulKeluhan: pick(SEED_TITLES[kategori]),
      isiKeluhan: pick(SEED_BODIES[kategori]),
    });
  }
  drafts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const inserted: Array<{ id: string; draft: Draft; status: StatusKeluhan }> = [];
  const perDay = new Map<string, number>();
  for (let i = 0; i < drafts.length; i++) {
    const draft = drafts[i];
    const status: StatusKeluhan =
      i < 12 ? "Ditinjau" : i < 22 ? "Sedang Diproses" : "Selesai";
    const dateKey = `${draft.createdAt.getFullYear()}${String(
      draft.createdAt.getMonth() + 1,
    ).padStart(2, "0")}${String(draft.createdAt.getDate()).padStart(2, "0")}`;
    const seq = (perDay.get(dateKey) ?? 0) + 1;
    perDay.set(dateKey, seq);
    const nomorTiket = `SIPEKA-${dateKey}${String(10000 + seq * 7 + (i % 9))}`;
    const diprosesAt =
      status === "Ditinjau"
        ? null
        : new Date(Math.min(now, draft.createdAt.getTime() + 2 * 3600000));
    const selesaiAt =
      status === "Selesai"
        ? new Date(Math.min(now, draft.createdAt.getTime() + (20 + rng() * 30) * 3600000))
        : null;
    const [row] = await db
      .insert(keluhan)
      .values({
        nomorTiket,
        ...draft,
        status,
        statusDiprosesAt: diprosesAt,
        statusSelesaiAt: selesaiAt,
        createdAt: draft.createdAt,
        updatedAt: selesaiAt ?? diprosesAt ?? draft.createdAt,
      })
      .returning();
    inserted.push({ id: row.id, draft, status });
  }

  let responsesMade = 0;
  for (const item of inserted) {
    if (item.status !== "Selesai") continue;
    const created = new Date(
      Math.min(
        now,
        item.draft.createdAt.getTime() + (4 + rng() * 26) * 3600000,
      ),
    );
    const admin = adminRows[responsesMade % adminRows.length];
    const hasRating = rng() < 0.72;
    const rating = hasRating
      ? weighted<number>([
          [2, 4],
          [3, 10],
          [4, 32],
          [5, 54],
        ])
      : null;
    await db.insert(responses).values({
      keluhanId: item.id,
      adminId: admin.id,
      isiResponse: pick(SEED_RESPONSES[item.draft.kategoriKeluhan]),
      ratingKepuasan: rating,
      komentarRating: rating ? (rng() < 0.7 ? pick(SEED_RATING_COMMENTS) : null) : null,
      createdAt: created,
      updatedAt: created,
    });
    responsesMade++;
  }

  return json({
    seeded: true,
    tickets: inserted.length,
    responses: responsesMade,
    login: { username: "admin", password: "admin123" },
  });
}

/* ================= ROUTER ================= */

export async function apiRouter(request: NextRequest, slug: string[]) {
  try {
    const method = request.method;
    const [s0, s1, s2, s3] = slug;

    if (method === "GET" && s0 === "files" && s1 && !s2) return serveFile(s1);
    if (method === "GET" && s0 === "public" && s1 === "stats" && !s2)
      return publicStats();
    if (method === "POST" && s0 === "seed" && !s1) return seedDemo(request);

    if (s0 === "keluhan") {
      if (method === "POST" && !s1) return createKeluhan(request);
      if (method === "GET" && s1 && !s2) return getKeluhanByTicket(s1);
      if (method === "POST" && s1 && s2 === "rating" && !s3)
        return submitRating(s1, request);
    }

    if (s0 === "admin") {
      if (method === "POST" && s1 === "login" && !s2) return adminLogin(request);
      if (method === "GET" && s1 === "me" && !s2) return adminMe(request);
      if (method === "GET" && s1 === "stats" && !s2) return adminStats(request);
      if (method === "PUT" && s1 === "profile" && !s2) return updateProfile(request);
      if (method === "POST" && s1 === "password" && !s2)
        return changePassword(request);
      if (s1 === "keluhan") {
        if (method === "GET" && !s2) return adminList(request);
        if (method === "GET" && s2 && !s3) return adminDetail(request, s2);
        if (method === "PATCH" && s2 && !s3) return updateStatus(request, s2);
        if (method === "POST" && s2 && s3 === "respond")
          return respond(request, s2);
      }
    }

    if (!s0 && method === "GET") return json({ ok: true, app: "SIPEKA API" });
    throw new ApiError(404, "Endpoint tidak ditemukan.");
  } catch (e) {
    if (e instanceof ApiError) return json({ error: e.message }, e.status);
    console.error("SIPEKA API error:", e);
    return json({ error: "Terjadi kesalahan pada server." }, 500);
  }
}
