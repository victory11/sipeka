"use client";

import {
  ChevronRight,
  ClipboardList,
  Home,
  Info,
  Mail,
  Phone,
  SendHorizonal,
  Undo2,
  User,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState, type FormEvent } from "react";
import { PublicLayout } from "@/components/public-layout";
import { FileUpload } from "@/components/file-upload";
import { SearchableSelect } from "@/components/searchable-select";
import { Button, Field, SelectInput, TextArea, TextInput } from "@/components/ui";
import { useToast } from "@/components/providers";
import { apiFetch } from "@/lib/client";
import { EMAIL_RE, PHONE_RE, cx } from "@/lib/utils";
import {
  KATEGORI_FORM,
  KATEGORI_LIST,
  PENDIDIKAN_LIST,
  RUANGAN_LAINNYA,
  RUANGAN_LIST,
} from "@/lib/constants";

interface FormState {
  namaLengkap: string;
  email: string;
  noTelepon: string;
  jenisKelamin: string;
  pendidikan: string;
  ruanganPelayanan: string;
  ruanganLainnya: string;
  kategoriKeluhan: string;
  judulKeluhan: string;
  isiKeluhan: string;
}

const EMPTY: FormState = {
  namaLengkap: "",
  email: "",
  noTelepon: "",
  jenisKelamin: "",
  pendidikan: "",
  ruanganPelayanan: "",
  ruanganLainnya: "",
  kategoriKeluhan: "",
  judulKeluhan: "",
  isiKeluhan: "",
};

function validateField(key: keyof FormState, value: string, form: FormState): string {
  switch (key) {
    case "namaLengkap":
      if (!value.trim()) return "Nama lengkap wajib diisi.";
      if (value.trim().length < 3) return "Nama minimal 3 karakter.";
      return "";
    case "email":
      if (!value.trim()) return "Email wajib diisi.";
      if (!EMAIL_RE.test(value.trim())) return "Format email tidak valid (contoh: nama@email.com).";
      return "";
    case "noTelepon":
      if (!value) return "No. telepon wajib diisi.";
      if (!PHONE_RE.test(value))
        return "No. telepon harus diawali 0 dan terdiri dari 10-12 digit angka.";
      return "";
    case "jenisKelamin":
      return value ? "" : "Jenis kelamin wajib dipilih.";
    case "pendidikan":
      return value ? "" : "Pendidikan terakhir wajib dipilih.";
    case "ruanganPelayanan":
      if (!value) return "Ruangan pelayanan wajib dipilih.";
      if (value === RUANGAN_LAINNYA && !form.ruanganLainnya.trim())
        return "Silakan ketik nama ruangan.";
      return "";
    case "ruanganLainnya":
      if (form.ruanganPelayanan === RUANGAN_LAINNYA && !value.trim())
        return "Silakan ketik nama ruangan Anda.";
      return "";
    case "kategoriKeluhan":
      return value ? "" : "Kategori keluhan wajib dipilih.";
    case "judulKeluhan":
      if (!value.trim()) return "Judul keluhan wajib diisi.";
      if (value.trim().length < 5) return "Judul minimal 5 karakter.";
      return "";
    case "isiKeluhan":
      if (!value.trim()) return "Isi keluhan wajib diisi.";
      if (value.trim().length < 20)
        return "Isi keluhan minimal 20 karakter agar kami dapat menindaklanjuti dengan baik.";
      return "";
  }
}

const REQUIRED_FIELDS: Array<keyof FormState> = [
  "namaLengkap",
  "email",
  "noTelepon",
  "jenisKelamin",
  "pendidikan",
  "ruanganPelayanan",
  "kategoriKeluhan",
  "judulKeluhan",
  "isiKeluhan",
];

function SectionTitle({
  no,
  icon: Icon,
  title,
  desc,
}: {
  no: string;
  icon: typeof User;
  title: string;
  desc: string;
}) {
  return (
    <div className="mb-5 flex items-center gap-3 border-b border-ink-100 pb-4">
      <span className="font-display grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary-50 text-sm font-bold text-primary-800">
        {no}
      </span>
      <div>
        <h2 className="font-display flex items-center gap-2 text-[15px] font-bold text-ink-900">
          <Icon size={16} className="text-primary-700" />
          {title}
        </h2>
        <p className="text-xs text-ink-400">{desc}</p>
      </div>
    </div>
  );
}

function KirimKeluhanForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();

  const [form, setForm] = useState<FormState>(() => {
    const katId = searchParams.get("kategori");
    const kat = KATEGORI_LIST.find((k) => k.id === katId && k.id !== "lainnya");
    return { ...EMPTY, kategoriKeluhan: kat ? kat.nama : "" };
  });
  const [foto, setFoto] = useState<File | null>(null);
  const [fotoError, setFotoError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof FormState, boolean>>>({});
  const [submitting, setSubmitting] = useState(false);

  const set = (key: keyof FormState, value: string) => {
    const next = { ...form, [key]: value };
    setForm(next);
    setErrors((prev) => ({ ...prev, [key]: validateField(key, value, next) }));
  };

  const blur = (key: keyof FormState) => {
    setTouched((prev) => ({ ...prev, [key]: true }));
    setErrors((prev) => ({ ...prev, [key]: validateField(key, form[key], form) }));
  };

  const showErr = (key: keyof FormState) =>
    touched[key] ? errors[key] || "" : "";

  const formValid = useMemo(
    () =>
      REQUIRED_FIELDS.every(
        (f) => !validateField(f, form[f], form) && form[f].trim() !== "",
      ) &&
      !(form.ruanganPelayanan === RUANGAN_LAINNYA && !form.ruanganLainnya.trim()),
    [form],
  );

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const allErrors: Partial<Record<keyof FormState, string>> = {};
    for (const f of [...REQUIRED_FIELDS, "ruanganLainnya"] as Array<keyof FormState>) {
      const err = validateField(f, form[f], form);
      if (err) allErrors[f] = err;
    }
    setTouched(Object.fromEntries(REQUIRED_FIELDS.map((f) => [f, true])));
    setErrors(allErrors);
    if (Object.keys(allErrors).length > 0) {
      toast.push("error", "Mohon lengkapi seluruh kolom yang wajib diisi.");
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      for (const [k, v] of Object.entries(form)) fd.append(k, v);
      if (foto) fd.append("foto", foto);
      const res = await apiFetch<{ tiket: string }>("/api/keluhan", {
        method: "POST",
        body: fd,
      });
      toast.push("success", "Keluhan berhasil dikirim!");
      router.push(`/sukses/${encodeURIComponent(res.tiket)}`);
    } catch (err) {
      toast.push("error", err instanceof Error ? err.message : "Gagal mengirim keluhan.");
      setSubmitting(false);
    }
  }

  const isLainnya = form.ruanganPelayanan === RUANGAN_LAINNYA;

  return (
    <div className="animate-fade-in">
      {/* page header */}
      <div className="border-b border-ink-200 bg-white">
        <div className="mx-auto max-w-3xl px-4 py-7">
          <nav className="flex items-center gap-1.5 text-xs font-medium text-ink-400" aria-label="Breadcrumb">
            <Link href="/" className="flex items-center gap-1 transition hover:text-primary-700">
              <Home size={13} /> Beranda
            </Link>
            <ChevronRight size={13} />
            <span className="text-ink-700">Kirim Keluhan</span>
          </nav>
          <h1 className="font-display mt-3 text-2xl font-bold text-ink-900">
            Formulir Pengajuan Keluhan
          </h1>
          <p className="mt-1.5 text-sm text-ink-500">
            Lengkapi data di bawah ini. Kolom bertanda{" "}
            <span className="font-semibold text-red-600">*</span> wajib diisi.
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="mx-auto max-w-3xl space-y-6 px-4 py-8" noValidate>
        {/* Section 1 */}
        <section className="rounded-xl border border-ink-200 bg-white p-6 shadow-xs">
          <SectionTitle
            no="1"
            icon={User}
            title="Data Pribadi Responden"
            desc="Identitas Anda untuk konfirmasi dan tindak lanjut"
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Nama Lengkap" required error={showErr("namaLengkap")}>
                <TextInput
                  value={form.namaLengkap}
                  maxLength={100}
                  placeholder="Masukkan nama lengkap Anda"
                  error={!!showErr("namaLengkap")}
                  onChange={(e) => set("namaLengkap", e.target.value)}
                  onBlur={() => blur("namaLengkap")}
                />
              </Field>
            </div>
            <Field label="Email" required error={showErr("email")}>
              <TextInput
                type="email"
                value={form.email}
                placeholder="contoh@email.com"
                error={!!showErr("email")}
                onChange={(e) => set("email", e.target.value)}
                onBlur={() => blur("email")}
              />
            </Field>
            <Field
              label="No. Telepon"
              required
              error={showErr("noTelepon")}
              hint="10-12 digit, diawali angka 0"
            >
              <TextInput
                type="tel"
                inputMode="numeric"
                value={form.noTelepon}
                placeholder="08xxxxxxxxxx"
                error={!!showErr("noTelepon")}
                onChange={(e) => set("noTelepon", e.target.value.replace(/[^\d]/g, "").slice(0, 12))}
                onBlur={() => blur("noTelepon")}
              />
            </Field>
          </div>
        </section>

        {/* Section 2 */}
        <section className="rounded-xl border border-ink-200 bg-white p-6 shadow-xs">
          <SectionTitle
            no="2"
            icon={Users}
            title="Informasi Responden"
            desc="Data demografis untuk keperluan statistik pelayanan"
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Jenis Kelamin" required error={showErr("jenisKelamin")}>
              <div className="grid grid-cols-2 gap-2.5" role="radiogroup" aria-label="Jenis kelamin">
                {["Laki-laki", "Perempuan"].map((jk) => (
                  <button
                    key={jk}
                    type="button"
                    role="radio"
                    aria-checked={form.jenisKelamin === jk}
                    onClick={() => {
                      set("jenisKelamin", jk);
                      setTouched((p) => ({ ...p, jenisKelamin: true }));
                    }}
                    className={cx(
                      "flex cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-semibold transition-all",
                      form.jenisKelamin === jk
                        ? "border-primary-700 bg-primary-50 text-primary-800 ring-2 ring-primary-100"
                        : "border-ink-200 bg-white text-ink-500 hover:border-primary-300",
                    )}
                  >
                    <span
                      className={cx(
                        "grid h-4 w-4 place-items-center rounded-full border-2",
                        form.jenisKelamin === jk
                          ? "border-primary-700"
                          : "border-ink-300",
                      )}
                    >
                      {form.jenisKelamin === jk && (
                        <span className="h-2 w-2 rounded-full bg-primary-700" />
                      )}
                    </span>
                    {jk}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Pendidikan Terakhir" required error={showErr("pendidikan")}>
              <SelectInput
                value={form.pendidikan}
                error={!!showErr("pendidikan")}
                onChange={(e) => {
                  set("pendidikan", e.target.value);
                  setTouched((p) => ({ ...p, pendidikan: true }));
                }}
                onBlur={() => blur("pendidikan")}
              >
                <option value="">Pilih Pendidikan</option>
                {PENDIDIKAN_LIST.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </SelectInput>
            </Field>
          </div>
        </section>

        {/* Section 3 */}
        <section className="rounded-xl border border-ink-200 bg-white p-6 shadow-xs">
          <SectionTitle
            no="3"
            icon={ClipboardList}
            title="Informasi Keluhan"
            desc="Ceritakan keluhan Anda sedetail mungkin"
          />
          <div className="space-y-5">
            <Field
              label="Ruangan Pelayanan"
              required
              error={showErr("ruanganPelayanan") || showErr("ruanganLainnya")}
              hint="Ketik untuk mencari ruangan — tersedia 26 unit layanan"
            >
              <SearchableSelect
                value={form.ruanganPelayanan}
                onChange={(v) => {
                  set("ruanganPelayanan", v);
                  setTouched((p) => ({ ...p, ruanganPelayanan: true }));
                }}
                options={RUANGAN_LIST}
                placeholder="Pilih ruangan pelayanan..."
                error={!!(showErr("ruanganPelayanan") || showErr("ruanganLainnya"))}
              />
              {isLainnya && (
                <div className="animate-slide-up mt-2.5">
                  <TextInput
                    value={form.ruanganLainnya}
                    maxLength={100}
                    placeholder="Ketik nama ruangan / unit lainnya..."
                    error={!!showErr("ruanganLainnya")}
                    onChange={(e) => set("ruanganLainnya", e.target.value)}
                    onBlur={() => blur("ruanganLainnya")}
                    autoFocus
                  />
                </div>
              )}
            </Field>

            <Field label="Kategori Keluhan" required error={showErr("kategoriKeluhan")}>
              <SelectInput
                value={form.kategoriKeluhan}
                error={!!showErr("kategoriKeluhan")}
                onChange={(e) => {
                  set("kategoriKeluhan", e.target.value);
                  setTouched((p) => ({ ...p, kategoriKeluhan: true }));
                }}
                onBlur={() => blur("kategoriKeluhan")}
              >
                <option value="">Pilih kategori keluhan...</option>
                {KATEGORI_FORM.map((k) => (
                  <option key={k.id} value={k.nama}>
                    {k.nama}
                  </option>
                ))}
              </SelectInput>
            </Field>

            <Field label="Judul Keluhan" required error={showErr("judulKeluhan")}>
              <div className="relative">
                <TextInput
                  value={form.judulKeluhan}
                  maxLength={100}
                  placeholder="Jelaskan singkat keluhan Anda"
                  error={!!showErr("judulKeluhan")}
                  onChange={(e) => set("judulKeluhan", e.target.value)}
                  onBlur={() => blur("judulKeluhan")}
                  className="pr-14"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-medium text-ink-400">
                  {form.judulKeluhan.length}/100
                </span>
              </div>
            </Field>

            <Field label="Isi Keluhan" required error={showErr("isiKeluhan")}>
              <div className="relative">
                <TextArea
                  value={form.isiKeluhan}
                  maxLength={2000}
                  rows={6}
                  placeholder="Tuliskan detail keluhan Anda di sini... (waktu kejadian, kronologi, dan harapan Anda)"
                  error={!!showErr("isiKeluhan")}
                  onChange={(e) => set("isiKeluhan", e.target.value)}
                  onBlur={() => blur("isiKeluhan")}
                  className="min-h-[150px] pb-6"
                />
                <span className="absolute bottom-2.5 right-3 text-[11px] font-medium text-ink-400">
                  {form.isiKeluhan.length}/2000
                </span>
              </div>
            </Field>

            <Field label="Lampirkan Foto" hint="Opsional — bukti pendukung mempercepat penanganan">
              <FileUpload file={foto} onFile={setFoto} onError={setFotoError} />
              {fotoError && (
                <p className="mt-1.5 text-xs font-medium text-red-600">{fotoError}</p>
              )}
            </Field>
          </div>
        </section>

        {/* info */}
        <div className="flex items-start gap-3 rounded-xl border border-primary-200 bg-primary-50/70 p-4">
          <Info size={18} className="mt-0.5 shrink-0 text-primary-700" />
          <p className="text-[13px] leading-relaxed text-primary-900">
            Keluhan Anda akan diverifikasi dan ditindaklanjuti maksimal{" "}
            <strong>3×24 jam kerja</strong>. Simpan nomor tiket yang Anda terima
            untuk memantau status penanganan.
          </p>
        </div>

        {/* Section 4: actions */}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push("/")}
            className="sm:px-6"
          >
            <Undo2 size={16} />
            Batal
          </Button>
          <Button
            type="submit"
            loading={submitting}
            disabled={!formValid}
            className="sm:min-w-56 sm:px-8"
          >
            {!submitting && <SendHorizonal size={16} />}
            {submitting ? "Mengirim..." : "Kirim Keluhan"}
          </Button>
        </div>

        <p className="flex items-center justify-center gap-1.5 pb-2 text-center text-xs text-ink-400">
          <Mail size={13} /> Email konfirmasi akan dikirim setelah keluhan diterima
          <span className="mx-1 text-ink-200">|</span>
          <Phone size={13} /> Butuh bantuan? (0370) 681 437
        </p>
      </form>
    </div>
  );
}

export default function KirimKeluhanPage() {
  return (
    <PublicLayout>
      <Suspense fallback={null}>
        <KirimKeluhanForm />
      </Suspense>
    </PublicLayout>
  );
}
