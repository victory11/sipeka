"use client";

import {
  AlertCircle,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  LogIn,
  ShieldCheck,
  User,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { useAuth, useToast } from "@/components/providers";
import { Button, TextInput } from "@/components/ui";
import { apiFetch } from "@/lib/client";
import type { SanitizedAdmin } from "@/lib/types";

export default function AdminLoginPage() {
  const { admin, setSession, initializing } = useAuth();
  const toast = useToast();
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!initializing && admin) router.replace("/admin");
  }, [admin, initializing, router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!username.trim() || !password) {
      setError("Username dan password wajib diisi.");
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch<{ token: string; admin: SanitizedAdmin }>(
        "/api/admin/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: username.trim(), password }),
        },
      );
      setSession(res.token, res.admin);
      toast.push("success", `Selamat datang, ${res.admin.namaLengkap}!`);
      router.replace("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login gagal.");
      setLoading(false);
    }
  }

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-primary-950 px-4 py-10">
      <div className="bg-grid absolute inset-0" aria-hidden />
      <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-primary-700/40 blur-3xl" aria-hidden />
      <div className="absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-medic-600/25 blur-3xl" aria-hidden />

      <div className="animate-slide-up relative w-full max-w-md">
        <div className="rounded-2xl border border-white/10 bg-white p-7 shadow-pop sm:p-9">
          <div className="flex flex-col items-center text-center">
            <span className="relative grid h-14 w-14 place-items-center rounded-2xl bg-primary-800">
              <span className="absolute -bottom-1 -right-1 grid h-5.5 w-5.5 place-items-center rounded-lg bg-medic-500 ring-2 ring-white">
                <KeyRound size={12} className="text-white" />
              </span>
              <svg width="24" height="24" viewBox="0 0 20 20" fill="none" aria-hidden>
                <path d="M10 2.5v15M2.5 10h15" stroke="white" strokeWidth="3.4" strokeLinecap="round" />
              </svg>
            </span>
            <h1 className="font-display mt-4 text-xl font-bold text-ink-900">
              Admin Panel SIPEKA
            </h1>
            <p className="mt-1 text-[13px] text-ink-400">
              RSUD Patut Patuh Patju — Sistem Informasi Penanganan Keluhan
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="animate-fade-in mt-5 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3.5 text-sm font-medium text-red-700"
            >
              <AlertCircle size={17} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-700">
                Username / Email
              </label>
              <div className="relative">
                <User
                  size={16}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400"
                />
                <TextInput
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username atau email"
                  className="pl-10"
                  autoComplete="username"
                  autoFocus
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-700">
                Password
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400"
                />
                <TextInput
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  className="pl-10 pr-11"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  aria-label={showPw ? "Sembunyikan password" : "Tampilkan password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-ink-400 transition hover:text-ink-700"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <Button type="submit" loading={loading} className="w-full py-3">
              {!loading && <LogIn size={16} />}
              {loading ? "Memverifikasi..." : "Masuk ke Dashboard"}
            </Button>
          </form>

          <div className="mt-5 rounded-lg border border-dashed border-primary-300 bg-primary-50/60 p-3.5 text-center">
            <p className="text-[11px] font-bold uppercase tracking-wide text-primary-700">
              Akun demo
            </p>
            <p className="mt-1 font-mono text-[13px] font-semibold text-primary-900">
              admin <span className="text-ink-400">·</span> admin123
            </p>
            <p className="mt-0.5 text-[11px] text-ink-400">
              Sesi otomatis berakhir setelah 30 menit
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between text-xs">
          <p className="flex items-center gap-1.5 font-medium text-primary-200">
            <ShieldCheck size={14} className="text-medic-500" />
            Koneksi terenkripsi & aman
          </p>
          <Link
            href="/"
            className="font-semibold text-primary-200 underline-offset-2 transition hover:text-white hover:underline"
          >
            Kembali ke beranda
          </Link>
        </div>
      </div>
    </div>
  );
}
