export interface ResponseView {
  id: string;
  isiResponse: string;
  fotoResponseUrl: string | null;
  ratingKepuasan: number | null;
  komentarRating: string | null;
  createdAt: string;
  adminNama: string | null;
}

export interface KeluhanView {
  id: string;
  nomorTiket: string;
  namaLengkap: string;
  email: string;
  noTelepon: string;
  jenisKelamin: string;
  pendidikan: string;
  ruanganPelayanan: string;
  kategoriKeluhan: string;
  judulKeluhan: string;
  isiKeluhan: string;
  fotoKeluhanUrl: string | null;
  status: string;
  statusDiprosesAt: string | null;
  statusSelesaiAt: string | null;
  createdAt: string;
  response: ResponseView | null;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface KeluhanListResult {
  items: KeluhanView[];
  meta: PaginationMeta;
  avgRating: number | null;
}

export interface DashboardStats {
  kpi: {
    total: number;
    ditinjau: number;
    diproses: number;
    selesai: number;
    avgRating: number | null;
    bulanIni: number;
    bulanLalu: number;
    persenPerubahan: number | null;
  };
  jenisKelamin: Array<{ name: string; value: number }>;
  pendidikan: Array<{ name: string; value: number }>;
  ruangan: Array<{ name: string; value: number }>;
  kategori: Array<{ name: string; value: number; color: string }>;
  trend: Array<{
    label: string;
    Ditinjau: number;
    "Sedang Diproses": number;
    Selesai: number;
  }>;
  kepuasan: {
    avg: number | null;
    totalRated: number;
    distribusi: Array<{ stars: number; count: number }>;
  };
  terbaru: Array<{
    nomorTiket: string;
    namaLengkap: string;
    kategoriKeluhan: string;
    status: string;
    createdAt: string;
  }>;
}

export interface SanitizedAdmin {
  id: string;
  username: string;
  email: string;
  namaLengkap: string;
  noTelepon: string | null;
  avatarUrl: string | null;
  createdAt: string;
}
