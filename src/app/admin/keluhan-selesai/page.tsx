import { KeluhanListPage } from "@/components/admin/keluhan-table";

export const metadata = {
  title: "Keluhan Selesai — Admin SIPEKA",
};

export default function AdminKeluhanSelesaiPage() {
  return <KeluhanListPage scope="selesai" />;
}
