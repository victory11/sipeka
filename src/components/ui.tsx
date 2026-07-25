"use client";

import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Star,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  useEffect,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { cx } from "@/lib/utils";
import { STATUS_META, type StatusKeluhan } from "@/lib/constants";

/* ---------- Spinner ---------- */
export function Spinner({ size = 18, className }: { size?: number; className?: string }) {
  return <Loader2 size={size} className={cx("animate-spin text-primary-700", className)} />;
}

/* ---------- Button ---------- */
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "success" | "ghost";
  loading?: boolean;
};

export function Button({
  variant = "primary",
  loading,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  const styles: Record<string, string> = {
    primary: "bg-primary-800 hover:bg-primary-700 text-white shadow-sm",
    success: "bg-medic-600 hover:bg-medic-700 text-white shadow-sm",
    secondary:
      "bg-white hover:bg-ink-50 text-ink-700 border border-ink-200 shadow-xs",
    danger: "bg-red-600 hover:bg-red-700 text-white shadow-sm",
    ghost: "hover:bg-ink-100 text-ink-500",
  };
  return (
    <button
      className={cx(
        "inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
        styles[variant],
        className,
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : null}
      {children}
    </button>
  );
}

/* ---------- Form field ---------- */
export function Field({
  label,
  required,
  error,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-ink-700">
        {label} {required && <span className="text-red-600">*</span>}
      </label>
      {children}
      {error ? (
        <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-ink-400">{hint}</p>
      ) : null}
    </div>
  );
}

export function inputCls(error?: boolean) {
  return cx(
    "w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-ink-800 outline-none transition-shadow placeholder:text-ink-400",
    error
      ? "border-red-400 focus:ring-4 focus:ring-red-100"
      : "border-ink-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-100",
  );
}

type TextInputProps = InputHTMLAttributes<HTMLInputElement> & { error?: boolean };
export function TextInput({ error, className, ...rest }: TextInputProps) {
  return <input className={cx(inputCls(error), className)} {...rest} />;
}

type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  error?: boolean;
};
export function TextArea({ error, className, ...rest }: TextAreaProps) {
  return <textarea className={cx(inputCls(error), "leading-relaxed", className)} {...rest} />;
}

export function SelectInput({
  error,
  className,
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement> & { error?: boolean }) {
  return (
    <select className={cx(inputCls(error), "cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2216%22%20height%3D%2216%22%20fill%3D%22%236b7280%22%20viewBox%3D%220%200%2016%2016%22%3E%3Cpath%20d%3D%22M4%206l4%204%204-4%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%221.5%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22/%3E%3C/svg%3E')] bg-[position:right_0.75rem_center] bg-no-repeat pr-9", className)} {...rest}>
      {children}
    </select>
  );
}

/* ---------- Badges ---------- */
export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const meta = STATUS_META[status as StatusKeluhan] ?? STATUS_META.Ditinjau;
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold",
        meta.bg,
        meta.text,
        className,
      )}
    >
      <span className={cx("h-1.5 w-1.5 rounded-full", meta.dot)} />
      {status}
    </span>
  );
}

export function KategoriBadge({
  nama,
  icon: Icon,
  color,
}: {
  nama: string;
  icon: LucideIcon;
  color: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1 text-xs font-semibold"
      style={{ backgroundColor: `${color}14`, color }}>
      <Icon size={13} />
      {nama}
    </span>
  );
}

/* ---------- Stars ---------- */
export function StarRating({
  value,
  onChange,
  size = 26,
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: number;
}) {
  const [hover, setHover] = useState(0);
  const active = hover || value;
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating kepuasan">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} bintang`}
          disabled={!onChange}
          onClick={() => onChange?.(n)}
          onMouseEnter={() => onChange && setHover(n)}
          onMouseLeave={() => onChange && setHover(0)}
          className={cx(
            "transition-transform",
            onChange && "cursor-pointer hover:-translate-y-0.5",
          )}
        >
          <Star
            size={size}
            className={
              n <= active
                ? "fill-amber-400 text-amber-400"
                : "fill-ink-200 text-ink-200"
            }
          />
        </button>
      ))}
    </div>
  );
}

