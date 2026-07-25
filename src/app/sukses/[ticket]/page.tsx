import { CheckCircle2, ChevronRight, Home, MailCheck, Ticket } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchKeluhanView } from "@/server/api";
import { PublicLayout } from "@/components/public-layout";
import { CopyButton } from "@/components/copy-button";
import { ShareButtons } from "@/components/share-buttons";
import { formatDate, maskEmail } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Keluhan Terkirim — SIPEKA RSUD Patut Patuh Patju",
};

export default async function SuksesPage({
  params,
}: {
  params: Promise<{ ticket: string }>;
}) {
  const { ticket } = await params;
  const view = await fetchKeluhanView(decodeURIComponent(ticket));
  if (!view) notFound();

  return (
    <PublicLayout>
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="animate-slide-up overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-card">
          <div className="border-b border-dashed border-ink-200 bg-medic-50/50 px-6 py-8 text-center sm:px-10">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-medic-500 shadow-lg shadow-medic-500/30">
              <CheckCircle2 size={32} className="text-white" />
            </span>
            <h1 className="font-display mt-4 text-2xl font-bold text-ink-900">
              Keluhan Berhasil Dikirim
            </h1>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-500">
              Terima kasih! Keluhan Anda telah diterima dan sedang kami proses.
              Simpan nomor tiket di bawah ini.
            </p>
          </div>

          <div className="px-6 py-7 sm:px-10">
            <p className="text-center text-xs font-bold uppercase tracking-wide text-ink-400">
              Nomor Tiket Anda
            </p>
            <div className="mt-3 rounded-xl border-2 border-dashed border-primary-300 bg-primary-50/50 px-4 py-5 text-center">
              <p className="flex items-center justify-center gap-2 font-mono text-xl font-bold tracking-wide text-primary-900 sm:text-2xl">
                <Ticket size={22} className="text-primary-700" />
                {view.nomorTiket}
              </p>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
              <CopyButton text={view.nomorTiket} label="Copy Nomor Tiket" />
              <ShareButtons ticket={view.nomorTiket} />
            </div>

            <div className="mt-7 rounded-lg border border-ink-100 bg-ink-50/70 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-ink-400">
                Isi Keluhan Anda
              </p>
              <p className="font-display mt-1.5 text-sm font-bold text-ink-900">
                &ldquo;{view.judulKeluhan}&rdquo;
              </p>
              <p className="mt-1 line-clamp-3 text-[13px] leading-relaxed text-ink-500">
                {view.isiKeluhan}
              </p>
              <p className="mt-2 text-xs text-ink-400">
                Kategori: <span className="font-semibold text-ink-700">{view.kategoriKeluhan}</span>
                <span className="mx-1.5">·</span>
                Ruangan: <span className="font-semibold text-ink-700">{view.ruanganPelayanan}</span>
                <span className="mx-1.5">·</span>
                {formatDate(view.createdAt)}
              </p>
            </div>

            <div className="mt-5 flex items-start gap-2.5 rounded-lg border border-primary-100 bg-primary-50/60 p-3.5">
              <MailCheck size={17} className="mt-0.5 shrink-0 text-primary-700" />
              <p className="text-[13px] leading-relaxed text-primary-900">
                Email konfirmasi telah dikirim ke{" "}
                <strong>{maskEmail(view.email)}</strong>. Gunakan nomor tiket
                untuk mengecek status keluhan melalui menu{" "}
                <Link href="/cek-status" className="font-bold underline underline-offset-2">
                  Cek Status Keluhan
                </Link>
                .
              </p>
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href={`/status/${encodeURIComponent(view.nomorTiket)}`}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary-800 px-5 py-3 text-sm font-bold text-white transition hover:bg-primary-700 active:scale-[0.98]"
              >
                Lihat Status Keluhan
                <ChevronRight size={16} />
              </Link>
              <Link
                href="/"
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-ink-200 bg-white px-5 py-3 text-sm font-bold text-ink-700 transition hover:bg-ink-50 active:scale-[0.98]"
              >
                <Home size={16} />
                Kembali ke Beranda
              </Link>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
