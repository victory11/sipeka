import "server-only";

import crypto from "node:crypto";
import path from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import { v2 as cloudinary } from "cloudinary";

// Konfigurasi Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

import { and, asc, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  admins,
  complaintCategories,
  complaintEvents,
  complaintResponses,
  complaints,
  serviceRooms,
  type AdminRow,
  type ComplaintCategoryRow,
  type ComplaintEventRow,
  type ComplaintResponseRow,
  type ComplaintRow,
  type ServiceRoomRow,
} from "@/db/schema";
import {
  APP_NAME,
  COMPLAINT_CATEGORY_OPTIONS,
  COMPLAINT_STATUSES,
  DEMO_ADMIN_CREDENTIALS,
  EDUCATION_OPTIONS,
  GENDER_OPTIONS,
  ROOM_OPTIONS,
  type ComplaintCategory,
  type ComplaintStatus,
  type EducationLevel,
  type Gender,
  type RoomOption,
} from "@/lib/constants";
import { hashPassword, verifyPassword } from "@/lib/auth";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const MAX_UPLOAD_SIZE = 5 * 1024 * 1024;

export type ComplaintFormInput = {
  namaLengkap: string;
  email: string;
  noTelepon: string;
  jenisKelamin: Gender;
  pendidikan: EducationLevel;
  ruanganPelayanan: string;
  kategoriKeluhan: ComplaintCategory;
  judulKeluhan: string;
  isiKeluhan: string;
  fotoKeluhanUrl?: string | null;
};

export type ComplaintValidationResult =
  | { ok: true; data: ComplaintFormInput }
  | { ok: false; errors: Partial<Record<keyof ComplaintFormInput, string>> };

export type AdminComplaintListItem = {
  complaint: ComplaintRow;
  response: ComplaintResponseRow | null;
  admin?: AdminRow | null;
};

export type ComplaintTimelineItem = {
  status: ComplaintStatus;
  label: string;
  date: string;
  note?: string | null;
};

export type ComplaintDetail = {
  complaint: ComplaintRow;
  response: ComplaintResponseRow | null;
  timeline: ComplaintTimelineItem[];
};

export type DashboardMetrics = {
  total: number;
  ditinjau: number;
  diproses: number;
  selesai: number;
  averageRating: number;
  growthPercent: number;
};

export type DashboardChartSeries = {
  jenisKelamin: { label: Gender; value: number; percent: number }[];
  pendidikan: { label: EducationLevel; value: number }[];
  ruangan: { label: string; value: number }[];
  kategori: { label: ComplaintCategory; value: number; icon: string }[];
  trend: {
    label: string;
    total: number;
    ditinjau: number;
    diproses: number;
    selesai: number;
  }[];
};

export type DashboardData = {
  metrics: DashboardMetrics;
  charts: DashboardChartSeries;
  recentComplaints: AdminComplaintListItem[];
  finishedComplaints: AdminComplaintListItem[];
  topRooms: { label: string; value: number }[];
  categoryTotals: { label: ComplaintCategory; value: number; icon: string }[];
};

export type PublicHomeData = {
  complaintCount: number;
  categoryCards: typeof COMPLAINT_CATEGORY_OPTIONS;
  recentTickets: string[];
};

export type ComplaintFilters = {
  q?: string;
  status?: ComplaintStatus | "Semua";
  kategori?: ComplaintCategory | "Semua";
  ruangan?: string | "Semua";
  page?: number;
  pageSize?: number;
};

export type ComplaintListResponse = {
  items: AdminComplaintListItem[];
  total: number;
  page: number;
  pageSize: number;
};

