"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { clearSession, getSession } from "@/lib/session";

const formatIdr = (value) => {
  const n = typeof value === "number" ? value : Number(String(value || "").replace(/[^0-9]/g, ""));
  if (!Number.isFinite(n) || n <= 0) return "Rp -";
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
};

export default function HistoryPage() {
  const [session, setSession] = useState({ token: "", userId: "" });
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    setSession(getSession());
  }, []);

  const load = async () => {
    const s = getSession();
    setSession(s);
    if (!s.token) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_ORDERS_API}/me/invoices?limit=50`, {
        headers: { Authorization: `Bearer ${s.token}` },
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Gagal memuat history");
      setItems(Array.isArray(data?.data) ? data.data : []);
    } catch (e) {
      setItems([]);
      setError(e?.message || "Gagal memuat history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session.token) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.token]);

  const logout = () => {
    clearSession();
    setSession({ token: "", userId: "" });
    setItems([]);
  };

  return (
    <div className="min-h-screen bg-soft px-6 py-6 dark:bg-slate-950">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold font-[var(--font-poppins)] text-ink dark:text-slate-100">History</h1>
        <Link className="text-sm text-brand" href="/">Kembali</Link>
      </div>

      {!session.token ? (
        <div className="mt-4 rounded-2xl bg-white p-5 shadow-card dark:bg-slate-900">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Kamu sedang belanja sebagai guest. History & keranjang hanya tersedia untuk member.
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
          <p className="mt-4 text-xs text-slate-500 dark:text-slate-300">
            Guest tetap bisa checkout. Untuk lacak pesanan, gunakan fitur lacak invoice di beranda.
          </p>
        </div>
      ) : (
        <div className="mt-4 rounded-2xl bg-white p-5 shadow-card dark:bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs text-slate-500 dark:text-slate-300">User: {session.userId || "-"}</div>
            <div className="flex gap-2">
              <button
                onClick={load}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-ink dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              >
                {loading ? "..." : "Refresh"}
              </button>
              <button
                onClick={logout}
                className="rounded-xl bg-danger px-4 py-2 text-sm font-semibold text-white"
              >
                Logout
              </button>
            </div>
          </div>

          {error ? <div className="mt-4 rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">{error}</div> : null}

          <div className="mt-4 grid gap-2">
            {items.map((inv) => (
              <Link
                key={inv.invoiceCode}
                href={`/invoice/${inv.token}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white px-4 py-3 text-sm transition hover:bg-soft dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900"
              >
                <div className="min-w-0">
                  <div className="truncate font-semibold text-ink dark:text-slate-100">{inv.productName || inv.invoiceCode}</div>
                  <div className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-300">{inv.invoiceCode} • {inv.status}</div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-sm font-bold text-ink dark:text-slate-100">{formatIdr(inv.amount)}</div>
                  <div className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-300">{inv.createdAt ? new Date(inv.createdAt).toLocaleString("id-ID") : ""}</div>
                </div>
              </Link>
            ))}
            {!loading && items.length === 0 ? (
              <div className="rounded-xl border border-slate-100 bg-white px-4 py-3 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
                Belum ada transaksi.
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

