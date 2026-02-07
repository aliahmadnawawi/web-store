import Link from "next/link";

export const metadata = {
  title: "Kategori | Sebelas Indonesia",
  description: "Daftar kategori produk digital Sebelas Indonesia.",
  alternates: {
    canonical: "https://sebelasindonesia.app/categories",
  },
};

async function getCategories() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_CATALOG_API}/categories`, { next: { revalidate: 60 } });
    const data = await res.json();
    const cats = Array.isArray(data?.data) ? data.data : [];
    return cats.filter((c) => !["game-topup", "e-voucher"].includes(String(c?.slug || "")));
  } catch {
    return [];
  }
}

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="min-h-screen bg-soft px-6 py-6 dark:bg-slate-950">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold font-[var(--font-poppins)] text-ink dark:text-slate-100">Semua Kategori</h1>
        <Link className="text-sm text-brand" href="/">Kembali</Link>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {categories.map((cat) => (
          <Link
            key={cat.slug || cat.id}
            href={`/category/${cat.slug}`}
            className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-4 transition hover:border-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
          >
            <div className="flex items-center gap-3">
              <span className="h-8 w-8 rounded-xl bg-soft dark:bg-slate-800"></span>
              <span className="text-sm font-semibold text-ink dark:text-slate-100">{cat.name}</span>
            </div>
            <span className="text-slate-400 dark:text-slate-500">&gt;</span>
          </Link>
        ))}
        {categories.length === 0 && (
          <div className="rounded-2xl border border-slate-100 bg-white p-4 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
            Kategori belum tersedia.
          </div>
        )}
      </div>
    </div>
  );
}
