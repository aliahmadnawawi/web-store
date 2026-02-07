"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const formatIdr = (value) => {
  const n = typeof value === "number" ? value : Number(String(value || "").replace(/[^0-9]/g, ""));
  if (!Number.isFinite(n) || n <= 0) return "Rp -";
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
};

export default function InvoicePage({ params }) {
  const token = params.token;
  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_ORDERS_API}/invoice/${token}`, { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Invoice tidak ditemukan");
      setInvoice(data);
    } catch (e) {
      setInvoice(null);
      setError(e?.message || "Gagal memuat invoice");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [token]);

  const status = (invoice?.status || "").toUpperCase();
  const paid = status === "PAID";
  const payment = invoice?.payment && typeof invoice.payment === "object" ? invoice.payment : {};
  const payCode = String(payment?.payCode || "").trim();
  const qrUrl = String(payment?.qrUrl || "").trim();
  const instructions = Array.isArray(payment?.instructions) ? payment.instructions : [];
  const expiredTime = Number(payment?.expiredTime) || 0;

  const deliveries = useMemo(() => {
    const d = invoice?.deliveries;
    return Array.isArray(d) ? d : [];
  }, [invoice?.deliveries]);

  return (
    <div className="min-h-screen bg-soft px-6 py-6 dark:bg-slate-950">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold font-[var(--font-poppins)] text-ink dark:text-slate-100">Invoice</h1>
        <Link className="text-sm text-brand" href="/">Kembali</Link>
      </div>

      <div className="mt-4 rounded-2xl bg-white p-5 shadow-card dark:bg-slate-900">
        {loading ? (
          <div className="space-y-3">
            <div className="h-5 w-1/2 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
            <div className="h-10 w-full animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
            <div className="h-10 w-full animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
          </div>
        ) : error ? (
          <div className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">{error}</div>
        ) : invoice ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">Invoice Code</div>
                <div className="mt-1 font-mono text-sm text-ink dark:text-slate-100">{invoice.invoiceCode}</div>
              </div>
              <div className={`rounded-full px-3 py-1 text-xs font-semibold ${paid ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-200" : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200"}`}>
                {paid ? "PAID" : status || "PENDING"}
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-soft p-4 dark:bg-slate-950">
                <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">Produk</div>
                <div className="mt-1 text-sm font-semibold text-ink dark:text-slate-100">{invoice.productName || "Digital Product"}</div>
                <div className="mt-1 text-xs text-slate-500 dark:text-slate-300">{invoice.orderType}</div>
              </div>
              <div className="rounded-xl bg-soft p-4 dark:bg-slate-950">
                <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">Total</div>
                <div className="mt-1 text-lg font-bold text-ink dark:text-slate-100">{formatIdr(invoice.amount)}</div>
                {invoice.baseAmount && invoice.baseAmount !== invoice.amount ? (
                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-300">Base: {formatIdr(invoice.baseAmount)}</div>
                ) : null}
              </div>
            </div>

            {!paid ? (
              <div className="mt-4 rounded-2xl bg-white p-4 shadow-card dark:bg-slate-950">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">Pembayaran</div>
                    <div className="mt-1 text-sm font-semibold text-ink dark:text-slate-100">
                      {payment?.methodName || payment?.method || "Metode"}
                    </div>
                    {expiredTime ? (
                      <div className="mt-1 text-xs text-slate-500 dark:text-slate-300">
                        Expired: {new Date(expiredTime * 1000).toLocaleString("id-ID")}
                      </div>
                    ) : null}
                  </div>
                  {invoice.checkoutUrl ? (
                    <a
                      href={invoice.checkoutUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-ink dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                    >
                      Link Tripay
                    </a>
                  ) : null}
                </div>

                {payCode ? (
                  <div className="mt-4 rounded-xl bg-soft px-4 py-3 dark:bg-slate-900">
                    <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">Kode Pembayaran</div>
                    <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
                      <div className="font-mono text-sm font-bold text-ink dark:text-slate-100">{payCode}</div>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(payCode);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 900);
                          } catch {}
                        }}
                        className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white"
                      >
                        {copied ? "Tersalin" : "Copy"}
                      </button>
                    </div>
                  </div>
                ) : null}

                {qrUrl ? (
                  <div className="mt-4">
                    <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">QRIS</div>
                    <div className="mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
                      <img src={qrUrl} alt="QRIS" className="mx-auto h-56 w-56 object-contain" />
                      <div className="mt-2 text-center text-xs text-slate-500 dark:text-slate-300">
                        Scan QR dengan aplikasi e-wallet/banking yang mendukung QRIS.
                      </div>
                    </div>
                  </div>
                ) : null}

                {instructions.length ? (
                  <div className="mt-4">
                    <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">Cara Bayar</div>
                    <div className="mt-2 grid gap-3">
                      {instructions.map((g, idx) => (
                        <div key={idx} className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
                          <div className="text-sm font-semibold text-ink dark:text-slate-100">{g.title || "Instruksi"}</div>
                          {Array.isArray(g.steps) && g.steps.length ? (
                            <ol className="mt-2 list-decimal pl-5 text-xs text-slate-600 dark:text-slate-300">
                              {g.steps.map((s, sIdx) => (
                                <li key={sIdx} className="mt-1">{s}</li>
                              ))}
                            </ol>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            <button
              onClick={load}
              className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-ink transition active:scale-[0.99] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
            >
              Refresh Status
            </button>

            <div className="mt-5">
              <div className="text-sm font-bold text-ink dark:text-slate-100">Delivery</div>
              <div className="mt-2 grid gap-2">
                {deliveries.map((d) => (
                  <div key={d.id} className="rounded-xl border border-slate-100 bg-white px-4 py-3 text-sm dark:border-slate-800 dark:bg-slate-950">
                    <div className="text-xs text-slate-500 dark:text-slate-300">{d.channel || "AUTO"}</div>
                    <div className="mt-1 font-mono text-xs text-ink dark:text-slate-100">{d.payload || "-"}</div>
                  </div>
                ))}
                {deliveries.length === 0 ? (
                  <div className="rounded-xl border border-slate-100 bg-white px-4 py-3 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
                    Belum ada delivery. Jika sudah bayar, refresh beberapa kali.
                  </div>
                ) : null}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
