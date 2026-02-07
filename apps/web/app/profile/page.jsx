import Link from "next/link";

export const metadata = {
  title: "Profile | Sebelas Indonesia",
  alternates: { canonical: "https://sebelasindonesia.app/profile" },
};

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-soft px-6 py-6 dark:bg-slate-950">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold font-[var(--font-poppins)] text-ink dark:text-slate-100">Profile</h1>
        <Link className="text-sm text-brand" href="/">Kembali</Link>
      </div>

      <div className="mt-4 rounded-2xl bg-white p-5 shadow-card dark:bg-slate-900">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Mode guest sudah tersedia (lacak invoice). Login member akan ditambahkan jika dibutuhkan.
        </p>
        <div className="mt-4 flex gap-2">
          <Link href="/premium" className="rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white">Belanja</Link>
          <Link href="/categories" className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-ink dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100">Kategori</Link>
        </div>
      </div>
    </div>
  );
}

