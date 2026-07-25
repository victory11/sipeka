import { ChevronRight, Home, Ticket } from "lucide-react";
import Link from "next/link";
import { PublicLayout } from "@/components/public-layout";
import { TicketSearch } from "@/components/ticket-search";
import { STATUS_LIST, STATUS_META, type StatusKeluhan } from "@/lib/constants";
import { cx } from "@/lib/utils";

export const metadata = {
  title: "Cek Status Keluhan — SIPEKA RSUD Patut Patuh Patju",
};

export default function CekStatusPage() {
  return (
    <PublicLayout>
      <div className="border-b border-ink-200 bg-white">
        <div className="mx-auto max-w-3xl px-4 py-7">
          <nav
            className="flex items-center gap-1.5 text-xs font-medium text-ink-400"
            aria-label="Breadcrumb"
          >
            <Link href="/" className="flex items-center gap-1 transition hover:text-primary-700">
              <Home size={13} /> Beranda
            </Link>
            <ChevronRight size={13} />
            <span className="text-ink-700">Cek Status</span>
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="animate-slide-up rounded-2xl border border-ink-200 bg-white p-6 shadow-card sm:p-9">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-primary-800">
            <Ticket size={26} className="text-white" />
          </span>
          <h1 className="font-display mt-5 text-2xl font-bold text-ink-900 sm:text-[28px]">
            Cek Status Keluhan Anda
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-500">
            Masukkan nomor tiket e-ticket (format{" "}
            <span className="font-mono font-semibold text-ink-700">
              SIPEKA-YYYYMMDDXXXXX
            </span>
            ) yang Anda terima saat mengirim keluhan untuk melihat tahapan
            penanganannya.
          </p>
          <div className="mt-6">
            <TicketSearch prominent />
          </div>
        </div>

        <div className="animate-slide-up mt-6 rounded-xl border border-ink-200 bg-white p-6 [animation-delay:120ms]">
          <h2 className="font-display text-sm font-bold text-ink-900">
            Arti Status Keluhan
          </h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-3">
            {STATUS_LIST.map((s) => {
              const meta = STATUS_META[s as StatusKeluhan];
              const desc =
                s === "Ditinjau"
                  ? "Keluhan diterima dan menunggu verifikasi tim pengelola."
                  : s === "Sedang Diproses"
                    ? "Keluhan sedang ditindaklanjuti unit terkait."
                    : "Keluhan telah direspons dan diselesaikan.";
              return (
                <li key={s} className="rounded-lg border border-ink-100 bg-ink-50/60 p-3.5">
                  <span
                    className={cx(
                      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
                      meta.bg,
                      meta.text,
                    )}
                  >
                    <span className={cx("h-1.5 w-1.5 rounded-full", meta.dot)} />
                    {s}
                  </span>
                  <p className="mt-2 text-xs leading-relaxed text-ink-500">{desc}</p>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </PublicLayout>
  );
}
