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
import { IconBolt, IconGamepad, IconPhone, IconTicket, IconWifi } from "@/components/Icons";

const unwrapList = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload.data)) return payload.data;
  if (payload.data && Array.isArray(payload.data.data)) return payload.data.data;
  return [];
};

const normCat = (c) => {
  const id = c?.category_id || c?.id || c?.categoryId;
  const name = c?.category_name || c?.name || c?.category || c?.product_name;
  const type = c?.type || "";
  return { id: String(id || ""), name: String(name || ""), type: String(type || "") };
};

const iconFor = (name) => {
  const n = (name || "").toLowerCase();
  if (n.includes("pulsa")) return IconPhone;
  if (n.includes("data")) return IconWifi;
  if (n.includes("game")) return IconGamepad;
  if (n.includes("token") || n.includes("pln") || n.includes("listrik")) return IconBolt;
  if (n.includes("wifi") || n.includes("internet")) return IconWifi;
  if (n.includes("voucher")) return IconTicket;
  return IconTicket;
};

export default function HomePage() {
  const [openCategories, setOpenCategories] = useState(false);

  const [premium, setPremium] = useState([]);
  const [loadingPremium, setLoadingPremium] = useState(true);

  const [ppobCats, setPpobCats] = useState([]);
  const [loadingPpob, setLoadingPpob] = useState(true);

  const [invoiceCode, setInvoiceCode] = useState("");
  const [invoiceStatus, setInvoiceStatus] = useState(null);
  const [lookupLoading, setLookupLoading] = useState(false);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_CATALOG_API}/products?limit=10`, { cache: "no-store" });
        const data = await res.json();
        setPremium(Array.isArray(data?.data) ? data.data : []);
      } catch {
        setPremium([]);
      } finally {
        setLoadingPremium(false);
      }
    };
    loadProducts();
  }, []);

  useEffect(() => {
    const loadPpob = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_CATALOG_API}/ppob/prepaid/categories`, { cache: "no-store" });
        const data = await res.json();
        setPpobCats(unwrapList(data).map(normCat).filter((c) => c.id && c.name).slice(0, 12));
      } catch {
        setPpobCats([]);
      } finally {
        setLoadingPpob(false);
      }
    };
    loadPpob();
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

      <section className="page-container pt-6" id="promo">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold font-[var(--font-poppins)] text-ink dark:text-slate-100">Promo Hari Ini</h3>
            <p className="text-xs text-slate-500 dark:text-slate-300">Pilih yang kamu butuh, langsung checkout</p>
          </div>
          <Link className="text-xs font-semibold text-brand" href="/premium">Lihat</Link>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <Link
            href="/premium"
            className="rounded-2xl bg-white p-4 shadow-card transition hover:-translate-y-0.5 dark:bg-slate-900"
          >
            <div className="text-xs font-semibold text-brand">Flash Sale</div>
            <div className="mt-1 text-sm font-bold text-ink dark:text-slate-100">Akun Premium</div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-300">Netflix, Spotify, Canva</div>
          </Link>
          <Link
            href="/ppob/go/game"
            className="rounded-2xl bg-white p-4 shadow-card transition hover:-translate-y-0.5 dark:bg-slate-900"
          >
            <div className="text-xs font-semibold text-brand">Top Up</div>
            <div className="mt-1 text-sm font-bold text-ink dark:text-slate-100">Game</div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-300">MLBB, FF, Valorant</div>
          </Link>
          <Link
            href="/ppob/go/pln"
            className="rounded-2xl bg-white p-4 shadow-card transition hover:-translate-y-0.5 dark:bg-slate-900"
          >
            <div className="text-xs font-semibold text-brand">Tagihan</div>
            <div className="mt-1 text-sm font-bold text-ink dark:text-slate-100">Token PLN</div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-300">Isi ID, pilih nominal</div>
          </Link>
        </div>
      </section>

      <section className="page-container pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold font-[var(--font-poppins)] text-ink dark:text-slate-100">PPOB</h3>
            <p className="text-xs text-slate-500 dark:text-slate-300">Pulsa, data, token PLN, game, voucher</p>
          </div>
          <Link className="text-xs font-semibold text-brand" href="/ppob">Lihat Semua</Link>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-3 sm:grid-cols-6 md:grid-cols-8">
          {loadingPpob && Array.from({ length: 8 }).map((_, idx) => (
            <div key={idx} className="h-20 animate-pulse rounded-2xl bg-white shadow-card dark:bg-slate-900" />
          ))}
          {!loadingPpob && ppobCats.map((c) => {
            const Icon = iconFor(c.name);
            return (
              <Link
                key={c.id}
                href={`/ppob/prepaid/${c.id}`}
                className="rounded-2xl border border-slate-100 bg-white p-3 text-center transition active:scale-[0.99] dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-soft text-slate-700 dark:bg-slate-800 dark:text-slate-100">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="mt-2 line-clamp-2 text-[11px] font-semibold text-ink dark:text-slate-100">{c.name}</div>
              </Link>
            );
          })}
          {!loadingPpob && ppobCats.length === 0 ? (
            <div className="col-span-4 rounded-2xl border border-slate-100 bg-white p-4 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 sm:col-span-6 md:col-span-8">
              PPOB belum tersedia. Pastikan `TRIPAY_PPOB_API_KEY` sudah di-set di server.
            </div>
          ) : null}
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
