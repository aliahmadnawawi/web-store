"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const unwrapList = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload.data)) return payload.data;
  if (payload.data && Array.isArray(payload.data.data)) return payload.data.data;
  return [];
};

const normalize = (v) => String(v ?? "").trim();

const formatIdr = (value) => {
  const n = typeof value === "number" ? value : Number(String(value || "").replace(/[^0-9]/g, ""));
  if (!Number.isFinite(n) || n <= 0) return "Rp -";
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
};

export default function PpobPostpaidCategoryPage({ params }) {
  const router = useRouter();
  const categoryId = params.categoryId;

  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState("");

  const [customerNumber, setCustomerNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("BRIVA");

  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [catRes, prodRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_CATALOG_API}/ppob/postpaid/categories`, { cache: "no-store" }),
          fetch(`${process.env.NEXT_PUBLIC_CATALOG_API}/ppob/postpaid/products?category_id=${encodeURIComponent(categoryId)}`, { cache: "no-store" }),
        ]);
        const [catData, prodData] = await Promise.all([
          catRes.json().catch(() => ({})),
          prodRes.json().catch(() => ({})),
        ]);
        if (!mounted) return;
        const cats = unwrapList(catData);
        const cat = cats.find((c) => String(c?.category_id || c?.id) === String(categoryId)) || null;
        setCategory(cat);
        setProducts(unwrapList(prodData));
      } catch (e) {
        if (!mounted) return;
        setError(e?.message || "Gagal memuat PPOB");
        setCategory(null);
        setProducts([]);
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [categoryId]);

  const catName = normalize(category?.category_name || category?.name || `Kategori ${categoryId}`);

  const inputReady = useMemo(() => {
    return normalize(customerNumber).length >= 6 && normalize(phone).length >= 8;
  }, [customerNumber, phone]);

  const doCheckout = async (item) => {
    if (!inputReady) return;
    setCheckoutLoading(true);
    setCheckoutError("");
    try {
      const code = normalize(item?.product_id || item?.code || item?.productId);
      if (!code) throw new Error("Kode produk tidak valid");
      const res = await fetch(`${process.env.NEXT_PUBLIC_ORDERS_API}/checkout/ppob/postpaid`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product: code,
          phone: normalize(phone),
          customerNumber: normalize(customerNumber),
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

  return (
    <div className="min-h-screen bg-soft px-6 py-6 dark:bg-slate-950">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold font-[var(--font-poppins)] text-ink dark:text-slate-100">{catName}</h1>
        <Link className="text-sm text-brand" href="/ppob">Kembali</Link>
      </div>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">Isi nomor/ID dulu, lalu pilih layanan untuk cek tagihan dan bayar.</p>

      <div className="mt-4 rounded-2xl bg-white p-4 shadow-card dark:bg-slate-900">
        <div className="grid gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">ID Pelanggan</label>
            <input
              value={customerNumber}
              onChange={(e) => setCustomerNumber(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              placeholder="contoh: 1234567890"
              inputMode="numeric"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Nomor HP</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              placeholder="contoh: 08123456789"
              inputMode="numeric"
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
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-ink dark:text-slate-100">Layanan</h2>
          <div className="text-xs text-slate-500 dark:text-slate-300">{products.length} item</div>
        </div>

        {!inputReady ? (
          <div className="mt-3 rounded-2xl border border-slate-100 bg-white p-4 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
            Isi ID pelanggan dan nomor HP terlebih dulu.
          </div>
        ) : loading ? (
          <div className="mt-3 rounded-2xl border border-slate-100 bg-white p-4 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
            Memuat layanan...
          </div>
        ) : error ? (
          <div className="mt-3 rounded-2xl border border-slate-100 bg-white p-4 text-sm text-danger dark:border-slate-800 dark:bg-slate-900">{error}</div>
        ) : (
          <div className="mt-3 overflow-hidden rounded-2xl border border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900">
            {products.map((p) => (
              <button
                key={p.code || p.product_id || p.id || p.product_name}
                onClick={() => doCheckout(p)}
                disabled={!inputReady || checkoutLoading}
                className="flex w-full items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 text-left transition hover:bg-soft disabled:opacity-60 dark:border-slate-800 dark:hover:bg-slate-950"
                type="button"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-ink dark:text-slate-100">{p.product_name || p.name}</div>
                  <div className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-300">Cek tagihan lalu bayar</div>
                </div>
                <div className="shrink-0 text-sm font-bold text-brand">{formatIdr(p.price)}</div>
              </button>
            ))}
            {products.length === 0 ? (
              <div className="px-4 py-4 text-sm text-slate-500 dark:text-slate-300">Layanan tidak ditemukan.</div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

