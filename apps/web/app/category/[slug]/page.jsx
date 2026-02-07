import Link from "next/link";
import ProductCard from "@/components/ProductCard";

async function getCategories() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_CATALOG_API}/categories`, { next: { revalidate: 60 } });
    const data = await res.json();
    return Array.isArray(data?.data) ? data.data : [];
  } catch {
    return [];
  }
}

async function getProducts(categoryId) {
  try {
    const url = `${process.env.NEXT_PUBLIC_CATALOG_API}/products?categoryId=${encodeURIComponent(categoryId)}&limit=50`;
    const res = await fetch(url, { cache: "no-store" });
    const data = await res.json();
    return Array.isArray(data?.data) ? data.data : [];
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }) {
  const slug = params.slug;
  return {
    title: `Kategori ${slug} | Sebelas Indonesia`,
    alternates: { canonical: `https://sebelasindonesia.app/category/${slug}` },
  };
}

export default async function CategorySlugPage({ params }) {
  const slug = params.slug;
  const categories = await getCategories();
  const cat = categories.find((c) => c.slug === slug);
  const products = cat?.id ? await getProducts(cat.id) : [];

  return (
    <div className="min-h-screen bg-soft px-6 py-6 dark:bg-slate-950">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold font-[var(--font-poppins)] text-ink dark:text-slate-100">
          {cat?.name || "Kategori"}
        </h1>
        <Link className="text-sm text-brand" href="/categories">Kembali</Link>
      </div>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">Pilih produk, lalu checkout.</p>

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5">
        {products.map((p) => (
          <ProductCard key={p.id || p.slug} product={p} />
        ))}
        {cat && products.length === 0 && (
          <div className="col-span-2 rounded-2xl border border-slate-100 bg-white p-4 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 md:col-span-5">
            Produk di kategori ini belum tersedia.
          </div>
        )}
        {!cat && (
          <div className="col-span-2 rounded-2xl border border-slate-100 bg-white p-4 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 md:col-span-5">
            Kategori tidak ditemukan.
          </div>
        )}
      </div>
    </div>
  );
}

