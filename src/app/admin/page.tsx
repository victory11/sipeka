"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  Inbox,
  RefreshCw,
  Star,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useAuth, useToast } from "@/components/providers";
import { Button, StatusBadge } from "@/components/ui";
import {
  ChartCard,
  GenderPieChart,
  KategoriDonutChart,
  PendidikanBarChart,
  RuanganBarChart,
  TrendLineChart,
} from "./charts";
import { apiFetch, ApiClientError } from "@/lib/client";
import { cx, formatDateTime } from "@/lib/utils";
import { kategoriMeta } from "@/lib/kategori-icons";
import type { DashboardStats } from "@/lib/types";

function KpiCard({
  label,
  value,
  sub,
  icon,
  tone,
}: {
  label: string;
  value: string;
  sub: ReactNode;
  icon: ReactNode;
  tone: "blue" | "amber" | "orange" | "green";
}) {
  const tones = {
    blue: "bg-primary-50 text-primary-800",
    amber: "bg-amber-100 text-amber-700",
    orange: "bg-orange-100 text-orange-700",
    green: "bg-medic-50 text-medic-700",
  };
  return (
    <div className="rounded-xl border border-ink-200 bg-white p-5 shadow-xs">
      <div className="flex items-start justify-between">
        <p className="text-xs font-bold uppercase tracking-wide text-ink-400">{label}</p>
        <span className={cx("grid h-9 w-9 place-items-center rounded-lg", tones[tone])}>
          {icon}
        </span>
      </div>
      <p className="font-display mt-2 text-3xl font-bold text-ink-900">{value}</p>
      <div className="mt-1.5 text-xs text-ink-400">{sub}</div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-xl border border-ink-200 bg-white" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-12">
        <div className="h-72 animate-pulse rounded-xl border border-ink-200 bg-white lg:col-span-4" />
        <div className="h-72 animate-pulse rounded-xl border border-ink-200 bg-white lg:col-span-8" />
        <div className="h-80 animate-pulse rounded-xl border border-ink-200 bg-white lg:col-span-12" />
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { logout } = useAuth();
  const toast = useToast();
  const router = useRouter();

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch<DashboardStats>("/api/admin/stats");
      setStats(data);
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 401) {
        logout();
        router.replace("/admin/login");
        return;
      }
      setError(err instanceof Error ? err.message : "Gagal memuat statistik.");
    } finally {
      setLoading(false);
    }
  }, [logout, router]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <Skeleton />;

  if (error || !stats) {
    return (
      <div className="mx-auto max-w-md rounded-xl border border-red-200 bg-white p-8 text-center shadow-xs">
        <AlertTriangle size={30} className="mx-auto text-red-500" />
        <p className="font-display mt-3 font-bold text-ink-900">Gagal memuat data</p>
        <p className="mt-1 text-sm text-ink-500">{error}</p>
        <Button onClick={load} className="mt-5">
          <RefreshCw size={15} /> Muat Ulang
        </Button>
      </div>
    );
  }

  const { kpi } = stats;
  const trendUp = kpi.persenPerubahan != null && kpi.persenPerubahan > 0;
  const maxDist = Math.max(...stats.kepuasan.distribusi.map((d) => d.count), 1);

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold text-ink-900">
            Ringkasan Penanganan Keluhan
          </h2>
          <p className="text-xs text-ink-400">
            Data diperbarui langsung dari database — {formatDateTime(new Date().toISOString())}
          </p>
        </div>
        <Button variant="secondary" onClick={() => { load(); toast.push("info", "Statistik dimuat ulang."); }} className="px-3.5 py-2 text-xs">
          <RefreshCw size={14} /> Muat Ulang
        </Button>
      </div>

      {/* KPI */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Total Keluhan"
          value={kpi.total.toLocaleString("id-ID")}
          tone="blue"
          icon={<Inbox size={17} />}
          sub={
            <span className="flex items-center gap-1.5">
              Bulan ini: <strong className="text-ink-700">{kpi.bulanIni}</strong>
              {kpi.persenPerubahan != null && (
                <span
                  className={cx(
                    "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-bold",
                    trendUp ? "bg-red-50 text-red-600" : "bg-medic-50 text-medic-700",
                  )}
                >
                  {trendUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                  {kpi.persenPerubahan > 0 ? "+" : ""}
                  {kpi.persenPerubahan}%
                </span>
              )}
            </span>
          }
        />
        <KpiCard
          label="Ditinjau"
          value={kpi.ditinjau.toLocaleString("id-ID")}
          tone="amber"
          icon={<Eye size={17} />}
          sub="Menunggu verifikasi tim pengelola"
        />
        <KpiCard
          label="Sedang Diproses"
          value={kpi.diproses.toLocaleString("id-ID")}
          tone="orange"
          icon={<RefreshCw size={16} />}
          sub="Ditindaklanjuti unit terkait"
        />
        <KpiCard
          label="Selesai"
          value={kpi.selesai.toLocaleString("id-ID")}
          tone="green"
          icon={<CheckCircle2 size={17} />}
          sub={
            <span className="flex items-center gap-1">
              <Star size={12} className="fill-amber-400 text-amber-400" />
              {kpi.avgRating
                ? `${kpi.avgRating.toLocaleString("id-ID")} rating kepuasan`
                : "Belum ada rating"}
            </span>
          }
        />
      </div>

      {/* Charts row 1 */}
      <div className="grid gap-4 lg:grid-cols-12">
        <ChartCard
          title="Jenis Kelamin Responden"
          subtitle="Sebaran pelapor berdasarkan gender"
          className="lg:col-span-4"
        >
          <GenderPieChart data={stats.jenisKelamin} />
        </ChartCard>
        <ChartCard
          title="Tingkat Pendidikan"
          subtitle="Jumlah keluhan per pendidikan terakhir"
          className="lg:col-span-8"
        >
          <PendidikanBarChart data={stats.pendidikan} />
        </ChartCard>
      </div>

      {/* Charts row 2 */}
      <div className="grid gap-4 lg:grid-cols-12">
        <ChartCard
          title="Keluhan per Ruangan"
          subtitle="10 unit layanan dengan keluhan terbanyak"
          className="lg:col-span-5"
        >
          <RuanganBarChart data={stats.ruangan} />
        </ChartCard>
        <ChartCard
          title="Tren 7 Hari Terakhir"
          subtitle="Keluhan masuk per hari berdasarkan status saat ini"
          className="lg:col-span-4"
        >
          <TrendLineChart data={stats.trend} />
        </ChartCard>
        <ChartCard
          title="Kategori Keluhan"
          subtitle="Komposisi jenis pengaduan"
          className="lg:col-span-3"
        >
          <KategoriDonutChart data={stats.kategori} />
        </ChartCard>
      </div>

      {/* Row 3: kepuasan + terbaru */}
      <div className="grid gap-4 lg:grid-cols-12">
        <ChartCard
          title="Kepuasan Responden"
          subtitle={`${stats.kepuasan.totalRated} responden telah memberi rating`}
          className="lg:col-span-4"
        >
          <div className="flex items-center gap-4">
            <span className="font-display text-4xl font-bold text-ink-900">
              {stats.kepuasan.avg ? stats.kepuasan.avg.toLocaleString("id-ID") : "—"}
            </span>
            <div>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    size={16}
                    className={
                      stats.kepuasan.avg != null && n <= Math.round(stats.kepuasan.avg)
                        ? "fill-amber-400 text-amber-400"
                        : "fill-ink-200 text-ink-200"
                    }
                  />
                ))}
              </div>
              <p className="mt-1 text-xs text-ink-400">dari skala 5</p>
            </div>
          </div>
          <ul className="mt-4 space-y-2">
            {[...stats.kepuasan.distribusi].reverse().map((d) => (
              <li key={d.stars} className="flex items-center gap-2.5 text-xs">
                <span className="flex w-8 items-center gap-0.5 font-bold text-ink-700">
                  {d.stars}
                  <Star size={11} className="fill-amber-400 text-amber-400" />
                </span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-ink-100">
                  <span
                    className="block h-full rounded-full bg-amber-400 transition-all"
                    style={{ width: `${(d.count / maxDist) * 100}%` }}
                  />
                </span>
                <span className="w-6 text-right font-semibold text-ink-500">{d.count}</span>
              </li>
            ))}
          </ul>
        </ChartCard>

        <ChartCard
          title="Keluhan Terbaru"
          subtitle="Laporan yang baru saja masuk"
          className="lg:col-span-8"
        >
          <ul className="divide-y divide-ink-100">
            {stats.terbaru.map((t) => {
              const kat = kategoriMeta(t.kategoriKeluhan);
              const KatIcon = kat.icon;
              return (
                <li key={t.nomorTiket} className="flex items-center gap-3.5 py-3 first:pt-0 last:pb-0">
                  <span
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-lg"
                    style={{ backgroundColor: `${kat.color}14`, color: kat.color }}
                  >
                    <KatIcon size={16} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-ink-800">
                      {t.namaLengkap}
                      <span className="ml-2 font-mono text-[11px] font-semibold text-ink-400">
                        {t.nomorTiket}
                      </span>
                    </p>
                    <p className="truncate text-xs text-ink-400">
                      {t.kategoriKeluhan} · {formatDateTime(t.createdAt)}
                    </p>
                  </div>
                  <StatusBadge status={t.status} />
                </li>
              );
            })}
          </ul>
          <div className="mt-4 flex flex-wrap gap-3 border-t border-ink-100 pt-4">
            <Link
              href="/admin/keluhan-masuk"
              className="text-xs font-bold text-primary-700 transition hover:text-primary-900"
            >
              Kelola keluhan masuk →
            </Link>
            <Link
              href="/admin/keluhan-selesai"
              className="text-xs font-bold text-medic-700 transition hover:text-medic-600"
            >
              Lihat keluhan selesai →
            </Link>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
