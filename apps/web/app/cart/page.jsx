"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "@/lib/session";
import { clearCart, getCart, removeFromCart } from "@/lib/cart";

const formatIdr = (value) => {
  const n = typeof value === "number" ? value : Number(String(value || "").replace(/[^0-9]/g, ""));
  if (!Number.isFinite(n) || n <= 0) return "Rp -";
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
};

export default function CartPage() {
  const router = useRouter();
  const [session, setSession] = useState({ token: "", userId: "" });
  const [cart, setCartState] = useState([]);
  const [products, setProducts] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [paymentMethod, setPaymentMethod] = useState("BRIVA");
  const [checkoutLoading, setCheckoutLoading] = useState("");

  const reload = async () => {
    const s = getSession();
    setSession(s);
    const items = getCart();
    setCartState(items);
    if (!s.token) return;
    if (!items.length) {
      setProducts({});
      return;
    }

    setLoading(true);
    setError("");
    try {
      const entries = await Promise.all(items.map(async (it) => {
        const id = String(it.productId || "");
        const res = await fetch(`${process.env.NEXT_PUBLIC_CATALOG_API}/products/id/${encodeURIComponent(id)}`, { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) return [id, null];
        return [id, data?.data || null];
      }));
      const map = {};
      for (const [id, p] of entries) {
        if (p) map[id] = p;
      }
      setProducts(map);
    } catch (e) {
      setProducts({});
      setError(e?.message || "Gagal memuat cart");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const total = useMemo(() => {
    return cart.reduce((sum, it) => {
      const p = products[String(it.productId)];
      const price = Number(p?.price) || 0;
      const qty = Math.max(1, Number(it.qty) || 1);
      return sum + (price * qty);
    }, 0);
  }, [cart, products]);

  const remove = (productId) => {
    removeFromCart(productId);
    reload();
  };

  const clear = () => {
    clearCart();
    reload();
  };

  const checkout = async (productId) => {
    const s = getSession();
    if (!s.token || !s.userId) return;
    setCheckoutLoading(String(productId));
    setError("");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_ORDERS_API}/checkout/member`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: String(productId),
          memberId: String(s.userId),
          customerName: "Member",
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
      setError(e?.message || "Checkout gagal");
    } finally {
      setCheckoutLoading("");
    }
  };

  return (
    <div className="min-h-screen bg-soft px-6 py-6 dark:bg-slate-950">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold font-[var(--font-poppins)] text-ink dark:text-slate-100">Cart</h1>
        <Link className="text-sm text-brand" href="/">Kembali</Link>
      </div>

      {!session.token ? (
        <div className="mt-4 rounded-2xl bg-white p-5 shadow-card dark:bg-slate-900">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Keranjang hanya tersedia untuk member. Mode guest tetap bisa checkout langsung per produk.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/login" className="rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white">
              Login
            </Link>
            <Link
              href="/register"
              className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-ink dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
            >
              Daftar
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-2xl bg-white p-5 shadow-card dark:bg-slate-900">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">Total</div>
              <div className="mt-1 text-lg font-bold text-ink dark:text-slate-100">{formatIdr(total)}</div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="min-w-[180px]">
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
              <button
                onClick={reload}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-ink dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              >
                {loading ? "..." : "Refresh"}
              </button>
              <button onClick={clear} className="rounded-xl bg-danger px-4 py-2 text-sm font-semibold text-white">
                Hapus Semua
              </button>
            </div>
          </div>

          {error ? <div className="mt-4 rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">{error}</div> : null}

          <div className="mt-4 grid gap-2">
            {cart.map((it) => {
              const id = String(it.productId || "");
              const p = products[id];
              return (
                <div
                  key={id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-950"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-ink dark:text-slate-100">{p?.name || `Produk #${id}`}</div>
                    <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-300">
                      Qty: {Math.max(1, Number(it.qty) || 1)} • {formatIdr(p?.price || 0)}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => remove(id)}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-ink dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                    >
                      Hapus
                    </button>
                    <button
                      onClick={() => checkout(id)}
                      disabled={checkoutLoading === id || !p}
                      className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-60"
                    >
                      {checkoutLoading === id ? "..." : "Checkout"}
                    </button>
                  </div>
                </div>
              );
            })}

            {!loading && cart.length === 0 ? (
              <div className="rounded-xl border border-slate-100 bg-white px-4 py-3 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
                Cart kosong. Tambahkan produk dari halaman detail.
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

