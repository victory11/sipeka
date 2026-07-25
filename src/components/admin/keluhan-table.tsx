"use client";

import { Eye, Inbox, Search, Star } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { apiFetch, ApiClientError, buildQuery } from "@/lib/client";
import { useAuth, useToast } from "@/components/providers";
import { useRouter } from "next/navigation";
import {
  EmptyState,
  KategoriBadge,
  Pagination,
  SelectInput,
  Spinner,
  StarsDisplay,
  StatusBadge,
  TextInput,
} from "@/components/ui";
import { KeluhanDetailDrawer } from "@/components/admin/detail-drawer";
import { cx, formatDateTime } from "@/lib/utils";
import { useDebouncedValue } from "@/lib/hooks";
import { kategoriMeta } from "@/lib/kategori-icons";
import {
  KATEGORI_FORM,
  RUANGAN_LIST,
  type StatusKeluhan,
} from "@/lib/constants";
import type { KeluhanListResult, KeluhanView } from "@/lib/types";

const SORTS = [
  { value: "terbaru", label: "Terbaru" },
  { value: "tertua", label: "Tertua" },
  { value: "az", label: "Nama A-Z" },
];

export function KeluhanListPage({ scope }: { scope: "masuk" | "selesai" }) {
  const router = useRouter();
  const { logout } = useAuth();
  const toast = useToast();

  const [q, setQ] = useState("");
  const qDebounced = useDebouncedValue(q, 400);
  const [status, setStatus] = useState("Semua");
  const [kategori, setKategori] = useState("Semua");
  const [ruangan, setRuangan] = useState("Semua");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sort, setSort] = useState("terbaru");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [data, setData] = useState<KeluhanListResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const filtersKey = JSON.stringify({
    q: qDebounced,
    status,
    kategori,
    ruangan,
    from,
    to,
    sort,
    pageSize,
    scope,
  });

  useEffect(() => {
    setPage(1);
  }, [filtersKey]);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<KeluhanListResult>(
        `/api/admin/keluhan${buildQuery({
          scope,
          q: qDebounced,
          status,
          kategori,
          ruangan,
          from,
          to,
          sort,
          page,
          pageSize,
        })}`,
      );
      setData(res);
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 401) {
        logout();
        router.replace("/admin/login");
        return;
      }
      toast.push("error", err instanceof Error ? err.message : "Gagal memuat data.");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey, page, refreshKey]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const items: KeluhanView[] = data?.items ?? [];
  const meta = data?.meta;
  const start = meta ? (meta.page - 1) * meta.pageSize + 1 : 0;
  const end = meta ? Math.min(meta.page * meta.pageSize, meta.total) : 0;

  const selectCls = "py-2 text-[13px]";

  return (
    <div className="animate-fade-in space-y-4">
      {/* header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="font-display text-lg font-bold text-ink-900">
            {scope === "masuk" ? "Keluhan Masuk" : "Keluhan Selesai"}
          </h2>
          {meta && (
            <span
              className={cx(
                "rounded-full px-2.5 py-1 text-xs font-bold",
                scope === "masuk"
                  ? "bg-amber-100 text-amber-800"
                  : "bg-medic-50 text-medic-700",
              )}
            >
              {meta.total} keluhan
            </span>
          )}
          {scope === "selesai" && data?.avgRating != null && (
            <span className="flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 ring-1 ring-amber-200">
              <Star size={12} className="fill-amber-400 text-amber-400" />
              Rata-rata {data.avgRating.toLocaleString("id-ID")}/5
            </span>
          )}
        </div>
        <label className="flex items-center gap-2 text-xs font-medium text-ink-500">
          Tampilkan
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="cursor-pointer rounded-lg border border-ink-200 bg-white px-2 py-1.5 text-xs font-semibold text-ink-700 outline-none focus:border-primary-500"
          >
            {[10, 25, 50].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          per halaman
        </label>
      </div>

      {/* filters */}
      <div className="rounded-xl border border-ink-200 bg-white p-4 shadow-xs">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-12">
          <div className="relative col-span-2 lg:col-span-4">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"
            />
            <TextInput
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari nama, tiket, judul, kategori..."
              className={cx(selectCls, "pl-9")}
              aria-label="Pencarian keluhan"
            />
          </div>
          {scope === "masuk" && (
            <div className="lg:col-span-2">
              <SelectInput
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={selectCls}
                aria-label="Filter status"
              >
                {["Semua", "Ditinjau", "Sedang Diproses"].map((s) => (
                  <option key={s} value={s}>
                    {s === "Semua" ? "Semua Status" : s}
                  </option>
                ))}
              </SelectInput>
            </div>
          )}
          <div className="lg:col-span-2">
            <SelectInput
              value={kategori}
              onChange={(e) => setKategori(e.target.value)}
              className={selectCls}
              aria-label="Filter kategori"
            >
              <option value="Semua">Semua Kategori</option>
              {KATEGORI_FORM.map((k) => (
                <option key={k.id} value={k.nama}>
                  {k.nama}
                </option>
              ))}
            </SelectInput>
          </div>
          <div className="lg:col-span-2">
            <SelectInput
              value={ruangan}
              onChange={(e) => setRuangan(e.target.value)}
              className={selectCls}
              aria-label="Filter ruangan"
            >
              <option value="Semua">Semua Ruangan</option>
              {RUANGAN_LIST.filter((r) => !r.startsWith("Lainnya")).map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </SelectInput>
          </div>
          <div className="flex gap-2 lg:col-span-2">
            <TextInput
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className={cx(selectCls, "px-2.5")}
              aria-label="Dari tanggal"
            />
            <TextInput
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className={cx(selectCls, "px-2.5")}
              aria-label="Sampai tanggal"
            />
          </div>
          <div className="col-span-2 lg:col-span-12 lg:flex lg:justify-end">
            <SelectInput
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className={cx(selectCls, "lg:w-44")}
              aria-label="Urutkan"
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  Urutkan: {s.label}
                </option>
              ))}
            </SelectInput>
          </div>
        </div>
      </div>

      {/* table */}
      <div className="overflow-hidden rounded-xl border border-ink-200 bg-white shadow-xs">
        {loading ? (
          <div className="flex items-center justify-center gap-3 py-20">
            <Spinner size={22} />
            <span className="text-sm font-medium text-ink-400">Memuat keluhan...</span>
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="Tidak ada keluhan ditemukan"
            desc="Coba ubah kata kunci pencarian atau reset filter yang aktif."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-left text-sm">
              <thead>
                <tr className="border-b border-ink-200 bg-ink-50/70 text-[11px] uppercase tracking-wide text-ink-400">
                  <th className="px-4 py-3 font-bold">Nomor Tiket</th>
                  <th className="px-4 py-3 font-bold">Nama</th>
                  <th className="px-4 py-3 font-bold">Kategori</th>
                  <th className="px-4 py-3 font-bold">Ringkasan</th>
                  <th className="px-4 py-3 font-bold">Ruangan</th>
                  <th className="px-4 py-3 font-bold">Tanggal</th>
                  {scope === "masuk" ? (
                    <th className="px-4 py-3 font-bold">Status</th>
                  ) : (
                    <>
                      <th className="px-4 py-3 font-bold">Rating</th>
                      <th className="px-4 py-3 font-bold">Di-respons</th>
                    </>
                  )}
                  <th className="px-4 py-3 text-right font-bold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {items.map((item) => {
                  const kat = kategoriMeta(item.kategoriKeluhan);
                  const KatIcon = kat.icon;
                  return (
                    <tr
                      key={item.id}
                      className="group transition-colors hover:bg-primary-50/40"
                    >
                      <td className="px-4 py-3.5">
                        <span className="font-mono text-xs font-bold text-primary-800">
                          {item.nomorTiket}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-ink-800">{item.namaLengkap}</p>
                        <p className="text-[11px] text-ink-400">{item.noTelepon}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <KategoriBadge
                          nama={item.kategoriKeluhan}
                          icon={KatIcon}
                          color={kat.color}
                        />
                      </td>
                      <td className="max-w-52 px-4 py-3.5">
                        <p className="truncate font-medium text-ink-700">
                          {item.judulKeluhan}
                        </p>
                        <p className="truncate text-[11px] text-ink-400">
                          {item.isiKeluhan}
                        </p>
                      </td>
                      <td className="max-w-40 truncate px-4 py-3.5 text-[13px] text-ink-500">
                        {item.ruanganPelayanan}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-xs text-ink-500">
                        {formatDateTime(item.createdAt)}
                      </td>
                      {scope === "masuk" ? (
                        <td className="px-4 py-3.5">
                          <StatusBadge status={item.status} />
                        </td>
                      ) : (
                        <>
                          <td className="px-4 py-3.5">
                            {item.response?.ratingKepuasan ? (
                              <span className="flex items-center gap-1.5">
                                <StarsDisplay value={item.response.ratingKepuasan} size={12} />
                                <span className="text-xs font-bold text-ink-700">
                                  ({item.response.ratingKepuasan})
                                </span>
                              </span>
                            ) : (
                              <span className="text-xs text-ink-400">Belum dinilai</span>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3.5 text-xs font-medium text-ink-500">
                            {item.response?.adminNama ?? "—"}
                          </td>
                        </>
                      )}
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => setDetailId(item.id)}
                          className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-ink-200 bg-white px-2.5 py-1.5 text-xs font-bold text-ink-600 transition group-hover:border-primary-300 hover:border-primary-400 hover:bg-primary-50 hover:text-primary-800"
                        >
                          <Eye size={13} />
                          Lihat
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && meta && meta.total > 0 && (
          <div className="flex flex-col items-center justify-between gap-3 border-t border-ink-200 bg-ink-50/50 px-4 py-3.5 sm:flex-row">
            <p className="text-xs text-ink-400">
              Menampilkan <strong className="text-ink-700">{start}–{end}</strong> dari{" "}
              <strong className="text-ink-700">{meta.total}</strong> keluhan
            </p>
            <Pagination page={meta.page} totalPages={meta.totalPages} onChange={setPage} />
          </div>
        )}
      </div>

      {detailId && (
        <KeluhanDetailDrawer
          id={detailId}
          scope={scope}
          onClose={() => setDetailId(null)}
          onChanged={() => setRefreshKey((k) => k + 1)}
        />
      )}
    </div>
  );
}