export function StarsDisplay({ value, size = 14 }: { value: number | null; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size}
          className={
            value != null && n <= value
              ? "fill-amber-400 text-amber-400"
              : "fill-ink-200 text-ink-200"
          }
        />
      ))}
    </span>
  );
}

/* ---------- Modal & Lightbox ---------- */
export function Modal({
  open,
  onClose,
  children,
  maxW = "max-w-lg",
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  maxW?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="animate-fade-in absolute inset-0 bg-ink-900/60 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cx("animate-slide-up relative w-full rounded-xl bg-white shadow-pop", maxW)}
      >
        {children}
      </div>
    </div>
  );
}

export function Lightbox({ src, onClose }: { src: string | null; onClose: () => void }) {
  useEffect(() => {
    if (!src) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [src, onClose]);
  if (!src) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="animate-fade-in absolute inset-0 bg-ink-900/85" onClick={onClose} />
      <button
        onClick={onClose}
        aria-label="Tutup"
        className="absolute right-4 top-4 z-10 cursor-pointer rounded-full bg-white/15 p-2 text-white transition hover:bg-white/30"
      >
        <X size={20} />
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt="Lampiran foto"
        className="animate-slide-up relative max-h-[88vh] max-w-full rounded-lg object-contain shadow-pop"
      />
    </div>
  );
}

/* ---------- Pagination ---------- */
export function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  const pages: number[] = [];
  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
  for (let i = start; i <= Math.min(totalPages, start + 4); i++) pages.push(i);
  return (
    <div className="flex items-center justify-center gap-1.5">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        aria-label="Halaman sebelumnya"
        className="cursor-pointer rounded-lg border border-ink-200 bg-white p-2 text-ink-500 transition hover:bg-ink-50 disabled:pointer-events-none disabled:opacity-40"
      >
        <ChevronLeft size={16} />
      </button>
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={cx(
            "min-w-9 cursor-pointer rounded-lg border px-2.5 py-1.5 text-sm font-semibold transition",
            p === page
              ? "border-primary-800 bg-primary-800 text-white"
              : "border-ink-200 bg-white text-ink-500 hover:bg-ink-50",
          )}
        >
          {p}
        </button>
      ))}
      <button
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Halaman berikutnya"
        className="cursor-pointer rounded-lg border border-ink-200 bg-white p-2 text-ink-500 transition hover:bg-ink-50 disabled:pointer-events-none disabled:opacity-40"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

/* ---------- Empty state ---------- */
export function EmptyState({
  icon: Icon,
  title,
  desc,
}: {
  icon: LucideIcon;
  title: string;
  desc?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
      <div className="rounded-full bg-ink-100 p-4">
        <Icon size={26} className="text-ink-400" />
      </div>
      <p className="mt-1 font-display text-sm font-semibold text-ink-700">{title}</p>
      {desc && <p className="max-w-sm text-xs text-ink-400">{desc}</p>}
    </div>
  );
}

/* ---------- Section heading ---------- */
export function SectionHeading({
  eyebrow,
  title,
  desc,
  center,
}: {
  eyebrow?: string;
  title: string;
  desc?: string;
  center?: boolean;
}) {
  return (
    <div className={cx("mb-8", center && "text-center")}>
      {eyebrow && (
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-medic-600">
          {eyebrow}
        </p>
      )}
      <h2 className="font-display text-2xl font-bold text-ink-900 sm:text-[28px]">
        {title}
      </h2>
      {desc && (
        <p className={cx("mt-2 max-w-2xl text-sm leading-relaxed text-ink-500", center && "mx-auto")}>
          {desc}
        </p>
      )}
    </div>
  );
}
