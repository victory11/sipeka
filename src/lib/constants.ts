export const RUANGAN_LIST = [
  "IGD (Instalasi Gawat Darurat)",
  "Poliklinik",
  "Loket Pendaftaran",
  "Paviliun Wijaya Kusuma",
  "Paviliun Kenanga",
  "Paviliun Nusa Indah",
  "Paviliun Tulip",
  "Paviliun Aster",
  "Paviliun Alamanda",
  "MNE (Maternal Neonatal Emergency)",
  "Laboratorium",
  "Radiologi",
  "Instalasi Bedah Sentral (IBS)",
  "Farmasi",
  "Kantin / Koperasi Rumah Sakit",
  "ICU",
  "NICU",
  "PICU",
  "Hemodialisa",
  "Post Satpam",
  "Klinik Rehab Medik",
  "Pemulasaran Jenazah",
  "SIJAP / PPATRS",
  "Lab Patologi Anatomi",
  "Lab Mikrobiologi",
  "Lainnya (Bisa Diketik Sendiri)",
] as const;

export const RUANGAN_LAINNYA = "Lainnya (Bisa Diketik Sendiri)";

export type KategoriId =
  | "pelayanan"
  | "administrasi"
  | "fasilitas"
  | "medis"
  | "petugas"
  | "lainnya";

export interface Kategori {
  id: KategoriId;
  nama: string;
  deskripsi: string;
  warna: string; // tailwind-ish hex for charts/badges
  icon: "phone" | "file" | "building" | "stethoscope" | "user-md" | "star";
}

export const KATEGORI_LIST: Kategori[] = [
  {
    id: "pelayanan",
    nama: "Keluhan Pelayanan",
    deskripsi: "Kualitas dan responsivitas layanan rumah sakit",
    warna: "#1E40AF",
    icon: "phone",
  },
  {
    id: "administrasi",
    nama: "Administrasi Rumah Sakit",
    deskripsi: "Prosedur, dokumen, dan pendaftaran",
    warna: "#7C3AED",
    icon: "file",
  },
  {
    id: "fasilitas",
    nama: "Fasilitas Sarana Prasarana",
    deskripsi: "Fasilitas, kebersihan, dan kenyamanan",
    warna: "#059669",
    icon: "building",
  },
  {
    id: "medis",
    nama: "Keluhan Medis",
    deskripsi: "Tindakan medis, diagnosis, dan treatment",
    warna: "#DC2626",
    icon: "stethoscope",
  },
  {
    id: "petugas",
    nama: "Keluhan Petugas Medis",
    deskripsi: "Perilaku, profesionalisme, dan komunikasi",
    warna: "#D97706",
    icon: "user-md",
  },
  {
    id: "lainnya",
    nama: "Keluhan Lainnya",
    deskripsi: "Komplain kategori lain yang tidak tercantum",
    warna: "#0891B2",
    icon: "star",
  },
];

export const KATEGORI_FORM = KATEGORI_LIST.filter((k) => k.id !== "lainnya");

export const PENDIDIKAN_LIST = ["SD", "SMP", "SMA", "D3", "S1", "S2", "S3"];

export const STATUS_LIST = ["Ditinjau", "Sedang Diproses", "Selesai"] as const;
export type StatusKeluhan = (typeof STATUS_LIST)[number];

export const STATUS_META: Record<
  StatusKeluhan,
  { warna: string; bg: string; text: string; dot: string }
> = {
  Ditinjau: {
    warna: "#FBBF24",
    bg: "bg-amber-100",
    text: "text-amber-800",
    dot: "bg-amber-400",
  },
  "Sedang Diproses": {
    warna: "#FB923C",
    bg: "bg-orange-100",
    text: "text-orange-800",
    dot: "bg-orange-400",
  },
  Selesai: {
    warna: "#10B981",
    bg: "bg-emerald-100",
    text: "text-emerald-800",
    dot: "bg-emerald-500",
  },
};

export const RS_PROFILE = {
  nama: "RSUD Patut Patuh Patju",
  kabupaten: "Pemerintah Kabupaten Lombok Barat",
  alamat: "Jl. Soekarno - Hatta No. 8, Gerung, Lombok Barat, Nusa Tenggara Barat 83363",
  telepon: "(0370) 681 437",
  email: "humas@rsudpatutpatuhpatju.go.id",
  igd: "(0370) 681 437",
};
