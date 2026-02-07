"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function CategoryOverlay({ open, onClose }) {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    if (!open) return;
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_CATALOG_API}/categories`, { cache: "no-store" });
        const data = await res.json();
        if (!mounted) return;
        setCategories(Array.isArray(data?.data) ? data.data : []);
      } catch {
        if (!mounted) return;
        setCategories([]);
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm">
      <div className="absolute inset-0 overflow-y-auto bg-white p-6 dark:bg-slate-950">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold font-[var(--font-poppins)] text-ink dark:text-slate-100">Semua Kategori</h2>
          <button onClick={onClose} className="rounded-full bg-soft px-3 py-2 text-sm font-semibold text-ink dark:bg-slate-800 dark:text-slate-100">
            Tutup
          </button>
        </div>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">Urut alfabet, scroll cepat.</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {loading && Array.from({ length: 10 }).map((_, idx) => (
            <div key={idx} className="h-12 animate-pulse rounded-xl bg-soft dark:bg-slate-800" />
          ))}
          {!loading && categories.map((cat) => (
            <Link
              key={cat.slug || cat.id}
              href={`/category/${cat.slug}`}
              onClick={onClose}
              className="flex items-center gap-2 rounded-xl bg-soft px-3 py-3 text-sm text-ink transition active:scale-[0.99] dark:bg-slate-900 dark:text-slate-100"
            >
              <span className="h-2 w-2 rounded-full bg-brand"></span>
              {cat.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
