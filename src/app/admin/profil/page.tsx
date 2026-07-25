"use client";

import { KeyRound, Save, ShieldCheck, UserCircle2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useAuth, useToast } from "@/components/providers";
import { Button, Field, TextInput } from "@/components/ui";
import { apiFetch, ApiClientError } from "@/lib/client";
import { EMAIL_RE, PHONE_RE, formatDate } from "@/lib/utils";
import type { SanitizedAdmin } from "@/lib/types";

export default function AdminProfilPage() {
  const { admin, updateAdmin, logout } = useAuth();
  const toast = useToast();

  const [nama, setNama] = useState(admin?.namaLengkap ?? "");
  const [email, setEmail] = useState(admin?.email ?? "");
  const [telepon, setTelepon] = useState(admin?.noTelepon ?? "");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [pwLama, setPwLama] = useState("");
  const [pwBaru, setPwBaru] = useState("");
  const [pwKonfirmasi, setPwKonfirmasi] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState("");

  if (!admin) return null;

  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!nama.trim()) errs.nama = "Nama admin wajib diisi.";
    if (!EMAIL_RE.test(email.trim())) errs.email = "Format email tidak valid.";
    if (telepon.trim() && !PHONE_RE.test(telepon.trim()))
      errs.telepon = "No. telepon harus 10-12 digit dan diawali angka 0.";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSaving(true);
    try {
      const res = await apiFetch<{ admin: SanitizedAdmin }>("/api/admin/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          namaLengkap: nama.trim(),
          email: email.trim(),
          noTelepon: telepon.trim() || null,
        }),
      });
      updateAdmin(res.admin);
      toast.push("success", "Profil berhasil disimpan.");
    } catch (err) {
      toast.push("error", err instanceof Error ? err.message : "Gagal menyimpan profil.");
    } finally {
      setSaving(false);
    }
  }

  async function changePassword(e: FormEvent) {
    e.preventDefault();
    setPwError("");
    if (!pwLama || !pwBaru) {
      setPwError("Password lama dan baru wajib diisi.");
      return;
    }
    if (pwBaru.length < 6) {
      setPwError("Password baru minimal 6 karakter.");
      return;
    }
    if (pwBaru !== pwKonfirmasi) {
      setPwError("Konfirmasi password baru tidak cocok.");
      return;
    }
    setPwSaving(true);
    try {
      await apiFetch("/api/admin/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passwordLama: pwLama, passwordBaru: pwBaru }),
      });
      toast.push("success", "Password berhasil diubah. Gunakan password baru saat login berikutnya.");
      setPwLama("");
      setPwBaru("");
      setPwKonfirmasi("");
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 401) {
        logout();
        return;
      }
      setPwError(err instanceof Error ? err.message : "Gagal mengubah password.");
    } finally {
      setPwSaving(false);
    }
  }

  return (
    <div className="animate-fade-in mx-auto max-w-3xl space-y-6">
      {/* kartu profil */}
      <div className="rounded-xl border border-ink-200 bg-white p-6 shadow-xs">
        <div className="flex items-center gap-4 border-b border-ink-100 pb-5">
          <span className="font-display grid h-16 w-16 place-items-center rounded-2xl bg-primary-800 text-xl font-bold text-white">
            {admin.namaLengkap
              .split(" ")
              .slice(0, 2)
              .map((w) => w[0])
              .join("")
              .toUpperCase()}
          </span>
          <div>
            <h2 className="font-display text-lg font-bold text-ink-900">
              {admin.namaLengkap}
            </h2>
            <p className="text-sm text-ink-400">
              @{admin.username} · Admin sejak {formatDate(admin.createdAt)}
            </p>
          </div>
        </div>

        <form onSubmit={saveProfile} className="mt-5 grid gap-5 sm:grid-cols-2" noValidate>
          <div className="sm:col-span-2">
            <Field label="Nama Admin" required error={errors.nama}>
              <TextInput
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                maxLength={100}
                error={!!errors.nama}
                placeholder="Nama lengkap"
              />
            </Field>
          </div>
          <Field label="Email" required error={errors.email}>
            <TextInput
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={!!errors.email}
              placeholder="admin@rsudppp.go.id"
            />
          </Field>
          <Field label="No. Telepon" error={errors.telepon} hint="Opsional">
            <TextInput
              type="tel"
              value={telepon}
              onChange={(e) => setTelepon(e.target.value.replace(/[^\d]/g, "").slice(0, 12))}
              error={!!errors.telepon}
              placeholder="08xxxxxxxxxx"
            />
          </Field>
          <div className="flex justify-end sm:col-span-2">
            <Button type="submit" loading={saving}>
              {!saving && <Save size={15} />}
              Simpan Perubahan
            </Button>
          </div>
        </form>
      </div>

      {/* ubah password */}
      <div className="rounded-xl border border-ink-200 bg-white p-6 shadow-xs">
        <h3 className="font-display flex items-center gap-2 text-[15px] font-bold text-ink-900">
          <KeyRound size={17} className="text-primary-700" />
          Ubah Password
        </h3>
        <p className="mt-1 text-xs text-ink-400">
          Demi keamanan, sesi login lain akan tetap aktif hingga masa sesi berakhir (30 menit).
        </p>
        {pwError && (
          <p role="alert" className="animate-fade-in mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
            {pwError}
          </p>
        )}
        <form onSubmit={changePassword} className="mt-5 grid gap-5 sm:grid-cols-3" noValidate>
          <Field label="Password Lama" required>
            <TextInput
              type="password"
              value={pwLama}
              onChange={(e) => setPwLama(e.target.value)}
              autoComplete="current-password"
              placeholder="Password saat ini"
            />
          </Field>
          <Field label="Password Baru" required>
            <TextInput
              type="password"
              value={pwBaru}
              onChange={(e) => setPwBaru(e.target.value)}
              autoComplete="new-password"
              placeholder="Min. 6 karakter"
            />
          </Field>
          <Field label="Konfirmasi Password Baru" required>
            <TextInput
              type="password"
              value={pwKonfirmasi}
              onChange={(e) => setPwKonfirmasi(e.target.value)}
              autoComplete="new-password"
              placeholder="Ulangi password baru"
            />
          </Field>
          <div className="sm:col-span-3">
            <Button type="submit" variant="secondary" loading={pwSaving}>
              {!pwSaving && <ShieldCheck size={15} />}
              Perbarui Password
            </Button>
          </div>
        </form>
      </div>

      <p className="flex items-center justify-center gap-1.5 pb-2 text-center text-xs text-ink-400">
        <UserCircle2 size={13} />
        Masuk sebagai {admin.email}
      </p>
    </div>
  );
}
