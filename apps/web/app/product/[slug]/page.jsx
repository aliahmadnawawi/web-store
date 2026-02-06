import Link from "next/link";

export function generateMetadata({ params }) {
  const { slug } = params;
  return {
    title: "Detail Produk | Sebelas Indonesia",
    description: "Produk digital Sebelas Indonesia dengan auto-delivery.",
    alternates: {
      canonical: `https://sebelasindonesia.app/product/${slug}`,
    },
  };
}

export default function ProductDetail({ params }) {
  const { slug } = params;

  const product = {
    name: "Netflix 1 Bulan Premium",
    price: "Rp 39.000",
    desc: "Akun premium legal, auto delivery, garansi 30 hari.",
    image: "/placeholder.png",
  };

  return (
    <div className="min-h-screen bg-white px-6 py-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: product.name,
            description: product.desc,
            image: "https://sebelasindonesia.app/images/netflix-premium.jpg",
            offers: {
              "@type": "Offer",
              price: "39000",
              priceCurrency: "IDR",
              availability: "https://schema.org/InStock",
              url: `https://sebelasindonesia.app/product/${slug}`,
            },
            identifier_exists: false,
          }),
        }}
      />

      <Link className="text-sm text-brand" href="/">← Kembali</Link>
      <div className="mt-4 rounded-2xl bg-soft p-6">
        <div className="h-40 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200"></div>
        <h1 className="mt-4 text-xl font-bold font-[var(--font-poppins)]">{product.name}</h1>
        <p className="text-sm text-slate-500">{product.desc}</p>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-2xl font-bold text-ink">{product.price}</span>
          <button className="rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white active:scale-95">Beli Sekarang</button>
        </div>
      </div>
    </div>
  );
}
