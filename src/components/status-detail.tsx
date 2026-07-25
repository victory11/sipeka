"use client";

import {
  Check,
  ClipboardList,
  Clock,
  Download,
  Eye,
  LifeBuoy,
  MessageSquareText,
  Star,
  Ticket,
} from "lucide-react";
import { useState } from "react";
import type { KeluhanView } from "@/lib/types";
import { apiFetch } from "@/lib/client";
import { useToast } from "@/components/providers";
import { CopyButton } from "@/components/copy-button";
import {
  Button,
  KategoriBadge,
  Lightbox,
  StarRating,
  StarsDisplay,
  StatusBadge,
  TextArea,
} from "@/components/ui";
import { cx, formatDateTime, maskEmail } from "@/lib/utils";
import { kategoriMeta } from "@/lib/kategori-icons";
import { STATUS_META, type StatusKeluhan } from "@/lib/constants";

function Timeline({ view }: { view: KeluhanView }) {
  const steps = [
    {
      label: "Ditinjau",
      desc: "Keluhan diterima & tercatat di sistem",
      time: view.createdAt,
      done: true,
      color: STATUS_META.Ditinjau.warna,
    },
    {
      label: "Sedang Diproses",
      desc: "Ditindaklanjuti unit terkait",
      time: view.statusDiprosesAt,
      done: !!view.statusDiprosesAt,
      color: STATUS_META["Sedang Diproses"].warna,
    },
    {
      label: "Selesai",
      desc: "Respons & penyelesaian diterbitkan",
      time: view.statusSelesaiAt,
      done: !!view.statusSelesaiAt,
      color: STATUS_META.Selesai.warna,
    },
  ];
  return (
    <ol>
      {steps.map((step, i) => (
        <li key={step.label} className="relative flex gap-3.5 pb-7 last:pb-0">
          {i < steps.length - 1 && (
            <span
              className={cx(
                "absolute bottom-0 left-[15px] top-9 w-0.5 rounded-full",
                steps[i + 1].done ? "" : "bg-ink-200",
              )}
              style={steps[i + 1].done ? { backgroundColor: step.color } : undefined}
            />
          )}
          <span
            className="z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 bg-white"
            style={{
              borderColor: step.done ? step.color : "#E5E7EB",
              backgroundColor: step.done ? step.color : "white",
            }}
          >
            {step.done ? (
              <Check size={14} className="text-white" strokeWidth={3} />
            ) : (
              <span className="h-2 w-2 rounded-full bg-ink-200" />
            )}
          </span>
          <div className="min-w-0 pt-0.5">
            <p
              className={cx(
                "text-sm font-bold",
                step.done ? "text-ink-900" : "text-ink-400",
              )}
            >
              {step.label}
            </p>
            <p className="text-xs text-ink-400">{step.desc}</p>
            {step.done ? (
              <p className="mt-0.5 text-xs font-semibold text-ink-500">
                {formatDateTime(step.time)}
              </p>
            ) : (
              <p className="mt-0.5 flex items-center gap-1 text-xs font-medium text-ink-400">
                <Clock size={12} /> Menunggu
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

function PhotoRow({
  url,
  label,
  onView,
}: {
  url: string | null;
  label: string;
  onView: (src: string) => void;
}) {
  if (!url) return null;
  return (
    <div className="flex items-center gap-3 rounded-lg border border-ink-200 bg-ink-50/60 p-2.5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={label}
        className="h-14 w-14 shrink-0 cursor-pointer rounded-md object-cover"
        onClick={() => onView(url)}
      />
      <div className="flex flex-1 flex-wrap gap-2">
        <button
          onClick={() => onView(url)}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-ink-200 bg-white px-2.5 py-1.5 text-xs font-bold text-ink-700 transition hover:border-primary-400 hover:text-primary-700"
        >
          <Eye size={13} /> Lihat
        </button>
        <a
          href={url}
          download
          className="inline-flex items-center gap-1.5 rounded-md border border-ink-200 bg-white px-2.5 py-1.5 text-xs font-bold text-ink-700 transition hover:border-primary-400 hover:text-primary-700"
        >
          <Download size={13} /> Unduh
        </a>
      </div>
    </div>
  );
}

export function StatusDetail({ initial }: { initial: KeluhanView }) {
  const toast = useToast();
  const [view, setView] = useState(initial);
  const [rating, setRating] = useState(0);
  const [komentar, setKomentar] = useState("");
  const [sending, setSending] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);

  const kat = kategoriMeta(view.kategoriKeluhan);
  const KatIcon = kat.icon;
  const hasResponse = !!view.response;
  const alreadyRated = view.response?.ratingKepuasan != null;

  async function submitRating() {
    if (rating === 0) {
      toast.push("error", "Silakan pilih jumlah bintang terlebih dahulu.");
      return;
    }
    setSending(true);
    try {
      const res = await apiFetch<{ view: KeluhanView }>(
        `/api/keluhan/${encodeURIComponent(view.nomorTiket)}/rating`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rating, komentar: komentar.trim() || null }),
        },
      );
      setView(res.view);
      toast.push("success", "Terima kasih! Rating Anda telah kami terima.");
    } catch (err) {
      toast.push("error", err instanceof Error ? err.message : "Gagal mengirim rating.");
    } finally {
      setSending(false);
    }
  }

  const info: Array<[string, string]> = [
    ["Nama", view.namaLengkap],
    ["Email", maskEmail(view.email)],
    ["No. Telp", view.noTelepon],
    ["Jenis Kelamin", view.jenisKelamin],
    ["Pendidikan", view.pendidikan],
    ["Ruangan", view.ruanganPelayanan],
  ];

  return (
    <div className="animate-fade-in mx-auto max-w-6xl px-4 py-8">
      {/* header ticket */}
      <div className="animate-slide-up flex flex-wrap items-center justify-between gap-4 rounded-xl border border-ink-200 bg-white p-5 shadow-xs sm:p-6">
        <div className="flex items-center gap-4">
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary-800">
            <Ticket size={22} className="text-white" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">
              Nomor Tiket
            </p>
            <p className="font-mono text-lg font-bold text-ink-900 sm:text-xl">
              {view.nomorTiket}
            </p>
            <p className="text-xs text-ink-400">
              Diajukan {formatDateTime(view.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <CopyButton text={view.nomorTiket} label="Salin Tiket" />
          <StatusBadge status={view.status} className="px-3.5 py-1.5 text-[13px]" />
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_330px]">
        {/* main column */}
        <div className="min-w-0 space-y-6">
          {/* keluhan anda */}
          <section className="animate-slide-up rounded-xl border border-ink-200 bg-white p-6 shadow-xs [animation-delay:80ms]">
            <h2 className="font-display flex items-center gap-2 text-[15px] font-bold text-ink-900">
              <ClipboardList size={17} className="text-primary-700" />
              Keluhan Anda
            </h2>
            <dl className="mt-5 grid gap-x-6 gap-y-3.5 sm:grid-cols-2">
              {info.map(([label, value]) => (
                <div key={label}>
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
                    {label}
                  </dt>
                  <dd className="mt-0.5 text-sm font-medium text-ink-800">{value}</dd>
                </div>
              ))}
              <div className="sm:col-span-2">
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
                  Kategori
                </dt>
                <dd className="mt-1">
                  <KategoriBadge nama={view.kategoriKeluhan} icon={KatIcon} color={kat.color} />
                </dd>
              </div>
            </dl>
            <div className="mt-5 border-t border-ink-100 pt-5">
              <h3 className="font-display text-sm font-bold text-ink-900">
                &ldquo;{view.judulKeluhan}&rdquo;
              </h3>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink-500">
                {view.isiKeluhan}
              </p>
              {view.fotoKeluhanUrl && (
                <div className="mt-4">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-400">
                    Foto Keluhan
                  </p>
                  <PhotoRow
                    url={view.fotoKeluhanUrl}
                    label="Foto keluhan"
                    onView={setLightbox}
                  />
                </div>
              )}
            </div>
          </section>

          {/* respons admin */}
          <section className="animate-slide-up rounded-xl border border-ink-200 bg-white p-6 shadow-xs [animation-delay:160ms]">
            <h2 className="font-display flex items-center gap-2 text-[15px] font-bold text-ink-900">
              <MessageSquareText size={17} className="text-medic-600" />
              Respons dari Admin
            </h2>
            {hasResponse && view.response ? (
              <div className="mt-4">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-400">
                  <span className="font-semibold text-ink-700">
                    {view.response.adminNama ?? "Admin SIPEKA"}
                  </span>
                  <span>Tanggal respons: {formatDateTime(view.response.createdAt)}</span>
                </div>
                <p className="mt-3 whitespace-pre-wrap rounded-lg border border-medic-100 bg-medic-50/60 p-4 text-sm leading-relaxed text-ink-700">
                  {view.response.isiResponse}
                </p>
                {view.response.fotoResponseUrl && (
                  <div className="mt-4">
                    <p className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-400">
                      Foto Respons
                    </p>
                    <PhotoRow
                      url={view.response.fotoResponseUrl}
                      label="Foto respons admin"
                      onView={setLightbox}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-4 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
                <Clock size={18} className="mt-0.5 shrink-0 text-amber-600" />
                <div>
                  <p className="text-sm font-bold text-amber-800">
                    Keluhan sedang diproses
                  </p>
                  <p className="mt-0.5 text-[13px] leading-relaxed text-amber-700">
                    Tim pengelola pengaduan sedang menindaklanjuti keluhan Anda.
                    Respons akan muncul di halaman ini — silakan cek secara berkala.
                  </p>
                </div>
              </div>
            )}
          </section>

          {/* rating */}
          {hasResponse && (
            <section className="animate-slide-up rounded-xl border border-ink-200 bg-white p-6 shadow-xs [animation-delay:240ms]">
              <h2 className="font-display flex items-center gap-2 text-[15px] font-bold text-ink-900">
                <Star size={17} className="fill-amber-400 text-amber-400" />
                Berikan Rating Kepuasan Anda
              </h2>
              {alreadyRated && view.response ? (
                <div className="mt-4 rounded-lg border border-medic-100 bg-medic-50/60 p-5">
                  <div className="flex flex-wrap items-center gap-3">
                    <StarsDisplay value={view.response.ratingKepuasan} size={18} />
                    <span className="text-sm font-bold text-ink-800">
                      {view.response.ratingKepuasan}/5 — Terima kasih atas penilaian Anda!
                    </span>
                  </div>
                  {view.response.komentarRating && (
                    <p className="mt-2 text-sm italic leading-relaxed text-ink-500">
                      &ldquo;{view.response.komentarRating}&rdquo;
                    </p>
                  )}
                </div>
              ) : (
                <div className="mt-4">
                  <p className="text-sm text-ink-500">
                    Seberapa puas Anda dengan respons kami?
                  </p>
                  <div className="mt-3">
                    <StarRating value={rating} onChange={setRating} size={32} />
                  </div>
                  <TextArea
                    value={komentar}
                    onChange={(e) => setKomentar(e.target.value)}
                    maxLength={500}
                    rows={3}
                    placeholder="Komentar tambahan (opsional)..."
                    className="mt-4 min-h-[80px]"
                  />
                  <Button
                    onClick={submitRating}
                    loading={sending}
                    variant="success"
                    className="mt-4"
                  >
                    {!sending && <Check size={16} />}
                    Kirim Rating
                  </Button>
                </div>
              )}
            </section>
          )}
        </div>

        {/* side column */}
        <aside className="space-y-6">
          <section className="animate-slide-up rounded-xl border border-ink-200 bg-white p-6 shadow-xs [animation-delay:120ms]">
            <h2 className="font-display text-[15px] font-bold text-ink-900">
              Tahapan Penanganan
            </h2>
            <div className="mt-5">
              <Timeline view={view} />
            </div>
          </section>

          <section className="animate-slide-up rounded-xl bg-primary-900 p-6 text-white [animation-delay:200ms]">
            <LifeBuoy size={22} className="text-medic-500" />
            <h2 className="font-display mt-3 text-[15px] font-bold">
              Butuh bantuan lebih lanjut?
            </h2>
            <p className="mt-1.5 text-[13px] leading-relaxed text-primary-200">
              Hubungi petugas pengelolaan pengaduan masyarakat pada jam kerja
              (Senin–Sabtu, 08.00–14.00 WITA).
            </p>
            <p className="font-display mt-3 text-sm font-bold">
              (0370) 681 437
              <span className="block text-xs font-medium text-primary-300">
                humas@rsudpatutpatuhpatju.go.id
              </span>
            </p>
          </section>
        </aside>
      </div>

      <Lightbox src={lightbox} onClose={() => setLightbox(null)} />
    </div>
  );
}
