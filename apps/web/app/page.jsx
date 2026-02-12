"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import TopSearchBar from "@/components/TopSearchBar";
import Carousel from "@/components/Carousel";
import QuickAccess from "@/components/QuickAccess";
import BentoGrid from "@/components/BentoGrid";
import ProductCard from "@/components/ProductCard";
import Skeleton from "@/components/Skeleton";
import BottomNav from "@/components/BottomNav";
import CategoryOverlay from "@/components/CategoryOverlay";
import { getSession } from "@/lib/session";

const EXCLUDED_CATEGORY_SLUGS = new Set(["game-topup", "e-voucher"]);

export default function HomePage() {
  const [openCategories, setOpenCategories] = useState(false);
  const [premium, setPremium] = useState([]);
  const [loadingPremium, setLoadingPremium] = useState(true);
  const [invoiceCode, setInvoiceCode] = useState("");
  const [invoiceStatus, setInvoiceStatus] = useState(null);
  const [lookupLoading, setLookupLoading] = useState(false);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const base = process.env.NEXT_PUBLIC_CATALOG_API;
        const [catsRes, aiRes] = await Promise.all([
          fetch(`${base}/categories`, { cache: "no-store" }).then((r) => r.json()).catch(() => ({})),
          fetch(`${process.env.NEXT_PUBLIC_AI_API}/recommendations`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: getSession().userId || null, recent_views: [] }),
            cache: "no-store",
          }).then((r) => r.json()).catch(() => ({})),
        ]);

        const cats = Array.isArray(catsRes?.data) ? catsRes.data : [];
        const excludedIds = new Set(
          cats
            .filter((c) => EXCLUDED_CATEGORY_SLUGS.has(String(c?.slug || "")))
            .map((c) => Number(c?.id))
            .filter((n) => Number.isFinite(n) && n > 0)
        );

        const aiItems = Array.isArray(aiRes?.items) ? aiRes.items : [];
        const filteredAi = aiItems.filter((p) => !excludedIds.has(Number(p?.categoryId)));
        if (filteredAi.length) {
          setPremium(filteredAi.slice(0, 10));
          return;
        }

        const res = await fetch(`${base}/products?limit=30`, { cache: "no-store" });
        const data = await res.json();
        const list = Array.isArray(data?.data) ? data.data : [];
        setPremium(list.filter((p) => !excludedIds.has(Number(p?.categoryId))).slice(0, 10));
      } catch {
        setPremium([]);
      } finally {
        setLoadingPremium(false);
      }
    };
    loadProducts();
  }, []);

  const lookup = async () => {
    const code = invoiceCode.trim();
    if (!code) return;
    setLookupLoading(true);
    setInvoiceStatus(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_ORDERS_API}/invoice/lookup/${encodeURIComponent(code)}`, { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      setInvoiceStatus(data?.status || data?.error || "unknown");
    } catch {
      setInvoiceStatus("error");
    } finally {
      setLookupLoading(false);
    }
  };

  const structuredWebsite = useMemo(() => ({
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Sebelas Indonesia",
    url: "https://sebelasindonesia.app",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://sebelasindonesia.app/search?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  }), []);

  return (
    <div className="min-h-screen pb-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredWebsite) }} />

      <TopSearchBar onOpenCategories={() => setOpenCategories(true)} />
      <Carousel />
      <QuickAccess />
      <BentoGrid />

      <section className="page-container pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold font-[var(--font-poppins)] text-ink dark:text-slate-100">Pilihan Utama</h3>
            <p className="text-xs text-slate-500 dark:text-slate-300">Produk digital favorit untuk checkout cepat</p>
          </div>
          <Link className="text-xs font-semibold text-brand" href="/premium">Lihat</Link>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <Link
            href="/premium"
            className="rounded-2xl bg-white p-4 shadow-card transition hover:-translate-y-0.5 dark:bg-slate-900"
          >
            <div className="text-xs font-semibold text-brand">Best Seller</div>
            <div className="mt-1 text-sm font-bold text-ink dark:text-slate-100">Akun Premium</div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-300">Netflix, Spotify, Canva, dan lainnya</div>
          </Link>
          <Link
            href="/categories"
            className="rounded-2xl bg-white p-4 shadow-card transition hover:-translate-y-0.5 dark:bg-slate-900"
          >
            <div className="text-xs font-semibold text-brand">Kategori</div>
            <div className="mt-1 text-sm font-bold text-ink dark:text-slate-100">Jelajahi Produk</div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-300">Akun, jasa, digital goods, software</div>
          </Link>
          <Link
            href="/terms-of-service"
            className="rounded-2xl bg-white p-4 shadow-card transition hover:-translate-y-0.5 dark:bg-slate-900"
          >
            <div className="text-xs font-semibold text-brand">Legal</div>
            <div className="mt-1 text-sm font-bold text-ink dark:text-slate-100">Ketentuan Layanan</div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-300">Aturan penggunaan layanan Sebelas Indonesia</div>
          </Link>
        </div>
      </section>

      <section className="page-container pt-6" id="premium">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold font-[var(--font-poppins)] text-ink dark:text-slate-100">Etalase Premium</h3>
            <p className="text-xs text-slate-500 dark:text-slate-300">Akun, software, dan jasa</p>
          </div>
          <Link className="text-xs font-semibold text-brand" href="/premium">Lihat Semua</Link>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5">
          {loadingPremium && Array.from({ length: 10 }).map((_, idx) => <Skeleton key={idx} />)}
          {!loadingPremium && premium.map((p) => <ProductCard key={p.id || p.slug} product={p} />)}
          {!loadingPremium && premium.length === 0 ? (
            <div className="col-span-2 rounded-2xl border border-slate-100 bg-white p-4 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 md:col-span-5">
              Produk belum tersedia. Tambahkan lewat Admin Panel.
            </div>
          ) : null}
        </div>
      </section>

      <section className="page-container pt-6">
        <div className="rounded-2xl bg-white p-4 shadow-card dark:bg-slate-900">
          <h3 className="text-lg font-bold font-[var(--font-poppins)] text-ink dark:text-slate-100">Lacak Pesanan (Guest)</h3>
          <p className="text-xs text-slate-500 dark:text-slate-300">Masukkan nomor invoice untuk cek status</p>
          <div className="mt-3 flex gap-2">
            <input
              value={invoiceCode}
              onChange={(e) => setInvoiceCode(e.target.value)}
              className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              placeholder="INV-..."
            />
            <button
              onClick={lookup}
              disabled={lookupLoading}
              className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-60 active:scale-[0.99]"
            >
              {lookupLoading ? "..." : "Cari"}
            </button>
          </div>
          {invoiceStatus ? (
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-300">Status: {invoiceStatus}</p>
          ) : null}
        </div>
      </section>

      <BottomNav />
      <CategoryOverlay open={openCategories} onClose={() => setOpenCategories(false)} />
    </div>
  );
}

