"use client";

import { AlertCircle, ArrowRight, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button, Spinner } from "@/components/ui";
import { apiFetch } from "@/lib/client";
import { cx } from "@/lib/utils";

export function normalizeTicketInput(input: string) {
  let t = input.trim().toUpperCase().replace(/\s+/g, "");
  if (!t) return "";
  if (t.startsWith("SIPEKA-")) return t;
  if (t.startsWith("SIPEKA")) return `SIPEKA-${t.slice(6).replace(/^-+/, "")}`;
  return `SIPEKA-${t.replace(/^-+/, "")}`;
}

export function TicketSearch({ prominent }: { prominent?: boolean }) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const ticket = normalizeTicketInput(value);
    if (!ticket) {
      setError("Silakan masukkan nomor tiket Anda terlebih dahulu.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await apiFetch(`/api/keluhan/${encodeURIComponent(ticket)}`);
      router.push(`/status/${encodeURIComponent(ticket)}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Nomor tiket tidak ditemukan.",
      );
      setLoading(false);
    }
  }

  return (
    <div>
      <form onSubmit={onSubmit} className="flex flex-col gap-2.5 sm:flex-row">
        <div className="relative flex-1">
          <Search
            size={17}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400"
          />
          <input
            value={value}
            onChange={(e) => {
              setValue(e.target.value.toUpperCase());
              setError("");
            }}
            placeholder="Contoh: SIPEKA-2025011512345"
            aria-label="Nomor tiket keluhan"
            className={cx(
              "w-full rounded-lg border bg-white font-semibold tracking-wide text-ink-900 outline-none transition-shadow placeholder:font-normal placeholder:tracking-normal placeholder:text-ink-400",
              prominent ? "px-4 py-3.5 pl-10 text-[15px]" : "px-3.5 py-2.5 pl-10 text-sm",
              error
                ? "border-red-400 focus:ring-4 focus:ring-red-100"
                : "border-ink-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-100",
            )}
          />
        </div>
        <Button
          type="submit"
          loading={loading}
          className={prominent ? "sm:px-7 sm:py-3.5" : ""}
        >
          {!loading && <Search size={16} />}
          Cari Tiket
        </Button>
      </form>
      {error && (
        <p
          role="alert"
          className="animate-fade-in mt-2.5 flex items-start gap-1.5 text-sm font-medium text-red-600"
        >
          <AlertCircle size={15} className="mt-0.5 shrink-0" />
          {error}
        </p>
      )}
      <p className="mt-3 text-sm text-ink-500">
        Belum punya nomor tiket?{" "}
        <Link
          href="/kirim-keluhan"
          className="inline-flex items-center gap-1 font-semibold text-primary-700 transition hover:text-primary-900"
        >
          Kirim Keluhan Sekarang
          <ArrowRight size={14} />
        </Link>
      </p>
    </div>
  );
}

export function TicketSearchLoading() {
  return <Spinner />;
}