function normalizeText(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function stripUnsafeText(value: string) {
  return normalizeText(value.replace(/[<>]/g, ""));
}

function normalizePhone(value: string) {
  return value.replace(/\D/g, "");
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone: string) {
  return /^\d{10,12}$/.test(phone);
}

function makePlaceholderImage(seed: string) {
  const accent = ["1E40AF", "059669", "F59E0B", "DC2626", "7C3AED"][seed.length % 5];
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
      <defs>
        <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
          <stop stop-color="#${accent}" offset="0%" />
          <stop stop-color="#0F172A" offset="100%" />
        </linearGradient>
      </defs>
      <rect width="1200" height="800" rx="48" fill="url(#g)" />
      <circle cx="980" cy="160" r="120" fill="rgba(255,255,255,0.08)" />
      <circle cx="180" cy="620" r="180" fill="rgba(255,255,255,0.07)" />
      <text x="80" y="220" fill="#ffffff" font-size="72" font-family="Inter, Arial, sans-serif" font-weight="700">SIPEKA</text>
      <text x="80" y="320" fill="#E2E8F0" font-size="36" font-family="Inter, Arial, sans-serif">${seed}</text>
      <rect x="80" y="420" width="320" height="28" rx="14" fill="rgba(255,255,255,0.28)" />
      <rect x="80" y="470" width="540" height="28" rx="14" fill="rgba(255,255,255,0.18)" />
      <rect x="80" y="520" width="440" height="28" rx="14" fill="rgba(255,255,255,0.18)" />
    </svg>`;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

export function formatDateTime(date: Date | string | null | undefined) {
  if (!date) return "-";
  const value = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export function formatDateOnly(date: Date | string | null | undefined) {
  if (!date) return "-";
  const value = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(value);
}

export function formatStatusLabel(status: ComplaintStatus) {
  return status;
}

export function createTicketNumber(date = new Date()) {
  const year = date.getFullYear().toString();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const sequence = String(crypto.randomInt(0, 99999)).padStart(5, "0");
  return `SIPEKA-${year}${month}${day}${sequence}`;
}

export function validateComplaintPayload(input: Record<string, string | undefined>): ComplaintValidationResult {
  const errors: Partial<Record<keyof ComplaintFormInput, string>> = {};

  const namaLengkap = stripUnsafeText(input.namaLengkap ?? "");
  const email = stripUnsafeText(input.email ?? "").toLowerCase();
  const noTelepon = normalizePhone(input.noTelepon ?? "");
  const jenisKelamin = stripUnsafeText(input.jenisKelamin ?? "") as Gender;
  const pendidikan = stripUnsafeText(input.pendidikan ?? "") as EducationLevel;
  const ruanganPelayanan = stripUnsafeText(input.ruanganPelayanan ?? "");
  const kategoriKeluhan = stripUnsafeText(input.kategoriKeluhan ?? "") as ComplaintCategory;
  const judulKeluhan = stripUnsafeText(input.judulKeluhan ?? "");
  const isiKeluhan = normalizeText(input.isiKeluhan ?? "");

  if (!namaLengkap) errors.namaLengkap = "Nama lengkap wajib diisi.";
  else if (namaLengkap.length > 100) errors.namaLengkap = "Nama lengkap maksimal 100 karakter.";

  if (!email) errors.email = "Email wajib diisi.";
  else if (!isValidEmail(email)) errors.email = "Format email tidak valid.";

  if (!noTelepon) errors.noTelepon = "No. telepon wajib diisi.";
  else if (!isValidPhone(noTelepon)) errors.noTelepon = "No. telepon harus 10-12 digit angka.";

  if (!GENDER_OPTIONS.includes(jenisKelamin)) errors.jenisKelamin = "Jenis kelamin wajib dipilih.";
  if (!EDUCATION_OPTIONS.includes(pendidikan)) errors.pendidikan = "Pendidikan terakhir wajib dipilih.";

  if (!ruanganPelayanan) errors.ruanganPelayanan = "Ruangan pelayanan wajib dipilih.";
  if (!kategoriKeluhan || !COMPLAINT_CATEGORY_OPTIONS.some((item) => item.label === kategoriKeluhan)) {
    errors.kategoriKeluhan = "Kategori keluhan wajib dipilih.";
  }

  if (!judulKeluhan) errors.judulKeluhan = "Judul keluhan wajib diisi.";
  else if (judulKeluhan.length > 100) errors.judulKeluhan = "Judul keluhan maksimal 100 karakter.";

  if (!isiKeluhan) errors.isiKeluhan = "Isi keluhan wajib diisi.";
  else if (isiKeluhan.length > 2000) errors.isiKeluhan = "Isi keluhan maksimal 2000 karakter.";

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: {
      namaLengkap,
      email,
      noTelepon,
      jenisKelamin,
      pendidikan,
      ruanganPelayanan,
      kategoriKeluhan,
      judulKeluhan,
      isiKeluhan,
    },
  };
}

export async function saveUploadedImage(file: File | null | undefined, prefix: string) {
  if (!file || file.size === 0) {
    return null;
  }

  if (file.size > MAX_UPLOAD_SIZE) {
    throw new Error("Ukuran file maksimal 5MB.");
  }

  const validMimeTypes = ["image/jpeg", "image/jpg", "image/png"];
  if (!validMimeTypes.includes(file.type)) {
    throw new Error("Format file must be JPG, JPEG, or PNG.");
  }

  // Gunakan Cloudinary jika kredensial tersedia (Wajib untuk Vercel)
  if (process.env.CLOUDINARY_CLOUD_NAME) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { 
            folder: `sipeka/${prefix}`,
            resource_type: "auto" 
          }, 
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(buffer);
      });

      return (result as any).secure_url;
    } catch (err) {
      console.error("Cloudinary upload failed:", err);
      // Jika di production, kita lempar error agar user tahu upload gagal
      if (process.env.NODE_ENV === "production") throw new Error("Gagal mengunggah foto ke Cloud.");
    }
  }

  // Fallback ke penyimpanan lokal (Hanya untuk dev lokal, bukan Vercel)
  if (process.env.NODE_ENV !== "production") {
    try {
      await mkdir(UPLOAD_DIR, { recursive: true });
      const ext = file.type === "image/png" ? ".png" : ".jpg";
      const safePrefix = prefix.replace(/[^a-z0-9_-]/gi, "-");
      const fileName = `${safePrefix}-${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`;
      const filePath = path.join(UPLOAD_DIR, fileName);
      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(filePath, buffer);
      return `/uploads/${fileName}`;
    } catch (err) {
      console.error("Local save failed:", err);
      return null;
    }
  }

  return null;
}

export async function ensureSeedData() {
  const existingAdmin = await db.select({ id: admins.id }).from(admins).limit(1);
  if (existingAdmin.length === 0) {
    await db.insert(admins).values({
      username: DEMO_ADMIN_CREDENTIALS.username,
      email: DEMO_ADMIN_CREDENTIALS.email,
      password: hashPassword(DEMO_ADMIN_CREDENTIALS.password),
      namaLengkap: DEMO_ADMIN_CREDENTIALS.nama_lengkap,
      noTelepon: DEMO_ADMIN_CREDENTIALS.no_telepon,
      avatarUrl: null,
      isActive: true,
    });
  }

  const existingRooms = await db.select({ id: serviceRooms.id }).from(serviceRooms).limit(1);
  if (existingRooms.length === 0) {
    await db.insert(serviceRooms).values(
      ROOM_OPTIONS.map((room) => ({
        namaRuangan: room,
        kode: room.slice(0, 8).toUpperCase().replace(/[^A-Z0-9]/g, ""),
        isActive: true,
      })),
    );
  }

  const existingCategories = await db.select({ id: complaintCategories.id }).from(complaintCategories).limit(1);
  if (existingCategories.length === 0) {
    await db.insert(complaintCategories).values(
      COMPLAINT_CATEGORY_OPTIONS.map((category) => ({
        namaKategori: category.label,
        deskripsi: category.description,
        icon: category.icon,
        isActive: true,
      })),
    );
  }

  const existingComplaint = await db.select({ id: complaints.id }).from(complaints).limit(1);
  if (existingComplaint.length === 0) {
    const adminRow = await db.query.admins.findFirst({
      where: eq(admins.username, DEMO_ADMIN_CREDENTIALS.username),
    });

    const sampleData: Array<{
      complaint: Omit<ComplaintFormInput, "fotoKeluhanUrl"> & { nomorTiket: string; status: ComplaintStatus; createdAt: Date; updatedAt: Date; fotoKeluhanUrl?: string | null };
      response?: {
        isiResponse: string;
        fotoResponseUrl?: string | null;
        ratingKepuasan?: number | null;
        komentarRating?: string | null;
        status: ComplaintStatus;
        responseAt: Date;
      };
      events: { status: ComplaintStatus; catatan?: string | null; createdAt: Date }[];
    }> = [
      {
        complaint: {
          nomorTiket: "SIPEKA-20240115123456",
          namaLengkap: "Budi Santoso",
          email: "budi@email.com",
          noTelepon: "081234567890",
          jenisKelamin: "Laki-laki",
          pendidikan: "S1",
          ruanganPelayanan: "IGD (Instalasi Gawat Darurat)",
          kategoriKeluhan: "Keluhan Pelayanan",
          judulKeluhan: "Pelayanan Lambat di Loket Pendaftaran",
          isiKeluhan: "Saat mendaftar di loket, antrian sangat panjang dan petugas terlihat kewalahan. Mohon penambahan petugas pada jam sibuk.",
          fotoKeluhanUrl: makePlaceholderImage("Pelayanan loket IGD"),
          status: "Selesai",
          createdAt: new Date(Date.now() - 3 * 86400000),
          updatedAt: new Date(Date.now() - 2 * 86400000),
        },
        response: {
          isiResponse: "Terima kasih atas masukannya. Tim kami sudah berkoordinasi dengan instalasi terkait untuk menambah alur pelayanan pada jam sibuk.",
          fotoResponseUrl: makePlaceholderImage("Tindak lanjut loket"),
          ratingKepuasan: 5,
          komentarRating: "Respon cepat dan jelas.",
          status: "Selesai",
          responseAt: new Date(Date.now() - 2 * 86400000 + 2 * 3600000),
        },
        events: [
          { status: "Ditinjau", catatan: "Keluhan diterima", createdAt: new Date(Date.now() - 3 * 86400000 + 3600000) },
          { status: "Sedang Diproses", catatan: "Diteruskan ke bagian loket", createdAt: new Date(Date.now() - 3 * 86400000 + 4 * 3600000) },
          { status: "Selesai", catatan: "Respons telah dikirim", createdAt: new Date(Date.now() - 2 * 86400000 + 2 * 3600000) },
        ],
      },
      {
        complaint: {
          nomorTiket: "SIPEKA-20240114001234",
          namaLengkap: "Siti Rahma",
          email: "siti@email.com",
          noTelepon: "081234567891",
          jenisKelamin: "Perempuan",
          pendidikan: "D3",
          ruanganPelayanan: "Poliklinik",
          kategoriKeluhan: "Fasilitas Sarana Prasarana",
          judulKeluhan: "Toilet di Area Poliklinik Kurang Bersih",
          isiKeluhan: "Kondisi toilet di dekat poliklinik perlu perawatan lebih rutin karena bau dan lantai licin.",
          fotoKeluhanUrl: makePlaceholderImage("Toilet poliklinik"),
          status: "Sedang Diproses",
          createdAt: new Date(Date.now() - 2 * 86400000),
          updatedAt: new Date(Date.now() - 86400000),
        },
        events: [
          { status: "Ditinjau", catatan: "Menunggu verifikasi", createdAt: new Date(Date.now() - 2 * 86400000 + 2 * 3600000) },
          { status: "Sedang Diproses", catatan: "Diteruskan ke housekeeping", createdAt: new Date(Date.now() - 86400000 + 2 * 3600000) },
        ],
      },
      {
        complaint: {
          nomorTiket: "SIPEKA-20240113005678",
          namaLengkap: "Ahmad Wijaya",
          email: "ahmad@email.com",
          noTelepon: "081234567892",
          jenisKelamin: "Laki-laki",
          pendidikan: "SMA",
          ruanganPelayanan: "Rawat Inap",
          kategoriKeluhan: "Keluhan Medis",
          judulKeluhan: "Informasi Tindakan Medis Kurang Jelas",
          isiKeluhan: "Keluarga pasien merasa perlu penjelasan lebih rinci mengenai rencana tindakan medis yang akan dilakukan.",
          fotoKeluhanUrl: null,
          status: "Ditinjau",
          createdAt: new Date(Date.now() - 1 * 86400000),
          updatedAt: new Date(Date.now() - 1 * 86400000),
        },
        events: [
          { status: "Ditinjau", catatan: "Keluhan baru diterima", createdAt: new Date(Date.now() - 1 * 86400000 + 2 * 3600000) },
        ],
      },
      {
        complaint: {
          nomorTiket: "SIPEKA-20240112007890",
          namaLengkap: "Ani Suryani",
          email: "ani@email.com",
          noTelepon: "081234567893",
          jenisKelamin: "Perempuan",
          pendidikan: "S1",
          ruanganPelayanan: "Farmasi",
          kategoriKeluhan: "Administrasi Rumah Sakit",
          judulKeluhan: "Antrian Pengambilan Obat Terlalu Lama",
          isiKeluhan: "Waktu tunggu pengambilan obat cukup lama terutama saat jam pulang rawat jalan.",
          fotoKeluhanUrl: null,
          status: "Selesai",
          createdAt: new Date(Date.now() - 4 * 86400000),
          updatedAt: new Date(Date.now() - 3 * 86400000),
        },
        response: {
          isiResponse: "Kami sudah menyesuaikan pembagian shift untuk mempercepat pelayanan farmasi pada jam padat.",
          fotoResponseUrl: null,
          ratingKepuasan: 4,
          komentarRating: "Sudah membaik.",
          status: "Selesai",
          responseAt: new Date(Date.now() - 3 * 86400000 + 3 * 3600000),
        },
        events: [
          { status: "Ditinjau", catatan: "Diterima sistem", createdAt: new Date(Date.now() - 4 * 86400000 + 3600000) },
          { status: "Sedang Diproses", catatan: "Dikaji farmasi", createdAt: new Date(Date.now() - 4 * 86400000 + 4 * 3600000) },
          { status: "Selesai", catatan: "Diselesaikan admin", createdAt: new Date(Date.now() - 3 * 86400000 + 3 * 3600000) },
        ],
      },
      {
        complaint: {
          nomorTiket: "SIPEKA-20240111003456",
          namaLengkap: "Rudi Hartono",
          email: "rudi@email.com",
          noTelepon: "081234567894",
          jenisKelamin: "Laki-laki",
          pendidikan: "D3",
          ruanganPelayanan: "Laboratorium",
          kategoriKeluhan: "Keluhan Petugas Medis",
          judulKeluhan: "Komunikasi Petugas Laboratorium Kurang Ramah",
          isiKeluhan: "Petugas laboratorium sebaiknya memberikan penjelasan yang lebih ramah kepada pasien lanjut usia.",
          fotoKeluhanUrl: makePlaceholderImage("Lab service"),
          status: "Sedang Diproses",
          createdAt: new Date(Date.now() - 5 * 86400000),
          updatedAt: new Date(Date.now() - 4 * 86400000),
        },
        events: [
          { status: "Ditinjau", catatan: "Menunggu tindakan", createdAt: new Date(Date.now() - 5 * 86400000 + 2 * 3600000) },
          { status: "Sedang Diproses", catatan: "Koordinasi dengan kepala laboratorium", createdAt: new Date(Date.now() - 4 * 86400000 + 4 * 3600000) },
        ],
      },
      {
        complaint: {
          nomorTiket: "SIPEKA-20240110001111",
          namaLengkap: "Lina Marlina",
          email: "lina@email.com",
          noTelepon: "081234567895",
          jenisKelamin: "Perempuan",
          pendidikan: "S2",
          ruanganPelayanan: "Radiologi",
          kategoriKeluhan: "Keluhan Pelayanan",
          judulKeluhan: "Informasi Jadwal Radiologi Tidak Konsisten",
          isiKeluhan: "Jadwal pemeriksaan berubah tanpa pemberitahuan yang jelas sehingga pasien menunggu lebih lama.",
          fotoKeluhanUrl: null,
          status: "Ditinjau",
          createdAt: new Date(Date.now() - 6 * 86400000),
          updatedAt: new Date(Date.now() - 6 * 86400000),
        },
        events: [{ status: "Ditinjau", catatan: "Tercatat di sistem", createdAt: new Date(Date.now() - 6 * 86400000 + 2 * 3600000) }],
      },
      {
        complaint: {
          nomorTiket: "SIPEKA-20240109002222",
          namaLengkap: "Dewi Anggraini",
          email: "dewi@email.com",
          noTelepon: "081234567896",
          jenisKelamin: "Perempuan",
          pendidikan: "S1",
          ruanganPelayanan: "ICU",
          kategoriKeluhan: "Fasilitas Sarana Prasarana",
          judulKeluhan: "Kenyamanan Ruang Tunggu Perlu Ditingkatkan",
          isiKeluhan: "Area ruang tunggu keluarga pasien perlu ventilasi yang lebih baik dan kursi tambahan.",
          fotoKeluhanUrl: makePlaceholderImage("Ruang tunggu ICU"),
          status: "Selesai",
          createdAt: new Date(Date.now() - 7 * 86400000),
          updatedAt: new Date(Date.now() - 6 * 86400000),
        },
        response: {
          isiResponse: "Terima kasih, saran Anda sudah kami teruskan ke bagian sarana dan prasarana untuk perbaikan bertahap.",
          fotoResponseUrl: null,
          ratingKepuasan: 4,
          komentarRating: "Semoga segera diperbaiki.",
          status: "Selesai",
          responseAt: new Date(Date.now() - 6 * 86400000 + 5 * 3600000),
        },
        events: [
          { status: "Ditinjau", catatan: "Keluhan diterima", createdAt: new Date(Date.now() - 7 * 86400000 + 2 * 3600000) },
          { status: "Sedang Diproses", catatan: "Disurvei petugas", createdAt: new Date(Date.now() - 7 * 86400000 + 5 * 3600000) },
          { status: "Selesai", catatan: "Respons diberikan", createdAt: new Date(Date.now() - 6 * 86400000 + 5 * 3600000) },
        ],
      },
      {
        complaint: {
          nomorTiket: "SIPEKA-20240108003333",
          namaLengkap: "Fajar Pratama",
          email: "fajar@email.com",
          noTelepon: "081234567897",
          jenisKelamin: "Laki-laki",
          pendidikan: "SMA",
          ruanganPelayanan: "Loket Pendaftaran",
          kategoriKeluhan: "Administrasi Rumah Sakit",
          judulKeluhan: "Proses Pendaftaran Membingungkan",
          isiKeluhan: "Pasien baru membutuhkan alur pendaftaran yang lebih jelas dan petunjuk yang mudah dipahami.",
          fotoKeluhanUrl: null,
          status: "Selesai",
          createdAt: new Date(Date.now() - 8 * 86400000),
          updatedAt: new Date(Date.now() - 7 * 86400000),
        },
        response: {
          isiResponse: "Kami sudah menambahkan petunjuk alur pendaftaran pada area loket dan media informasi internal.",
          fotoResponseUrl: null,
          ratingKepuasan: 5,
          komentarRating: "Sangat membantu.",
          status: "Selesai",
          responseAt: new Date(Date.now() - 7 * 86400000 + 4 * 3600000),
        },
        events: [
          { status: "Ditinjau", catatan: "Tersimpan", createdAt: new Date(Date.now() - 8 * 86400000 + 3600000) },
          { status: "Sedang Diproses", catatan: "Diproses admin", createdAt: new Date(Date.now() - 8 * 86400000 + 4 * 3600000) },
          { status: "Selesai", catatan: "Keluhan ditutup", createdAt: new Date(Date.now() - 7 * 86400000 + 4 * 3600000) },
        ],
      },
    ];

    for (const sample of sampleData) {
      const complaintRow = await db
        .insert(complaints)
        .values({
          nomorTiket: sample.complaint.nomorTiket,
          namaLengkap: sample.complaint.namaLengkap,
          email: sample.complaint.email,
          noTelepon: sample.complaint.noTelepon,
          jenisKelamin: sample.complaint.jenisKelamin,
          pendidikan: sample.complaint.pendidikan,
          ruanganPelayanan: sample.complaint.ruanganPelayanan,
          kategoriKeluhan: sample.complaint.kategoriKeluhan,
          judulKeluhan: sample.complaint.judulKeluhan,
          isiKeluhan: sample.complaint.isiKeluhan,
          fotoKeluhanUrl: sample.complaint.fotoKeluhanUrl ?? null,
          status: sample.complaint.status,
          createdAt: sample.complaint.createdAt,
          updatedAt: sample.complaint.updatedAt,
        })
        .returning();

      if (complaintRow[0]) {
        const complaintId = complaintRow[0].id;
        for (const event of sample.events) {
          await db.insert(complaintEvents).values({
            keluhanId: complaintId,
            status: event.status,
            catatan: event.catatan ?? null,
            adminId: adminRow?.id ?? null,
            createdAt: event.createdAt,
          });
        }

        if (sample.response && adminRow) {
          await db.insert(complaintResponses).values({
            keluhanId: complaintId,
            adminId: adminRow.id,
            isiResponse: sample.response.isiResponse,
            fotoResponseUrl: sample.response.fotoResponseUrl ?? null,
            ratingKepuasan: sample.response.ratingKepuasan ?? null,
            komentarRating: sample.response.komentarRating ?? null,
            createdAt: sample.response.responseAt,
            updatedAt: sample.response.responseAt,
          });
        }
      }
    }
  }
}

function complaintToTimeline(
  events: ComplaintEventRow[],
  complaint: ComplaintRow,
  response: ComplaintResponseRow | null,
): ComplaintTimelineItem[] {
  const mapLabel = (status: ComplaintStatus) =>
    status === "Ditinjau" ? "Ditinjau" : status === "Sedang Diproses" ? "Sedang Diproses" : "Selesai";

  const history = [...events]
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    .map((event) => ({
      status: event.status,
      label: mapLabel(event.status),
      date: formatDateTime(event.createdAt),
      note: event.catatan,
    }));

  if (history.length === 0) {
    history.push({
      status: complaint.status,
      label: mapLabel(complaint.status),
      date: formatDateTime(complaint.createdAt),
      note: "Keluhan diterima",
    });
  }

  if (response && complaint.status === "Selesai" && !history.some((item) => item.status === "Selesai")) {
    history.push({
      status: "Selesai",
      label: "Selesai",
      date: formatDateTime(response.createdAt),
      note: "Respons admin telah dikirim",
    });
  }

  return history;
}

export function getProgressLabel(status: ComplaintStatus) {
  if (status === "Ditinjau") return "Menunggu tinjauan admin";
  if (status === "Sedang Diproses") return "Sedang diproses oleh admin";
  return "Keluhan sudah selesai ditangani";
}

export function getStatusTone(status: ComplaintStatus) {
  if (status === "Ditinjau") return "yellow";
  if (status === "Sedang Diproses") return "orange";
  return "green";
}

export function getComplaintCategoryIcon(label: ComplaintCategory) {
  return COMPLAINT_CATEGORY_OPTIONS.find((item) => item.label === label)?.icon ?? "⭐";
}

export async function createComplaint(input: ComplaintFormInput, photoFile?: File | null) {
  const fotoKeluhanUrl = photoFile ? await saveUploadedImage(photoFile, "keluhan") : input.fotoKeluhanUrl ?? null;
  const nomorTiket = createTicketNumber();

  const [row] = await db
    .insert(complaints)
    .values({
      nomorTiket,
      namaLengkap: input.namaLengkap,
      email: input.email,
      noTelepon: input.noTelepon,
      jenisKelamin: input.jenisKelamin,
      pendidikan: input.pendidikan,
      ruanganPelayanan: input.ruanganPelayanan,
      kategoriKeluhan: input.kategoriKeluhan,
      judulKeluhan: input.judulKeluhan,
      isiKeluhan: input.isiKeluhan,
      fotoKeluhanUrl,
      status: "Ditinjau",
    })
    .returning();

  const adminRow = await db.query.admins.findFirst({ where: eq(admins.username, DEMO_ADMIN_CREDENTIALS.username) });

  await db.insert(complaintEvents).values({
    keluhanId: row.id,
    status: "Ditinjau",
    catatan: "Keluhan baru diterima sistem",
    adminId: adminRow?.id ?? null,
  });

  return row;
}

export async function getComplaintByTicket(ticket: string): Promise<ComplaintDetail | null> {
  const complaint = await db.query.complaints.findFirst({ where: eq(complaints.nomorTiket, ticket) });
  if (!complaint) return null;

  const response = await db.query.complaintResponses.findFirst({ where: eq(complaintResponses.keluhanId, complaint.id) });
  const events = await db
    .select()
    .from(complaintEvents)
    .where(eq(complaintEvents.keluhanId, complaint.id))
    .orderBy(asc(complaintEvents.createdAt));

  return {
    complaint,
    response: response ?? null,
    timeline: complaintToTimeline(events, complaint, response ?? null),
  };
}

export async function getComplaintById(id: string): Promise<ComplaintDetail | null> {
  const complaint = await db.query.complaints.findFirst({ where: eq(complaints.id, id) });
  if (!complaint) return null;

  const response = await db.query.complaintResponses.findFirst({ where: eq(complaintResponses.keluhanId, complaint.id) });
  const events = await db
    .select()
    .from(complaintEvents)
    .where(eq(complaintEvents.keluhanId, complaint.id))
    .orderBy(asc(complaintEvents.createdAt));

  return {
    complaint,
    response: response ?? null,
    timeline: complaintToTimeline(events, complaint, response ?? null),
  };
}

export async function listComplaints(filters: ComplaintFilters = {}): Promise<ComplaintListResponse> {
  const page = Math.max(filters.page ?? 1, 1);
  const pageSize = Math.min(Math.max(filters.pageSize ?? 10, 1), 50);
  const q = filters.q?.trim().toLowerCase();

  const complaintRows = await db.select().from(complaints).orderBy(desc(complaints.createdAt));
  const responseRows = await db.select().from(complaintResponses);
  const responseMap = new Map(responseRows.map((row) => [row.keluhanId, row] as const));

  const filtered = complaintRows.filter((item) => {
    if (filters.status && filters.status !== "Semua" && item.status !== filters.status) return false;
    if (filters.kategori && filters.kategori !== "Semua" && item.kategoriKeluhan !== filters.kategori) return false;
    if (filters.ruangan && filters.ruangan !== "Semua" && item.ruanganPelayanan !== filters.ruangan) return false;
    if (q) {
      const haystack = [
        item.nomorTiket,
        item.namaLengkap,
        item.email,
        item.kategoriKeluhan,
        item.judulKeluhan,
        item.ruanganPelayanan,
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);
  return {
    items: paginated.map((complaint) => ({
      complaint,
      response: responseMap.get(complaint.id) ?? null,
    })),
    total: filtered.length,
    page,
    pageSize,
  };
}

function countBy<T>(values: T[], mapper: (value: T) => string) {
  return values.reduce<Record<string, number>>((acc, item) => {
    const key = mapper(item);
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
}

function toChartArray<T extends string>(source: Record<string, number>, order: readonly T[]) {
  return order.map((label) => ({ label, value: source[label] ?? 0 }));
}

export async function getDashboardData(): Promise<DashboardData> {
  const complaintsRows = await db.select().from(complaints).orderBy(desc(complaints.createdAt));
  const responseRows = await db.select().from(complaintResponses);
  const responseMap = new Map(responseRows.map((row) => [row.keluhanId, row] as const));

  const complaintItems: AdminComplaintListItem[] = complaintsRows.map((complaint) => ({
    complaint,
    response: responseMap.get(complaint.id) ?? null,
  }));

  const total = complaintsRows.length;
  const ditinjau = complaintsRows.filter((row) => row.status === "Ditinjau").length;
  const diproses = complaintsRows.filter((row) => row.status === "Sedang Diproses").length;
  const selesai = complaintsRows.filter((row) => row.status === "Selesai").length;
  const avgRatingEntries = responseRows.filter((row) => typeof row.ratingKepuasan === "number");
  const averageRating =
    avgRatingEntries.length === 0
      ? 0
      : Number((avgRatingEntries.reduce((sum, item) => sum + Number(item.ratingKepuasan ?? 0), 0) / avgRatingEntries.length).toFixed(1));

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
  const previousPeriodStart = new Date(now.getTime() - 60 * 86400000);
  const thisPeriod = complaintsRows.filter((row) => row.createdAt >= thirtyDaysAgo).length;
  const previousPeriod = complaintsRows.filter((row) => row.createdAt >= previousPeriodStart && row.createdAt < thirtyDaysAgo).length;
  const growthPercent = previousPeriod === 0 ? (thisPeriod > 0 ? 100 : 0) : Number((((thisPeriod - previousPeriod) / previousPeriod) * 100).toFixed(1));

  const genderTotals = countBy(complaintsRows, (row) => row.jenisKelamin);
  const educationTotals = countBy(complaintsRows, (row) => row.pendidikan);
  const roomTotals = countBy(complaintsRows, (row) => row.ruanganPelayanan);
  const categoryTotals = countBy(complaintsRows, (row) => row.kategoriKeluhan);

  const dates = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now.getTime() - (6 - index) * 86400000);
    date.setHours(0, 0, 0, 0);
    return date;
  });

  const trend = dates.map((date) => {
    const key = date.toISOString().slice(0, 10);
    const sameDay = complaintsRows.filter((row) => row.createdAt.toISOString().slice(0, 10) === key);
    return {
      label: new Intl.DateTimeFormat("id-ID", { weekday: "short" }).format(date),
      total: sameDay.length,
      ditinjau: sameDay.filter((row) => row.status === "Ditinjau").length,
      diproses: sameDay.filter((row) => row.status === "Sedang Diproses").length,
      selesai: sameDay.filter((row) => row.status === "Selesai").length,
    };
  });

  const sortedRooms = Object.entries(roomTotals)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  const categoryData = COMPLAINT_CATEGORY_OPTIONS.map((item) => ({
    label: item.label as ComplaintCategory,
    value: categoryTotals[item.label] ?? 0,
    icon: item.icon,
  }));

  return {
    metrics: { total, ditinjau, diproses, selesai, averageRating, growthPercent },
    charts: {
      jenisKelamin: GENDER_OPTIONS.map((label) => {
        const value = genderTotals[label] ?? 0;
        return { label, value, percent: total === 0 ? 0 : Math.round((value / total) * 100) };
      }),
      pendidikan: toChartArray(educationTotals, EDUCATION_OPTIONS),
      ruangan: sortedRooms,
      kategori: categoryData,
      trend,
    },
    recentComplaints: complaintItems.slice(0, 6),
    finishedComplaints: complaintItems.filter((item) => item.complaint.status === "Selesai").slice(0, 12),
    topRooms: sortedRooms,
    categoryTotals: categoryData,
  };
}

export async function respondToComplaint({
  complaintId,
  adminId,
  isiResponse,
  fotoResponseFile,
  status,
}: {
  complaintId: string;
  adminId: string;
  isiResponse: string;
  fotoResponseFile?: File | null;
  status: ComplaintStatus;
}) {
  const complaint = await db.query.complaints.findFirst({ where: eq(complaints.id, complaintId) });
  if (!complaint) {
    throw new Error("Keluhan tidak ditemukan.");
  }

  const fotoResponseUrl = fotoResponseFile ? await saveUploadedImage(fotoResponseFile, "response") : null;

  await db
    .insert(complaintResponses)
    .values({
      keluhanId: complaintId,
      adminId,
      isiResponse: stripUnsafeText(isiResponse),
      fotoResponseUrl,
      ratingKepuasan: null,
      komentarRating: null,
    })
    .onConflictDoUpdate({
      target: complaintResponses.keluhanId,
      set: {
        adminId,
        isiResponse: stripUnsafeText(isiResponse),
        fotoResponseUrl,
        updatedAt: new Date(),
      },
    });

  await db.update(complaints).set({ status, updatedAt: new Date() }).where(eq(complaints.id, complaintId));
  await db.insert(complaintEvents).values({
    keluhanId: complaintId,
    status,
    catatan: status === "Selesai" ? "Respons admin dikirim" : "Status diperbarui admin",
    adminId,
  });
}

export async function rateComplaint({
  ticket,
  rating,
  komentar,
}: {
  ticket: string;
  rating: number;
  komentar?: string;
}) {
  const complaint = await db.query.complaints.findFirst({ where: eq(complaints.nomorTiket, ticket) });
  if (!complaint) {
    throw new Error("Keluhan tidak ditemukan.");
  }

  const response = await db.query.complaintResponses.findFirst({ where: eq(complaintResponses.keluhanId, complaint.id) });
  if (!response) {
    throw new Error("Respons admin belum tersedia.");
  }

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new Error("Rating harus bernilai 1 sampai 5.");
  }

  await db
    .update(complaintResponses)
    .set({
      ratingKepuasan: rating,
      komentarRating: komentar?.trim() ? stripUnsafeText(komentar) : null,
      updatedAt: new Date(),
    })
    .where(eq(complaintResponses.keluhanId, complaint.id));
}

export async function loginAdmin(identifier: string, password: string) {
  const key = identifier.trim().toLowerCase();
  const admin = await db.query.admins.findFirst({
    where: or(eq(admins.username, key), eq(admins.email, key)),
  });

  if (!admin || !admin.isActive) {
    return null;
  }

  const passwordMatches = verifyPassword(password, admin.password);
  if (!passwordMatches) {
    return null;
  }

  return admin;
}

export async function getAdminProfile(adminId: string) {
  return db.query.admins.findFirst({ where: eq(admins.id, adminId) });
}

export function buildComplaintSearchSuggestions(detail?: ComplaintDetail | null) {
  if (!detail) return [] as string[];
  return [detail.complaint.nomorTiket, detail.complaint.namaLengkap, detail.complaint.kategoriKeluhan, detail.complaint.ruanganPelayanan];
}

export function isValidRoom(room: string) {
  return ROOM_OPTIONS.includes(room as RoomOption);
}

export function isValidCategory(category: string) {
  return COMPLAINT_CATEGORY_OPTIONS.some((item) => item.label === category);
}

export function isValidGender(value: string) {
  return GENDER_OPTIONS.includes(value as Gender);
}

export function isValidEducation(value: string) {
  return EDUCATION_OPTIONS.includes(value as EducationLevel);
}

export async function buildPublicHomeData(): Promise<PublicHomeData> {
  const countRow = await db.select({ count: sql<number>`count(*)::int` }).from(complaints);
  const recentRows = await db.select({ nomorTiket: complaints.nomorTiket }).from(complaints).orderBy(desc(complaints.createdAt)).limit(5);

  return {
    complaintCount: countRow[0]?.count ?? 0,
    categoryCards: COMPLAINT_CATEGORY_OPTIONS,
    recentTickets: recentRows.map((row) => row.nomorTiket),
  };
}

export function getComplaintStatusPillClass(status: ComplaintStatus) {
  if (status === "Ditinjau") return "bg-amber-100 text-amber-800 ring-amber-200";
  if (status === "Sedang Diproses") return "bg-orange-100 text-orange-800 ring-orange-200";
  return "bg-emerald-100 text-emerald-800 ring-emerald-200";
}

export function getCategoryAccent(category: ComplaintCategory) {
  return COMPLAINT_CATEGORY_OPTIONS.find((item) => item.label === category)?.color ?? "from-slate-700 to-slate-500";
}

export function mapComplaintToDisplay(detail: ComplaintDetail) {
  return {
    ...detail,
    progressLabel: getProgressLabel(detail.complaint.status),
    statusTone: getStatusTone(detail.complaint.status),
    categoryIcon: getComplaintCategoryIcon(detail.complaint.kategoriKeluhan as ComplaintCategory),
  };
}

