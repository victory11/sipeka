"use client";

import {
  HeartPulse,
  Lock,
  Mail,
  MapPin,
  Menu,
  Phone,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { cx } from "@/lib/utils";
import { RS_PROFILE } from "@/lib/constants";

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-800 shadow-sm">
        <span className="absolute -bottom-1 -right-1 grid h-4.5 w-4.5 place-items-center rounded-md bg-medic-500 ring-2 ring-white">
          <HeartPulse size={11} className="text-white" strokeWidth={2.6} />
        </span>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
          <path
            d="M10 2.5v15M2.5 10h15"
            stroke="white"
            strokeWidth="3.4"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span className="leading-tight">
        <span
          className={cx(
            "font-display block text-[15px] font-bold",
            light ? "text-white" : "text-primary-900",
          )}
        >
          RSUD Patut Patuh Patju
        </span>
        <span
          className={cx(
            "block text-[11px] font-semibold tracking-wide",
            light ? "text-primary-200" : "text-ink-400",
          )}
        >
          SIPEKA — Layanan Pengaduan
        </span>
      </span>
    </Link>
  );
}

const NAV = [
  { href: "/", label: "Beranda" },
  { href: "/cek-status", label: "Cek Status" },
  { href: "/#tentang", label: "Tentang" },
  { href: "/#kontak", label: "Kontak" },
];

export function PublicLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-ink-200/70 bg-white/92 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
          <Logo />
          <nav className="hidden items-center gap-1 md:flex" aria-label="Navigasi utama">
            {NAV.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href.split("#")[0]) && item.href !== "/#tentang" && item.href !== "/#kontak";
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cx(
                    "rounded-lg px-3.5 py-2 text-sm font-semibold transition",
                    active
                      ? "bg-primary-50 text-primary-800"
                      : "text-ink-500 hover:bg-ink-100 hover:text-ink-800",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/login"
              className="hidden items-center gap-2 rounded-lg bg-primary-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700 md:inline-flex"
            >
              <Lock size={15} />
              Login Admin
            </Link>
            <button
              className="cursor-pointer rounded-lg border border-ink-200 p-2 text-ink-700 md:hidden"
              onClick={() => setOpen(!open)}
              aria-label={open ? "Tutup menu" : "Buka menu"}
              aria-expanded={open}
            >
              {open ? <X size={19} /> : <Menu size={19} />}
            </button>
          </div>
        </div>
        {open && (
          <div className="animate-fade-in border-t border-ink-200 bg-white px-4 py-3 md:hidden">
            <div className="flex flex-col gap-1">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-semibold text-ink-700 hover:bg-ink-100"
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="/admin/login"
                onClick={() => setOpen(false)}
                className="mt-1 inline-flex items-center justify-center gap-2 rounded-lg bg-primary-800 px-4 py-2.5 text-sm font-semibold text-white"
              >
                <Lock size={15} /> Login Admin
              </Link>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer id="kontak" className="mt-auto bg-primary-950 text-primary-100">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <Logo light />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-primary-200/90">
              Sistem Informasi Penanganan Keluhan — wujud komitmen RSUD Patut
              Patuh Patju terhadap pelayanan yang transparan dan responsif.
              Keluhan Anda adalah prioritas kami.
            </p>
          </div>
          <div>
            <h3 className="font-display text-sm font-bold text-white">
              Layanan Cepat
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {[
                { href: "/kirim-keluhan", label: "Kirim Keluhan" },
                { href: "/cek-status", label: "Cek Status Keluhan" },
                { href: "/#kategori", label: "Kategori Keluhan" },
                { href: "/admin/login", label: "Portal Admin" },
              ].map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-primary-200/90 transition hover:text-white"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-display text-sm font-bold text-white">
              Hubungi Kami
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-primary-200/90">
              <li className="flex gap-2.5">
                <MapPin size={16} className="mt-0.5 shrink-0 text-medic-500" />
                {RS_PROFILE.alamat}
              </li>
              <li className="flex gap-2.5">
                <Phone size={16} className="mt-0.5 shrink-0 text-medic-500" />
                {RS_PROFILE.telepon}
              </li>
              <li className="flex gap-2.5">
                <Mail size={16} className="mt-0.5 shrink-0 text-medic-500" />
                {RS_PROFILE.email}
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10">
          <p className="mx-auto max-w-6xl px-4 py-4 text-xs text-primary-300/70">
            © {new Date().getFullYear()} RSUD Patut Patuh Patju — Kabupaten
            Lombok Barat. Seluruh hak cipta dilindungi.
          </p>
        </div>
      </footer>
    </div>
  );
}
