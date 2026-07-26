"use client";
/// <reference types="react" />

import { FileImage, ImagePlus, Trash2, UploadCloud } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { cx } from "@/lib/utils";

const OK_TYPES = ["image/jpeg", "image/png"];
const MAX = 3 * 1024 * 1024;

export function FileUpload({
  file,
  onFile,
  onError,
  compact,
}: {
  file: File | null;
  onFile: (f: File | null) => void;
  onError?: (msg: string | null) => void;
  compact?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const preview = useMemo(
    () => (file ? URL.createObjectURL(file) : null),
    [file],
  );
  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  function validate(f: File): string | null {
    if (!OK_TYPES.includes(f.type)) return "Format file harus JPG, JPEG, atau PNG.";
    if (f.size > MAX) return "Ukuran file melebihi 3MB.";
    return null;
  }

  function handle(f: File | null) {
    if (!f) return;
    const err = validate(f);
    onError?.(err);
    if (!err) onFile(f);
  }

  if (file && preview) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-ink-200 bg-white p-2.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={preview}
          alt="Pratinjau lampiran"
          className="h-16 w-16 shrink-0 rounded-md object-cover"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink-800">{file.name}</p>
          <p className="text-xs text-ink-400">
            {(file.size / 1024 / 1024).toFixed(2)} MB · JPG/PNG
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            onFile(null);
            onError?.(null);
          }}
          aria-label="Hapus foto"
          className="cursor-pointer rounded-lg p-2 text-red-500 transition hover:bg-red-50"
        >
          <Trash2 size={17} />
        </button>
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        handle(e.dataTransfer.files?.[0] ?? null);
      }}
      className={cx(
        "flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed text-center transition-all",
        compact ? "px-4 py-5" : "px-4 py-8",
        dragging
          ? "border-primary-500 bg-primary-50"
          : "border-ink-200 bg-ink-50/60 hover:border-primary-400 hover:bg-primary-50/40",
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,image/jpeg,image/png"
        className="hidden"
        onChange={(e) => {
          handle(e.target.files?.[0] ?? null);
          e.target.value = "";
        }}
      />
      {dragging ? (
        <UploadCloud size={26} className="text-primary-600" />
      ) : (
        <span className="grid h-11 w-11 place-items-center rounded-full bg-primary-100">
          <ImagePlus size={20} className="text-primary-700" />
        </span>
      )}
      <p className="text-sm font-semibold text-ink-700">
        Seret foto ke sini atau <span className="text-primary-700">klik untuk memilih</span>
      </p>
      <p className="flex items-center gap-1.5 text-xs text-ink-400">
        <FileImage size={13} /> File maksimal 3MB, format JPG/PNG
      </p>
    </div>
  );
}
