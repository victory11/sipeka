import {
  Activity,
  ArrowRight,
  Building2,
  CheckCircle2,
  FileText,
  MessageSquarePlus,
  PhoneCall,
  ShieldCheck,
  Star,
  Stethoscope,
  Ticket,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { count, sql } from "drizzle-orm";
import { db } from "@/db";
import { keluhan, responses } from "@/db/schema";
import { PublicLayout } from "@/components/public-layout";
import { TicketSearch } from "@/components/ticket-search";
import { StatusBadge } from "@/components/ui";
import { KATEGORI_LIST, type KategoriId } from "@/lib/constants";

export const dynamic = "force-dynamic";

const KATEGORI_ICONS: Record<string, LucideIcon> = {
  pelayanan: PhoneCall,
  administrasi: FileText,
  fasilitas: Building2,
  medis: Stethoscope,
  petugas: UserRound,
  lainnya: Star,
};

async function getLiveStats() {
  try {
    const [totalRow] = await db.select({ n: count() }).from(keluhan);
    const [selesaiRow] = await db
      .select({ n: count() })
      .from(keluhan)
      .where(sql`${keluhan.status} = 'Selesai'`);
    const [avgRow] = await db
      .select({
        avg: sql<number | null>`avg(${responses.ratingKepuasan})`,
      })
      .from(responses)
      .where(sql`${responses.ratingKepuasan} is not null`);
    return {
      total: Number(totalRow?.n ?? 0),
      selesai: Number(selesaiRow?.n ?? 0),
      avgRating: avgRow?.avg ? Math.round(Number(avgRow.avg) * 10) / 10 : null,
    };
  } catch {
    return { total: 0, selesai: 0, avgRating: null };
  }
}

export default async function HomePage() {
  const stats = await getLiveStats();

  return (
    <PublicLayout>
      {/* ============ HERO ============ */}
      <section className="relative overflow-hidden bg-primary-900">
        <div className="bg-grid absolute inset-0" aria-hidden />
        <div
          className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-primary-700/40 blur-3xl"
          aria-hidden
        />
        <div
          className="absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-medic-600/25 blur-3xl"
          aria-hidden
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 pb-28 pt-14 lg:grid-cols-[1.05fr_0.95fr] lg:pb-36 lg:pt-20">
          <div className="animate-slide-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-primary-100">
              <span className="h-1.5 w-1.5 rounded-full bg-medic-500" />
              Layanan Pengaduan Resmi RSUD Patut Patuh Patju
            </span>
            <h1 className="font-display mt-5 text-[34px] font-bold leading-[1.15] text-white sm:text-[44px]">
              Sistem Informasi
              <br />
              Penanganan Keluhan
              <span className="mt-2 block text-medic-500">(SIPEKA)</span>
            </h1>
            <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-primary-100/90">
              Keluhan Anda adalah prioritas kami. Sampaikan aspirasi, kritik,
              maupun masukan seputar layanan rumah sakit — dapatkan nomor tiket
              dan pantau tindak lanjutnya secara transparan.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/kirim-keluhan"
                className="inline-flex items-center gap-2 rounded-lg bg-medic-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-medic-600/30 transition hover:bg-medic-600 active:scale-[0.98]"
              >
                <MessageSquarePlus size={17} />
                Kirim Keluhan
              </Link>
              <Link
                href="/cek-status"
                className="inline-flex items-center gap-2 rounded-lg border border-white/25 bg-white/5 px-6 py-3 text-sm font-bold text-white backdrop-blur transition hover:bg-white/15 active:scale-[0.98]"
              >
                <Ticket size={17} />
                Cek Status Keluhan
              </Link>
            </div>
            <dl className="mt-9 flex flex-wrap gap-x-8 gap-y-4">
              {[
                {
                  label: "Keluhan diterima",
                  value: stats.total.toLocaleString("id-ID"),
                },
                {
                  label: "Telah diselesaikan",
                  value: stats.selesai.toLocaleString("id-ID"),
                },
                {
                  label: "Rating kepuasan",
                  value: stats.avgRating
                    ? `${stats.avgRating.toLocaleString("id-ID")}/5`
                    : "—",
                },
              ].map((s) => (
                <div key={s.label}>
                  <dt className="text-xs font-medium uppercase tracking-wide text-primary-300">
                    {s.label}
                  </dt>
                  <dd className="font-display mt-0.5 flex items-center gap-1.5 text-2xl font-bold text-white">
                    {s.label === "Rating kepuasan" && stats.avgRating && (
                      <Star size={18} className="fill-amber-400 text-amber-400" />
                    )}
                    {s.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative hidden lg:block">
            <div className="animate-slide-up overflow-hidden rounded-2xl border border-white/15 shadow-pop [animation-delay:120ms]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/hero-hospital.png"
                alt="Petugas layanan keluhan RSUD Patut Patuh Patju melayani pasien"
                className="h-auto w-full object-cover"
                width={1200}
                height={900}
              />
            </div>
            <div className="animate-slide-up absolute -bottom-6 -left-8 flex items-center gap-3 rounded-xl border border-ink-200 bg-white p-3.5 pr-5 shadow-pop [animation-delay:260ms]">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-medic-50">
                <Ticket size={19} className="text-medic-600" />
              </span>
              <div>
                <p className="font-mono text-[13px] font-bold text-ink-900">
                  SIPEKA-2025·····
                </p>
                <StatusBadge status="Selesai" />
              </div>
            </div>
            <div className="animate-slide-up absolute -top-5 right-6 flex items-center gap-2.5 rounded-xl border border-ink-200 bg-white px-4 py-3 shadow-pop [animation-delay:380ms]">
              <Activity size={17} className="text-primary-700" />
              <p className="text-xs font-bold text-ink-800">
                Tracking real-time
                <span className="block font-medium text-ink-400">
                  Setiap tahapan tercatat
                </span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============ TICKET SEARCH ============ */}
      <section className="relative z-10 mx-auto -mt-16 max-w-3xl px-4 lg:-mt-20">
        <div className="animate-slide-up rounded-2xl border border-ink-200 bg-white p-6 shadow-card sm:p-8">
          <div className="mb-4 flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary-800">
              <Ticket size={21} className="text-white" />
            </span>
            <div>
              <h2 className="font-display text-lg font-bold text-ink-900">
                Cek Status Keluhan Anda
              </h2>
              <p className="text-xs text-ink-400">
                Masukkan nomor tiket e-ticket yang Anda terima saat mengirim keluhan
              </p>
            </div>
          </div>
          <TicketSearch prominent />
        </div>
      </section>

      {/* ============ CATEGORIES ============ */}
      <section id="kategori" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 lg:py-20">
        <div className="mb-9">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-medic-600">
            Menu Keluhan
          </p>
          <h2 className="font-display text-2xl font-bold text-ink-900 sm:text-[28px]">
            Apa yang ingin Anda keluhkan?
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-500">
            Pilih kategori yang paling sesuai agar keluhan Anda langsung
            diteruskan ke unit yang berwenang.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {KATEGORI_LIST.map((kat) => {
            const Icon = KATEGORI_ICONS[kat.id] ?? Star;
            return (
              <Link
                key={kat.id}
                href={`/kirim-keluhan?kategori=${kat.id}`}
                className="group rounded-xl border border-ink-200 bg-white p-5 shadow-xs transition-all hover:-translate-y-1 hover:border-primary-300 hover:shadow-card"
              >
                <span
                  className="grid h-12 w-12 place-items-center rounded-xl transition-transform group-hover:scale-105"
                  style={{ backgroundColor: `${kat.warna}14`, color: kat.warna }}
                >
                  <Icon size={22} />
                </span>
                <h3 className="font-display mt-4 text-[15px] font-bold text-ink-900">
                  {kat.nama}
                </h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-ink-500">
                  {kat.deskripsi}
                </p>
                <span
                  className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-bold transition-all group-hover:gap-2.5"
                  style={{ color: kat.warna }}
                >
                  Buat Keluhan
                  <ArrowRight size={15} />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ============ ALUR ============ */}
      <section className="border-y border-ink-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="mb-10 text-center">
            <h2 className="font-display text-2xl font-bold text-ink-900 sm:text-[28px]">
              Alur Penanganan Keluhan
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-ink-500">
              Tiga langkah sederhana dari laporan hingga penyelesaian.
            </p>
          </div>
          <ol className="relative grid gap-8 md:grid-cols-3 md:gap-6">
            <div
              className="absolute left-0 right-0 top-7 hidden border-t-2 border-dashed border-ink-200 md:block"
              aria-hidden
            />
            {[
              {
                icon: MessageSquarePlus,
                title: "Kirim Keluhan",
                desc: "Isi formulir pengajuan keluhan beserta bukti foto bila ada.",
                color: "#1E40AF",
              },
              {
                icon: Ticket,
                title: "Terima Nomor Tiket",
                desc: "Sistem menerbitkan nomor tiket SIPEKA sebagai bukti laporan Anda.",
                color: "#D97706",
              },
              {
                icon: Star,
                title: "Pantau & Beri Rating",
                desc: "Ikuti status penanganan dan nilai kepuasan Anda atas respons kami.",
                color: "#059669",
              },
            ].map((step, i) => (
              <li key={step.title} className="relative flex gap-4 md:flex-col md:items-center md:text-center">
                <span
                  className="relative z-10 grid h-14 w-14 shrink-0 place-items-center rounded-2xl ring-8 ring-white"
                  style={{ backgroundColor: `${step.color}14`, color: step.color }}
                >
                  <step.icon size={24} />
                  <span
                    className="font-display absolute -right-1.5 -top-1.5 grid h-6 w-6 place-items-center rounded-full text-[11px] font-bold text-white"
                    style={{ backgroundColor: step.color }}
                  >
                    {i + 1}
                  </span>
                </span>
                <div>
                  <h3 className="font-display text-[15px] font-bold text-ink-900">
                    {step.title}
                  </h3>
                  <p className="mt-1 text-[13px] leading-relaxed text-ink-500">
                    {step.desc}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ============ TENTANG ============ */}
      <section id="tentang" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 lg:py-20">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-medic-600">
              Tentang SIPEKA
            </p>
            <h2 className="font-display text-2xl font-bold text-ink-900 sm:text-[28px]">
              Komitmen Kami terhadap Pelayanan Prima
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-500">
              SIPEKA adalah kanal resmi penanganan keluhan masyarakat terhadap
              layanan RSUD Patut Patuh Patju. Setiap laporan dicatat, ditinjau,
              dan ditindaklanjuti oleh tim pengelola pengaduan secara
              terukur — sesuai amanat Permenkes tentang pengelolaan pengaduan
              masyarakat di fasilitas pelayanan kesehatan.
            </p>
            <ul className="mt-6 grid gap-3.5 sm:grid-cols-2">
              {[
                "Identitas pelapor terjaga",
                "Tindak lanjut terukur & tercatat",
                "Pantauan status real-time",
                "Rating kepuasan transparan",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm font-medium text-ink-700">
                  <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-medic-600" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative overflow-hidden rounded-2xl bg-primary-900 p-7 text-white sm:p-9">
            <div className="bg-grid absolute inset-0" aria-hidden />
            <div className="relative">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-white/10">
                <ShieldCheck size={24} className="text-medic-500" />
              </span>
              <blockquote className="font-display mt-5 text-xl font-semibold leading-snug sm:text-2xl">
                &ldquo;Setiap keluhan adalah hadiah untuk memperbaiki mutu
                layanan kami.&rdquo;
              </blockquote>
              <p className="mt-3 text-sm text-primary-200">
                — Tim Pengelola Pengaduan Masyarakat, RSUD Patut Patuh Patju
              </p>
              <div className="mt-7 rounded-xl border border-white/15 bg-white/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary-300">
                  Butuh bantuan segera?
                </p>
                <p className="font-display mt-1.5 text-lg font-bold">
                  IGD 24 Jam: (0370) 681 437
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
