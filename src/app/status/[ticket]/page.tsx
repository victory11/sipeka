import { ChevronRight, Home, SearchX, Ticket } from "lucide-react";
import Link from "next/link";
import { fetchKeluhanView } from "@/server/api";
import { PublicLayout } from "@/components/public-layout";
import { StatusDetail } from "@/components/status-detail";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Status Keluhan — SIPEKA RSUD Patut Patuh Patju",
};

export default async function StatusPage({
  params,
}: {
  params: Promise<{ ticket: string }>;
}) {
  const { ticket } = await params;
  const view = await fetchKeluhanView(decodeURIComponent(ticket));

  return (
    <PublicLayout>
      <div className="border-b border-ink-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-5">
          <nav
            className="flex items-center gap-1.5 text-xs font-medium text-ink-400"
            aria-label="Breadcrumb"
          >
            <Link href="/" className="flex items-center gap-1 transition hover:text-primary-700">
              <Home size={13} /> Beranda
            </Link>
            <ChevronRight size={13} />
            <Link href="/cek-status" className="transition hover:text-primary-700">
              Cek Status
            </Link>
            <ChevronRight size={13} />
            <span className="max-w-40 truncate font-mono text-ink-700">
              {decodeURIComponent(ticket)}
            </span>
          </nav>
        </div>
      </div>

      {view ? (
        <StatusDetail initial={view} />
      ) : (
        <div className="mx-auto max-w-xl px-4 py-16 text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-red-50">
            <SearchX size={30} className="text-red-500" />
          </span>
          <h1 className="font-display mt-5 text-xl font-bold text-ink-900">
            Nomor tiket tidak ditemukan
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-500">
            Pastikan nomor tiket yang Anda masukkan benar dengan format{" "}
            <span className="font-mono font-semibold">SIPEKA-YYYYMMDDXXXXX</span>.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/cek-status"
              className="inline-flex items-center gap-2 rounded-lg bg-primary-800 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-primary-700"
            >
              <Ticket size={16} /> Coba Lagi
            </Link>
            <Link
              href="/kirim-keluhan"
              className="inline-flex items-center gap-2 rounded-lg border border-ink-200 bg-white px-5 py-2.5 text-sm font-bold text-ink-700 transition hover:bg-ink-50"
            >
              Kirim Keluhan Baru
            </Link>
          </div>
        </div>
      )}
    </PublicLayout>
  );
}
