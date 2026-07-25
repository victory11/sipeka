import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "SIPEKA — Sistem Informasi Penanganan Keluhan | RSUD Patut Patuh Patju",
  description:
    "Sampaikan keluhan Anda tentang layanan RSUD Patut Patuh Patju dan pantau penanganannya secara real-time melalui nomor tiket e-ticket.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link
          rel="icon"
          href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%231E40AF'/%3E%3Cpath d='M16 7v18M7 16h18' stroke='%23fff' stroke-width='4' stroke-linecap='round'/%3E%3C/svg%3E"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
