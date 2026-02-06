import Link from "next/link";

const categories = [
  "Akun Premium",
  "Apps & Tools",
  "E-Voucher",
  "Game Top Up",
  "Gift Card",
  "Pulsa & Data",
  "Streaming",
  "Software License",
  "Voucher Fisik",
];

export const metadata = {
  title: "Kategori | Sebelas Indonesia",
  description: "Daftar kategori produk digital Sebelas Indonesia.",
  alternates: {
    canonical: "https://sebelasindonesia.app/categories",
  },
};

export default function CategoriesPage() {
  return (
    <div className="min-h-screen bg-white px-6 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold font-[var(--font-poppins)]">Semua Kategori</h1>
        <Link className="text-sm text-brand" href="/">Kembali</Link>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {categories.map((cat) => (
          <div key={cat} className="flex items-center justify-between rounded-2xl border border-slate-100 p-4">
            <div className="flex items-center gap-3">
              <span className="h-8 w-8 rounded-xl bg-soft"></span>
              <span className="text-sm font-semibold text-ink">{cat}</span>
            </div>
            <span className="text-slate-400">›</span>
          </div>
        ))}
      </div>
    </div>
  );
}
