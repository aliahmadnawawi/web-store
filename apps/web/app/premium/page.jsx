import Link from "next/link";
import ProductCard from "@/components/ProductCard";

async function getProducts() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_CATALOG_API}/products?limit=50`, { cache: "no-store" });
    const data = await res.json();
    return Array.isArray(data?.data) ? data.data : [];
  } catch {
    return [];
  }
}

export const metadata = {
  title: "Premium | Sebelas Indonesia",
  description: "Etalase premium: akun, software, dan jasa digital.",
  alternates: { canonical: "https://sebelasindonesia.app/premium" },
};

export default async function PremiumPage() {
  const products = await getProducts();

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

