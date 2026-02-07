"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { addToCart } from "@/lib/cart";
import { getSession } from "@/lib/session";

const formatIdr = (value) => {
  const n = typeof value === "number" ? value : Number(String(value || "").replace(/[^0-9]/g, ""));
  if (!Number.isFinite(n) || n <= 0) return "Rp -";
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
};

export default function ProductDetailPage({ params }) {
  const router = useRouter();
  const slug = params.slug;

  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState(null);
  const [error, setError] = useState("");

  const [contact, setContact] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("BRIVA");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [isMember, setIsMember] = useState(false);

  useEffect(() => {
    setIsMember(Boolean(getSession().token));
  }, []);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_CATALOG_API}/products/${slug}`, { cache: "no-store" });
        const data = await res.json();
        if (!mounted) return;
        if (!res.ok) throw new Error(data?.error || "Produk tidak ditemukan");
        setProduct(data?.data || null);
      } catch (e) {
        if (!mounted) return;
        setProduct(null);
        setError(e?.message || "Gagal memuat produk");
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [slug]);

  const canCheckout = useMemo(() => {
    if (!product?.id) return false;
    return contact.trim().length >= 6;
  }, [product?.id, contact]);

  const doCheckout = async () => {
    if (!canCheckout) return;
    setCheckoutLoading(true);
    setCheckoutError("");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_ORDERS_API}/checkout/guest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: String(product.id),
          contact: contact.trim(),
          customerName: "Guest",
          paymentMethod,
          deviceFingerprint: "web",
          attempts: 1,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Checkout gagal");
      const url = data?.invoiceUrl || "";
      const token = String(url).split("/invoice/")[1] || "";
      if (!token) throw new Error("Invoice token missing");
      router.push(`/invoice/${token}`);
    } catch (e) {
      setCheckoutError(e?.message || "Checkout gagal");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const meta = useMemo(() => {
    if (!product) return null;
    return {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      description: product.description || "",
      image: product.image ? `https://sebelasindonesia.app${product.image}` : undefined,
      offers: {
        "@type": "Offer",
        price: String(product.price || 0),
        priceCurrency: "IDR",
        availability: "https://schema.org/InStock",
        url: `https://sebelasindonesia.app/product/${slug}`,
      },
      identifier_exists: false,
    };
  }, [product, slug]);

  return (
    <div className="min-h-screen bg-soft px-6 py-6 dark:bg-slate-950">
      {meta ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(meta) }} />
      ) : null}

      <Link className="text-sm text-brand" href="/premium">{"<- Kembali"}</Link>

      <div className="mt-4 overflow-hidden rounded-2xl bg-white shadow-card dark:bg-slate-900">
        <div className="relative h-44 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900">
          {product?.image ? (
            <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
          ) : null}
        </div>

        <div className="p-5">
          {loading ? (
            <div className="space-y-3">
              <div className="h-6 w-2/3 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
              <div className="h-10 w-full animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
            </div>
          ) : product ? (
            <>
              <h1 className="text-xl font-bold font-[var(--font-poppins)] text-ink dark:text-slate-100">{product.name}</h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">{product.description || "Produk digital dengan proses cepat."}</p>

              <div className="mt-4 flex items-center justify-between">
                <span className="text-2xl font-bold text-ink dark:text-slate-100">{formatIdr(product.price)}</span>
                <span className="rounded-full bg-soft px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-200">
                  Instant delivery
                </span>
              </div>

              <div className="mt-5 grid gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Kontak (Email / WhatsApp)</label>
                  <input
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                    placeholder="contoh: 08123456789 atau email@domain.com"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Metode Pembayaran</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                  >
                    <option value="BRIVA">BRIVA</option>
                    <option value="BCAVA">BCA VA</option>
                    <option value="MANDIRIVA">Mandiri VA</option>
                    <option value="QRIS">QRIS</option>
                  </select>
                </div>

                {checkoutError ? <div className="rounded-xl bg-danger/10 px-3 py-2 text-xs text-danger">{checkoutError}</div> : null}

              <button
                onClick={doCheckout}
                disabled={!canCheckout || checkoutLoading}
                className="rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white transition disabled:opacity-60 active:scale-[0.99]"
              >
                {checkoutLoading ? "Memproses..." : "Beli Sekarang"}
              </button>
              {isMember ? (
                <button
                  type="button"
                  onClick={() => {
                    if (!product?.id) return;
                    addToCart(product.id, 1);
                    router.push("/cart");
                  }}
                  disabled={!product?.id}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-ink transition active:scale-[0.99] dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                >
                  Tambah ke Keranjang
                </button>
              ) : (
                <Link
                  href="/login"
                  className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-center text-sm font-semibold text-ink transition active:scale-[0.99] dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                >
                  Login untuk Keranjang
                </Link>
              )}
              <p className="text-xs text-slate-500 dark:text-slate-300">
                Setelah checkout, kamu akan diarahkan ke halaman invoice untuk melanjutkan pembayaran.
              </p>
            </div>
          </>
          ) : (
            <div className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">{error || "Produk tidak tersedia"}</div>
          )}
        </div>
      </div>
    </div>
  );
}
