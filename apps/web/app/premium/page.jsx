import Link from "next/link";
import ProductCard from "@/components/ProductCard";

const EXCLUDED_CATEGORY_SLUGS = new Set(["game-topup", "e-voucher"]);

async function getJson(url) {
  try {
    const res = await fetch(url, { cache: "no-store" });
    const data = await res.json();
    return { ok: res.ok, data };
  } catch {
    return { ok: false, data: null };
  }
}

export const metadata = {
  title: "Premium | Sebelas Indonesia",
  description: "Etalase premium: akun, software, dan jasa digital.",
  alternates: { canonical: "https://sebelasindonesia.app/premium" },
};

export default async function PremiumPage() {
  const base = process.env.NEXT_PUBLIC_CATALOG_API;
  const [catsRes, prodRes] = await Promise.all([
    getJson(`${base}/categories`),
    getJson(`${base}/products?limit=80`),
  ]);

  const cats = Array.isArray(catsRes?.data?.data) ? catsRes.data.data : [];
  const excludedIds = new Set(
    cats
      .filter((c) => EXCLUDED_CATEGORY_SLUGS.has(String(c?.slug || "")))
      .map((c) => Number(c?.id))
      .filter((n) => Number.isFinite(n) && n > 0)
  );

  const rawProducts = Array.isArray(prodRes?.data?.data) ? prodRes.data.data : [];
  const products = rawProducts.filter((p) => {
    const cid = Number(p?.categoryId);
    return !excludedIds.has(cid);
  });

  return (
    <div className="min-h-screen bg-soft px-6 py-6 dark:bg-slate-950">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold font-[var(--font-poppins)] text-ink dark:text-slate-100">Etalase Premium</h1>
        <Link className="text-sm text-brand" href="/">Kembali</Link>
      </div>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">Akun premium, software, dan jasa dengan instant delivery.</p>

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5">
        {products.map((p) => (
          <ProductCard key={p.id || p.slug} product={p} />
        ))}
        {products.length === 0 ? (
          <div className="col-span-2 rounded-2xl border border-slate-100 bg-white p-4 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 md:col-span-5">
            Produk belum tersedia. Tambahkan lewat Admin Panel.
          </div>
        ) : null}
      </div>
    </div>
  );
}
