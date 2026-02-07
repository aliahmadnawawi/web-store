import Link from "next/link";

export const metadata = {
  title: "Pembayaran | Sebelas Indonesia",
  alternates: { canonical: "https://sebelasindonesia.app/payment/return" },
};

export default function PaymentReturnPage({ searchParams }) {
  const status = String(searchParams?.status || "").toUpperCase();
  const ref = String(searchParams?.merchant_ref || searchParams?.reference || "");

  return (
    <div className="min-h-screen bg-soft px-6 py-6 dark:bg-slate-950">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold font-[var(--font-poppins)] text-ink dark:text-slate-100">Pembayaran</h1>
        <Link className="text-sm text-brand" href="/">Home</Link>
      </div>

      <div className="mt-4 rounded-2xl bg-white p-5 shadow-card dark:bg-slate-900">
        <div className="text-sm font-semibold text-ink dark:text-slate-100">Status</div>
        <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">{status || "UNKNOWN"}</div>

        {ref ? (
          <div className="mt-4">
            <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">Merchant Ref</div>
            <div className="mt-1 font-mono text-sm text-ink dark:text-slate-100">{ref}</div>
          </div>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-2">
          <Link href="/premium" className="rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white">Belanja Lagi</Link>
          <Link href="/" className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-ink dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100">Kembali</Link>
        </div>

        <p className="mt-4 text-xs text-slate-500 dark:text-slate-300">
          Jika status sudah PAID tapi delivery belum muncul, buka halaman invoice lalu klik Refresh Status.
        </p>
      </div>
    </div>
  );
}

