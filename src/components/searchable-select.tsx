"use client";

import { Check, ChevronDown, Search, SearchX } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { cx } from "@/lib/utils";
import { inputCls } from "@/components/ui";

function Highlight({ text, query }: { text: string; query: string }) {
  const q = query.trim();
  if (!q) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded-[3px] bg-primary-100 px-0.5 text-primary-900">
        {text.slice(idx, idx + q.length)}
      </mark>
      {text.slice(idx + q.length)}
    </>
  );
}

export function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = "Pilih...",
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
  placeholder?: string;
  error?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [...options];
    return options.filter((o) => o.toLowerCase().includes(q));
  }, [options, query]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", esc);
    const t = setTimeout(() => inputRef.current?.focus(), 30);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", esc);
      clearTimeout(t);
    };
  }, [open]);

  const select = (option: string) => {
    onChange(option);
    setOpen(false);
    setQuery("");
  };

  let optionNodes: ReactNode;
  if (filtered.length === 0) {
    optionNodes = (
      <div className="flex flex-col items-center gap-1.5 px-3 py-6 text-center">
        <SearchX size={20} className="text-ink-400" />
        <p className="text-xs text-ink-500">
          Tidak ada ruangan yang cocok dengan{" "}
          <span className="font-semibold">&ldquo;{query}&rdquo;</span>
        </p>
      </div>
    );
  } else {
    optionNodes = filtered.map((option) => {
      const selected = option === value;
      return (
        <button
          key={option}
          type="button"
          onClick={() => select(option)}
          className={cx(
            "flex w-full cursor-pointer items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm transition",
            selected
              ? "bg-primary-50 font-semibold text-primary-800"
              : "text-ink-700 hover:bg-ink-100",
          )}
        >
          <span>
            <Highlight text={option} query={query} />
          </span>
          {selected && <Check size={15} className="shrink-0 text-primary-700" />}
        </button>
      );
    });
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cx(
          inputCls(error),
          "flex cursor-pointer items-center justify-between gap-2 text-left",
          !value && "text-ink-400",
        )}
      >
        <span className="truncate">{value || placeholder}</span>
        <ChevronDown
          size={16}
          className={cx("shrink-0 text-ink-400 transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="animate-fade-in absolute z-30 mt-1.5 w-full overflow-hidden rounded-lg border border-ink-200 bg-white shadow-pop">
          <div className="flex items-center gap-2 border-b border-ink-100 px-3 py-2">
            <Search size={15} className="shrink-0 text-ink-400" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari ruangan... (mis. IGD, Paviliun)"
              className="w-full bg-transparent text-sm outline-none placeholder:text-ink-400"
              aria-label="Cari ruangan pelayanan"
            />
          </div>
          <div
            role="listbox"
            className="scroll-slim max-h-60 overflow-y-auto p-1.5"
          >
            {optionNodes}
          </div>
        </div>
      )}
    </div>
  );
}
