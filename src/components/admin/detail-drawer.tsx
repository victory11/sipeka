"use client";

import {
  CheckCircle2,
  Download,
  Eye,
  Loader2,
  MessageSquareText,
  SendHorizonal,
  User,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import type { KeluhanView } from "@/lib/types";
import { apiFetch, ApiClientError } from "@/lib/client";
import { useAuth, useToast } from "@/components/providers";
import {
  Button,
  KategoriBadge,
  Lightbox,
  Modal,
  SelectInput,
  StarRating,
  StatusBadge,
  TextArea,
} from "@/components/ui";
import { FileUpload } from "@/components/file-upload";
import { cx, formatDateTime } from "@/lib/utils";
import { kategoriMeta } from "@/lib/kategori-icons";
import {
  STATUS_LIST,
  STATUS_META,
  type StatusKeluhan,
} from "@/lib/constants";

export function KeluhanDetailDrawer({
  id,
  scope,
  onClose,
  onChanged,
}: {
  id: string;
  scope: "masuk" | "selesai";
  onClose: () => void;
  onChanged: () => void;
}) {
  const toast = useToast();
  const { logout } = useAuth();
  const router = useRouter();

  const [view, setView] = useState<KeluhanView | null>(null);
  const [loading, setLoading] = useState(true);
  const [isiResponse, setIsiResponse] = useState("");
  const [respStatus, setRespStatus] = useState<StatusKeluhan>("Selesai");
  const [foto, setFoto] = useState<File | null>(null);
  const [fotoError, setFotoError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [successOpen, setSuccessOpen] = useState(false);

  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", h);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await apiFetch<{ view: KeluhanView }>(
          `/api/admin/keluhan/${id}`,
        );
        if (!cancelled) {
          setView(res.view);
          setIsiResponse(res.view.response?.isiResponse ?? "");
          setRespStatus("Selesai");
        }
      } catch (err) {
        if (err instanceof ApiClientError && err.status === 401) {
          logout();
          router.replace("/admin/login");
          return;
        }
        toast.push("error", err instanceof Error ? err.message : "Gagal memuat detail.");
        onClose();
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function quickStatus(status: StatusKeluhan) {
    if (!view) return;
    setStatusBusy(true);
    try {
      const res = await apiFetch<{ view: KeluhanView }>(
        `/api/admin/keluhan/${id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        },
      );
      setView(res.view);
      onChanged();
      toast.push("success", `Status diubah menjadi "${status}".`);
    } catch (err) {
      toast.push("error", err instanceof Error ? err.message : "Gagal mengubah status.");
    } finally {
      setStatusBusy(false);
    }
  }

  async function submitRespond(e: FormEvent) {
    e.preventDefault();
    if (isiResponse.trim().length < 5) {
      toast.push("error", "Isi respons wajib diisi (min. 5 karakter).");
      return;
    }
    setSending(true);
    try {
      const fd = new FormData();
      fd.append("isiResponse", isiResponse.trim());
      fd.append("status", respStatus);
      if (foto) fd.append("foto", foto);
      const res = await apiFetch<{ view: KeluhanView; message: string }>(
        `/api/admin/keluhan/${id}/respond`,
        { method: "POST", body: fd },
      );
      setView(res.view);
      onChanged();
      setSuccessOpen(true);
    } catch (err) {
      toast.push("error", err instanceof Error ? err.message : "Gagal mengirim respons.");
    } finally {
      setSending(false);
    }
  }

  const kat = view ? kategoriMeta(view.kategoriKeluhan) : null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="animate-fade-in absolute inset-0 bg-ink-900/55 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Detail keluhan"
        className="animate-slide-in absolute inset-y-0 right-0 flex w-full max-w-2xl flex-col bg-white shadow-pop"
      >
        {/* header */}
        <header className="flex items-center justify-between gap-3 border-b border-ink-200 bg-ink-50/60 px-5 py-4">
          <div className="min-w-0">
            <p className="font-mono text-sm font-bold text-primary-900">
              {view?.nomorTiket ?? "Memuat..."}
            </p>
            {view && (
              <div className="mt-1 flex items-center gap-2.5">
                <StatusBadge status={view.status} />
                <span className="text-[11px] text-ink-400">
                  Diajukan {formatDateTime(view.createdAt)}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {view && scope === "masuk" && (
              <div className="flex items-center gap-1.5">
                <SelectInput
                  value={view.status}
                  disabled={statusBusy}
                  onChange={(e) => quickStatus(e.target.value as StatusKeluhan)}
                  className="w-44 py-2 text-xs font-semibold"
                  aria-label="Ubah status keluhan"
                >
                  {STATUS_LIST.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </SelectInput>
                {statusBusy && <Loader2 size={15} className="animate-spin text-primary-700" />}
              </div>
            )}
            <button
              onClick={onClose}
              aria-label="Tutup detail"
              className="cursor-pointer rounded-lg border border-ink-200 bg-white p-2 text-ink-500 transition hover:bg-ink-100 hover:text-ink-800"
            >
              <X size={17} />
            </button>
          </div>
        </header>

        {/* body */}
        <div className="scroll-slim flex-1 overflow-y-auto">
          {loading || !view ? (
            <div className="flex items-center justify-center gap-3 py-28">
              <Loader2 size={22} className="animate-spin text-primary-700" />
              <span className="text-sm font-medium text-ink-400">Memuat detail...</span>
            </div>
          ) : (
            <div className="space-y-6 p-5 sm:p-6">
              {/* responden */}
              <section>
                <h3 className="font-display flex items-center gap-2 text-sm font-bold text-ink-900">
                  <User size={15} className="text-primary-700" />
                  Informasi Responden
                </h3>
                <dl className="mt-3.5 grid grid-cols-2 gap-x-5 gap-y-3 rounded-lg border border-ink-100 bg-ink-50/60 p-4 sm:grid-cols-3">
                  {[
                    ["Nama", view.namaLengkap],
                    ["Email", view.email],
                    ["No. Telp", view.noTelepon],
                    ["Jenis Kelamin", view.jenisKelamin],
                    ["Pendidikan", view.pendidikan],
                    ["Ruangan", view.ruanganPelayanan],
                  ].map(([label, value]) => (
                    <div key={label} className={label === "Ruangan" ? "col-span-2 sm:col-span-3" : ""}>
                      <dt className="text-[10px] font-bold uppercase tracking-wide text-ink-400">
                        {label}
                      </dt>
                      <dd className="mt-0.5 break-words text-[13px] font-medium text-ink-800">
                        {value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>

              {/* detail keluhan */}
              <section>
                <h3 className="font-display flex items-center gap-2 text-sm font-bold text-ink-900">
                  <MessageSquareText size={15} className="text-medic-600" />
                  Detail Keluhan
                </h3>
                <div className="mt-3.5 space-y-3.5">
                  <div className="flex flex-wrap items-center gap-2.5">
                    {kat && (
                      <KategoriBadge
                        nama={view.kategoriKeluhan}
                        icon={kat.icon}
                        color={kat.color}
                      />
                    )}
                    <span className="text-[11px] text-ink-400">
                      Status{" "}
                      <strong className="text-ink-600">{view.status}</strong> sejak{" "}
                      {formatDateTime(
                        view.status === "Selesai"
                          ? view.statusSelesaiAt
                          : view.status === "Sedang Diproses"
                            ? view.statusDiprosesAt
                            : view.createdAt,
                      )}
                    </span>
                  </div>
                  <div>
                    <p className="font-display text-[15px] font-bold text-ink-900">
                      &ldquo;{view.judulKeluhan}&rdquo;
                    </p>
                    <p className="mt-2 whitespace-pre-wrap rounded-lg border border-ink-100 bg-white p-4 text-sm leading-relaxed text-ink-600">
                      {view.isiKeluhan}
                    </p>
                  </div>
                  {view.fotoKeluhanUrl && (
                    <div className="flex items-center gap-3 rounded-lg border border-ink-100 bg-ink-50/60 p-2.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={view.fotoKeluhanUrl}
                        alt="Foto keluhan"
                        className="h-16 w-16 shrink-0 cursor-pointer rounded-md object-cover"
                        onClick={() => setLightbox(view.fotoKeluhanUrl)}
                      />
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => setLightbox(view.fotoKeluhanUrl)}
                          className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-ink-200 bg-white px-2.5 py-1.5 text-xs font-bold text-ink-700 transition hover:border-primary-400 hover:text-primary-700"
                        >
                          <Eye size={13} /> Lihat
                        </button>
                        <a
                          href={view.fotoKeluhanUrl}
                          download
                          className="inline-flex items-center gap-1.5 rounded-md border border-ink-200 bg-white px-2.5 py-1.5 text-xs font-bold text-ink-700 transition hover:border-primary-400 hover:text-primary-700"
                        >
                          <Download size={13} /> Unduh
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* respons existing */}
              {view.response && (
                <section>
                  <h3 className="font-display text-sm font-bold text-ink-900">
                    Respons Sebelumnya
                  </h3>
                  <div className="mt-3 rounded-lg border border-medic-100 bg-medic-50/60 p-4">
                    <p className="text-xs text-ink-400">
                      <strong className="text-ink-700">
                        {view.response.adminNama ?? "Admin SIPEKA"}
                      </strong>{" "}
                      · {formatDateTime(view.response.createdAt)}
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink-700">
                      {view.response.isiResponse}
                    </p>
                    {view.response.fotoResponseUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={view.response.fotoResponseUrl}
                        alt="Foto respons"
                        className="mt-3 h-20 w-20 cursor-pointer rounded-md object-cover"
                        onClick={() => setLightbox(view.response!.fotoResponseUrl)}
                      />
                    )}
                    {view.response.ratingKepuasan && (
                      <div className="mt-3 flex items-center gap-2 border-t border-medic-100 pt-3">
                        <StarRating value={view.response.ratingKepuasan} size={16} />
                        <span className="text-xs font-semibold text-ink-500">
                          Rating responden ({view.response.ratingKepuasan}/5)
                        </span>
                        {view.response.komentarRating && (
                          <span className="truncate text-xs italic text-ink-400">
                            — &ldquo;{view.response.komentarRating}&rdquo;
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* form respons */}
              <section className="rounded-xl border border-primary-200 bg-primary-50/40 p-4 sm:p-5">
                <h3 className="font-display text-sm font-bold text-ink-900">
                  {view.response ? "Perbarui Respons Admin" : "Form Respons Admin"}
                </h3>
                <form onSubmit={submitRespond} className="mt-4 space-y-4">
                  <div>
                    <div className="relative">
                      <TextArea
                        value={isiResponse}
                        onChange={(e) => setIsiResponse(e.target.value)}
                        maxLength={2000}
                        rows={5}
                        placeholder="Tulis respons/tindak lanjut untuk responden... (mis. permohonan maaf, tindakan yang dilakukan, dan komitmen perbaikan)"
                        className="min-h-[120px] bg-white pb-6"
                      />
                      <span className="absolute bottom-2.5 right-3 text-[11px] font-medium text-ink-400">
                        {isiResponse.length}/2000
                      </span>
                    </div>
                  </div>

                  <div>
                    <p className="mb-1.5 text-sm font-medium text-ink-700">
                      Lampir Foto Respons <span className="text-xs text-ink-400">(opsional)</span>
                    </p>
                    <FileUpload file={foto} onFile={setFoto} onError={setFotoError} compact />
                    {fotoError && (
                      <p className="mt-1.5 text-xs font-medium text-red-600">{fotoError}</p>
                    )}
                  </div>

                  <div>
                    <p className="mb-1.5 text-sm font-medium text-ink-700">
                      Ubah Status <span className="text-red-600">*</span>
                    </p>
                    <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Status keluhan">
                      {STATUS_LIST.map((s) => {
                        const meta = STATUS_META[s as StatusKeluhan];
                        const active = respStatus === s;
                        return (
                          <button
                            key={s}
                            type="button"
                            role="radio"
                            aria-checked={active}
                            onClick={() => setRespStatus(s as StatusKeluhan)}
                            className={cx(
                              "flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border px-2 py-2.5 text-xs font-bold transition-all",
                              active
                                ? "border-transparent text-white shadow-sm"
                                : "border-ink-200 bg-white text-ink-500 hover:border-ink-400",
                            )}
                            style={active ? { backgroundColor: meta.warna } : undefined}
                          >
                            <span
                              className={cx(
                                "h-2 w-2 rounded-full",
                                active ? "bg-white" : meta.dot,
                              )}
                            />
                            {s}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex flex-col-reverse gap-2.5 border-t border-primary-100 pt-4 sm:flex-row sm:justify-end">
                    <Button type="button" variant="secondary" onClick={onClose}>
                      <X size={15} /> Batal
                    </Button>
                    <Button type="submit" loading={sending} disabled={!!fotoError}>
                      {!sending && <SendHorizonal size={15} />}
                      {view.response ? "Perbarui Respons" : "Kirim Respons"}
                    </Button>
                  </div>
                </form>
              </section>
            </div>
          )}
        </div>
      </aside>

      {/* success modal */}
      <Modal open={successOpen} onClose={() => setSuccessOpen(false)} maxW="max-w-sm">
        <div className="p-7 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-medic-500 shadow-lg shadow-medic-500/30">
            <CheckCircle2 size={28} className="text-white" />
          </span>
          <h3 className="font-display mt-4 text-lg font-bold text-ink-900">
            Respons Terkirim
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-500">
            Email notifikasi telah dikirim ke responden. Keluhan kini berstatus{" "}
            <strong className="text-ink-800">{view?.status}</strong>.
          </p>
          <Button
            className="mt-5 w-full"
            onClick={() => {
              setSuccessOpen(false);
              onClose();
            }}
          >
            Kembali ke Daftar
          </Button>
        </div>
      </Modal>

      <Lightbox src={lightbox} onClose={() => setLightbox(null)} />
    </div>
  );
}
