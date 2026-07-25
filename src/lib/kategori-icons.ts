import {
  Building2,
  FileText,
  PhoneCall,
  Star,
  Stethoscope,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { KATEGORI_LIST } from "@/lib/constants";

export const KATEGORI_ICONS: Record<string, LucideIcon> = {
  pelayanan: PhoneCall,
  administrasi: FileText,
  fasilitas: Building2,
  medis: Stethoscope,
  petugas: UserRound,
  lainnya: Star,
};

export function kategoriMeta(nama: string): {
  icon: LucideIcon;
  color: string;
} {
  const found = KATEGORI_LIST.find((k) => k.nama === nama);
  return {
    icon: (found && KATEGORI_ICONS[found.id]) || Star,
    color: found?.warna ?? "#64748B",
  };
}
