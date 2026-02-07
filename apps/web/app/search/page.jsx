import Link from "next/link";
import ProductCard from "@/components/ProductCard";

async function searchProducts(q) {
  if (!q) return [];
  try {
    const url = `${process.env.NEXT_PUBLIC_CATALOG_API}/products?q=${encodeURIComponent(q)}&limit=50`;
    const res = await fetch(url, { cache: "no-store" });
    const data = await res.json();
    return Array.isArray(data?.data) ? data.data : [];
  } catch {
    return [];
  }
}

export const metadata = {
  title: "Search | Sebelas Indonesia",
  alternates: { canonical: "https://sebelasindonesia.app/search" },
};

export default async function SearchPage({ searchParams }) {
  const q = (searchParams?.q || "").trim();
  const results = await searchProducts(q);

  return (
    <div className="min-h-screen bg-soft px-6 py-6 dark:bg-slate-950">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold font-[var(--font-poppins)] text-ink dark:text-slate-100">Search</h1>
        <Link className="text-sm text-brand" href="/">Kembali</Link>
      </div>

      <form className="mt-4 rounded-2xl bg-white p-4 shadow-card dark:bg-slate-900" action="/search" method="get">
        <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Cari Produk</label>
        <div className="mt-2 flex gap-2">
          <input
            name="q"
            defaultValue={q}
            className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
            placeholder="contoh: Netflix, Spotify, Canva"
          />
          <button className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white">Cari</button>
        </div>
      </form>

      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-5">
        {results.map((p) => (
          <ProductCard key={p.id || p.slug} product={p} />
        ))}
        {q && results.length === 0 ? (
          <div className="col-span-2 rounded-2xl border border-slate-100 bg-white p-4 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 md:col-span-5">
            Tidak ada hasil untuk: <span className="font-semibold">{q}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

