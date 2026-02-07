import Link from "next/link";

export const metadata = {
  title: "Cart | Sebelas Indonesia",
  alternates: { canonical: "https://sebelasindonesia.app/cart" },
};

export default function CartPage() {
  return (
    <div className="min-h-screen bg-soft px-6 py-6 dark:bg-slate-950">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold font-[var(--font-poppins)] text-ink dark:text-slate-100">Cart</h1>
        <Link className="text-sm text-brand" href="/">Kembali</Link>
      </div>

      <div className="mt-4 rounded-2xl bg-white p-5 shadow-card dark:bg-slate-900">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Saat ini checkout menggunakan sistem direct checkout per produk (tanpa keranjang).
        </p>
        <div className="mt-4 flex gap-2">
          <Link href="/premium" className="rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white">Lihat Premium</Link>
          <Link href="/ppob" className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-ink dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100">Lihat PPOB</Link>
        </div>
      </div>
    </div>
  );
}

