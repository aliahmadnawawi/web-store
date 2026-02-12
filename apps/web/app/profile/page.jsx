"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { clearSession, getSession } from "@/lib/session";

export default function ProfilePage() {
  const [session, setSession] = useState({ token: "", userId: "" });

  useEffect(() => {
    setSession(getSession());
  }, []);

  const logout = () => {
    clearSession();
    setSession({ token: "", userId: "" });
  };

  return (
    <div className="min-h-screen bg-soft px-6 py-6 dark:bg-slate-950">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold font-[var(--font-poppins)] text-ink dark:text-slate-100">Profile</h1>
        <Link className="text-sm text-brand" href="/">Kembali</Link>
      </div>

      <div className="mt-4 rounded-2xl bg-white p-5 shadow-card dark:bg-slate-900">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Kamu bisa belanja tanpa login (mode guest). Kalau ingin pakai keranjang dan melihat history transaksi, login sebagai member.
        </p>

        {session.token ? (
          <div className="mt-4 rounded-2xl bg-soft p-4 dark:bg-slate-950">
            <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">Status</div>
            <div className="mt-1 text-sm font-semibold text-ink dark:text-slate-100">Login sebagai member</div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-300">User ID: {session.userId || "-"}</div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href="/history" className="rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white">
                Lihat History
              </Link>
              <button onClick={logout} className="rounded-xl bg-danger px-5 py-3 text-sm font-semibold text-white">
                Logout
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/login" className="rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white">Login</Link>
            <Link href="/register" className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-ink dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100">Daftar</Link>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/premium" className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-ink dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100">
            Belanja Premium
          </Link>
          <Link href="/categories" className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-ink dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100">
            Kategori
          </Link>
          <Link href="/privacy-policy" className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-ink dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100">
            Kebijakan Privasi
          </Link>
          <Link href="/terms-of-service" className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-ink dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100">
            Ketentuan Layanan
          </Link>
        </div>
      </div>
    </div>
  );
}
