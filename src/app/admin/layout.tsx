"use client";

import {
  CheckCircle2,
  HeartPulse,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  UserCircle2,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useAuth, useToast } from "@/components/providers";
import { Spinner } from "@/components/ui";
import { cx } from "@/lib/utils";

const NAV: Array<{ href: string; label: string; icon: LucideIcon }> = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/keluhan-masuk", label: "Keluhan Masuk", icon: Inbox },
  { href: "/admin/keluhan-selesai", label: "Keluhan Selesai", icon: CheckCircle2 },
  { href: "/admin/profil", label: "Profil", icon: UserCircle2 },
];

function initials(nama: string) {
  return nama
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { admin, initializing, logout } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!initializing && !admin && pathname !== "/admin/login") {
      router.replace("/admin/login");
    }
  }, [initializing, admin, router, pathname]);

  if (pathname === "/admin/login") return <>{children}</>;

  if (initializing || !admin) {
    return (
      <div className="grid min-h-screen place-items-center bg-ink-50">
        <div className="flex flex-col items-center gap-3">
          <Spinner size={30} />
          <p className="text-sm font-medium text-ink-400">Memuat panel admin...</p>
        </div>
      </div>
    );
  }

  const activeNav = NAV.find((n) =>
    n.href === "/admin" ? pathname === "/admin" : pathname.startsWith(n.href),
  );

  const handleLogout = () => {
    logout();
    toast.push("info", "Anda telah keluar dari panel admin.");
    router.replace("/admin/login");
  };

  const sidebar = (
    <div className="flex h-full flex-col bg-primary-950">
      <div className="flex items-center gap-2.5 border-b border-white/10 px-5 py-5">
        <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/10">
          <span className="absolute -bottom-1 -right-1 grid h-4.5 w-4.5 place-items-center rounded-md bg-medic-500 ring-2 ring-primary-950">
            <HeartPulse size={11} className="text-white" strokeWidth={2.6} />
          </span>
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden>
            <path d="M10 2.5v15M2.5 10h15" stroke="white" strokeWidth="3.2" strokeLinecap="round" />
          </svg>
        </span>
        <div className="leading-tight">
          <p className="font-display text-sm font-bold text-white">SIPEKA</p>
          <p className="text-[11px] text-primary-300">RSUD Patut Patuh Patju</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-5" aria-label="Navigasi admin">
        <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-primary-400">
          Menu Utama
        </p>
        {NAV.map((item) => {
          const active =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cx(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all",
                active
                  ? "bg-medic-500 text-white shadow-md shadow-medic-600/25"
                  : "text-primary-200 hover:bg-white/8 hover:text-white",
              )}
              aria-current={active ? "page" : undefined}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-3 rounded-lg bg-white/5 p-3">
          <span className="font-display grid h-9 w-9 shrink-0 place-items-center rounded-full bg-medic-500 text-xs font-bold text-white">
            {initials(admin.namaLengkap)}
          </span>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-[13px] font-bold text-white">
              {admin.namaLengkap}
            </p>
            <p className="truncate text-[11px] text-primary-300">@{admin.username}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="mt-2.5 flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-white/15 px-3 py-2.5 text-sm font-semibold text-primary-100 transition hover:bg-red-500/20 hover:text-red-200"
        >
          <LogOut size={16} />
          Keluar
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-ink-50">
      {/* desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 lg:block">
        {sidebar}
      </aside>

      {/* mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="animate-fade-in absolute inset-0 bg-ink-900/60"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="animate-slide-in absolute inset-y-0 left-0 w-64 shadow-pop">
            {sidebar}
          </aside>
        </div>
      )}

      <div className="lg:pl-60">
        <header className="sticky top-0 z-20 flex h-15 items-center justify-between gap-3 border-b border-ink-200 bg-white/92 px-4 backdrop-blur-md lg:px-7">
          <div className="flex items-center gap-3">
            <button
              className="cursor-pointer rounded-lg border border-ink-200 p-2 text-ink-700 lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Buka menu navigasi"
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <div>
              <h1 className="font-display text-[15px] font-bold text-ink-900">
                {activeNav?.label ?? "Admin"}
              </h1>
              <p className="hidden text-[11px] text-ink-400 sm:block">
                Panel Pengelolaan Pengaduan Masyarakat
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="hidden text-right leading-tight sm:block">
              <span className="block text-[13px] font-bold text-ink-800">
                {admin.namaLengkap}
              </span>
              <span className="block text-[11px] text-ink-400">Admin SIPEKA</span>
            </span>
            <span className="font-display grid h-9 w-9 place-items-center rounded-full bg-primary-800 text-xs font-bold text-white">
              {initials(admin.namaLengkap)}
            </span>
          </div>
        </header>
        <main className="p-4 lg:p-7">{children}</main>
      </div>
    </div>
  );
}
