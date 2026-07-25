"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { cx } from "@/lib/utils";

export function CopyButton({
  text,
  label = "Salin",
  className,
}: {
  text: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }
  return (
    <button
      type="button"
      onClick={copy}
      className={cx(
        "inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition-all active:scale-95",
        copied
          ? "border-medic-500 bg-medic-50 text-medic-700"
          : "border-ink-200 bg-white text-ink-500 hover:border-primary-300 hover:text-primary-700",
        className,
      )}
      aria-label={`Salin ${label}`}
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
      {copied ? "Tersalin!" : label}
    </button>
  );
}
