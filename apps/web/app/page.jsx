"use client";

import { useEffect, useState } from "react";
import TopSearchBar from "@/components/TopSearchBar";
import Carousel from "@/components/Carousel";
import QuickAccess from "@/components/QuickAccess";
import BentoGrid from "@/components/BentoGrid";
import Countdown from "@/components/Countdown";
import ProductCard from "@/components/ProductCard";
import Skeleton from "@/components/Skeleton";
import BottomNav from "@/components/BottomNav";
import CategoryOverlay from "@/components/CategoryOverlay";

const products = [
  { name: "Netflix 1 Bulan Premium", desc: "Akun shared legal", price: "Rp 39.000", tag: "Best", hot: true },
  { name: "Spotify Family 1 Bulan", desc: "Auto delivery", price: "Rp 28.000", tag: "Promo", hot: false },
  { name: "MLBB 86 Diamonds", desc: "Top up instan", price: "Rp 22.500", tag: "Flash", hot: true },
  { name: "Pulsa Telkomsel 50K", desc: "24 jam", price: "Rp 51.500", tag: "Hot", hot: false },
  { name: "Canva Pro 1 Bulan", desc: "Garansi 30 hari", price: "Rp 19.000", tag: "Deal", hot: true },
];

export default function HomePage() {
  const [openCategories, setOpenCategories] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [loadingRec, setLoadingRec] = useState(true);
  const [ppobCategories, setPpobCategories] = useState([]);
  const [ppobProducts, setPpobProducts] = useState([]);
  const [loadingPpob, setLoadingPpob] = useState(true);
  const [invoiceCode, setInvoiceCode] = useState("");
  const [invoiceStatus, setInvoiceStatus] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_AI_API}/recommendations`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: null, recent_views: [] }),
        });
        const data = await res.json();
        setRecommendations(data.items || []);
      } catch (e) {
        setRecommendations([]);
      } finally {
        setLoadingRec(false);
      }
    };

    load();
  }, []);

  useEffect(() => {
    const loadPpob = async () => {
      try {
        const [catRes, prodRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_CATALOG_API}/ppob/prepaid/categories`),
          fetch(`${process.env.NEXT_PUBLIC_CATALOG_API}/ppob/prepaid/products`),
        ]);
        const catData = await catRes.json();
        const prodData = await prodRes.json();
        setPpobCategories(catData.data || catData?.data?.data || []);
        setPpobProducts(prodData.data || prodData?.data?.data || []);
      } catch (e) {
        setPpobCategories([]);
        setPpobProducts([]);
      } finally {
        setLoadingPpob(false);
      }
    };

    loadPpob();
  }, []);

  return (
    <div className="min-h-screen pb-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "Sebelas Indonesia",
            url: "https://sebelasindonesia.app",
            potentialAction: {
              "@type": "SearchAction",
              target: "https://sebelasindonesia.app/search?q={search_term_string}",
              "query-input": "required name=search_term_string",
            },
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: "https://sebelasindonesia.app/" },
              { "@type": "ListItem", position: 2, name: "Kategori", item: "https://sebelasindonesia.app/categories" },
            ],
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: "Netflix 1 Bulan Premium",
            description: "Akun premium legal dengan auto-delivery.",
            image: "https://sebelasindonesia.app/images/netflix-premium.jpg",
            offers: {
              "@type": "Offer",
              price: "39000",
              priceCurrency: "IDR",
              availability: "https://schema.org/InStock",
              url: "https://sebelasindonesia.app/product/netflix-1-bulan",
            },
            identifier_exists: false,
          }),
        }}
      />
      <TopSearchBar onOpenCategories={() => setOpenCategories(true)} />
      <Carousel />
      <QuickAccess />
      <BentoGrid />

      <section className="page-container pt-6" id="ppob">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold font-[var(--font-poppins)]">PPOB Pulsa & Data</h3>
            <p className="text-xs text-slate-500">Semua produk PPOB dari Tripay</p>
          </div>
          <button className="text-xs font-semibold text-brand">Lihat Semua</button>
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
          {loadingPpob && Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="h-8 w-24 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
          ))}
          {!loadingPpob &&
            ppobCategories.map((cat) => (
              <span
                key={cat.id || cat.product_id || cat.name}
                className="whitespace-nowrap rounded-full bg-soft px-3 py-1 text-xs text-ink dark:bg-slate-800 dark:text-slate-100"
              >
                {cat.product_name || cat.name || cat.product || cat.category_name}
              </span>
            ))}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5">
          {loadingPpob && Array.from({ length: 5 }).map((_, idx) => <Skeleton key={idx} />)}
          {!loadingPpob &&
            ppobProducts.slice(0, 10).map((item) => (
              <div key={item.code || item.product_id || item.product_name} className="rounded-2xl bg-white p-3 shadow-card dark:bg-slate-900">
                <div className="text-xs text-slate-500">{item.operator_name || item.operator || item.brand || "PPOB"}</div>
                <div className="mt-1 text-sm font-semibold text-ink dark:text-slate-100">
                  {item.product_name || item.name || item.description}
                </div>
                <div className="mt-2 text-sm font-bold text-brand">
                  {item.price || item.harga || item.product_price || item.selling_price || "Rp -"}
                </div>
                <button className="mt-3 w-full rounded-full bg-brand px-3 py-1 text-xs font-semibold text-white transition active:scale-95">
                  Beli
                </button>
              </div>
            ))}
        </div>
      </section>

      <section className="page-container pt-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold font-[var(--font-poppins)]">Flash Sale Digital</h3>
            <p className="text-xs text-slate-500">Berakhir dalam hitungan detik</p>
          </div>
          <Countdown target={new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString()} />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5">
          {products.map((product) => (
            <ProductCard key={product.name} product={product} />
          ))}
        </div>
      </section>

      <section className="page-container pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold font-[var(--font-poppins)]">Rekomendasi Untukmu</h3>
            <p className="text-xs text-slate-500">Dipilih oleh AI Sebelas</p>
          </div>
          <button className="text-xs font-semibold text-brand">Lihat Semua</button>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5">
          {loadingRec && Array.from({ length: 5 }).map((_, idx) => <Skeleton key={idx} />)}
          {!loadingRec && recommendations.map((item) => (
            <ProductCard
              key={item.id}
              product={{ name: item.name, desc: "AI pick", price: "Rp 29.000", tag: "AI", hot: false }}
            />
          ))}
        </div>
      </section>

      <section className="page-container pt-6">
        <div className="rounded-2xl bg-white p-4 shadow-card">
          <h3 className="text-lg font-bold font-[var(--font-poppins)]">Lacak Pesanan (Guest)</h3>
          <p className="text-xs text-slate-500">Masukkan nomor invoice untuk cek status</p>
          <div className="mt-3 flex gap-2">
            <input
              value={invoiceCode}
              onChange={(e) => setInvoiceCode(e.target.value)}
              className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm"
              placeholder="INV-2026-0001"
            />
            <button
              onClick={async () => {
                try {
                  const res = await fetch(`${process.env.NEXT_PUBLIC_ORDERS_API}/invoice/lookup/${invoiceCode}`);
                  const data = await res.json();
                  setInvoiceStatus(data.status || data.error);
                } catch (e) {
                  setInvoiceStatus("error");
                }
              }}
              className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white active:scale-95"
            >
              Cari
            </button>
          </div>
          {invoiceStatus && <p className="mt-2 text-xs text-slate-500">Status: {invoiceStatus}</p>}
        </div>
      </section>

      <BottomNav />
      <CategoryOverlay open={openCategories} onClose={() => setOpenCategories(false)} />
    </div>
  );
}
