import { KeluhanListPage } from "@/components/admin/keluhan-table";

export const metadata = {
  title: "Keluhan Masuk — Admin SIPEKA",
};

export default function AdminKeluhanMasukPage() {
  return <KeluhanListPage scope="masuk" />;
}
