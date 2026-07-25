"use client";

import { Mail, MessageCircle } from "lucide-react";

export function ShareButtons({ ticket }: { ticket: string }) {
  const share = () => {
    const url = `${window.location.origin}/status/${encodeURIComponent(ticket)}`;
    return `Nomor tiket keluhan SIPEKA saya: ${ticket}. Pantau status penanganan di: ${url}`;
  };
  return (
    <div className="flex flex-wrap gap-2.5">
      <a
        href={`https://wa.me/?text=${encodeURIComponent(share())}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-lg border border-ink-200 bg-white px-3.5 py-2 text-xs font-bold text-ink-700 transition hover:border-medic-500 hover:text-medic-700 active:scale-95"
      >
        <MessageCircle size={14} className="text-medic-600" />
        Bagikan via WhatsApp
      </a>
      <a
        href={`mailto:?subject=${encodeURIComponent(`Nomor Tiket SIPEKA: ${ticket}`)}&body=${encodeURIComponent(share())}`}
        className="inline-flex items-center gap-2 rounded-lg border border-ink-200 bg-white px-3.5 py-2 text-xs font-bold text-ink-700 transition hover:border-primary-400 hover:text-primary-700 active:scale-95"
      >
        <Mail size={14} className="text-primary-700" />
        Bagikan via Email
      </a>
    </div>
  );
}
