"use client";

import ThemeToggle from "@/components/ThemeToggle";
import { IconSearch, IconSparkles, IconWhatsapp } from "@/components/Icons";

export default function TopSearchBar({ onOpenCategories }) {
  const wa = process.env.NEXT_PUBLIC_CS_WHATSAPP || "https://wa.me/628985228448";
  return (
    <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/80 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/80">
      <div className="page-container flex items-center gap-3 py-3">
        <a href="/" className="hidden md:flex items-center">
          <img src="/header-light.png" alt="Sebelas Indonesia" className="h-6 w-auto dark:hidden" />
          <img src="/header-dark.png" alt="Sebelas Indonesia" className="hidden h-6 w-auto dark:block" />
        </a>
        <nav className="hidden md:flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
          <a className="font-semibold text-brand" href="/">
            Home
          </a>
          <button onClick={onOpenCategories} className="hover:text-brand">
            Kategori
          </button>
          <a className="hover:text-brand" href="/how-to-use">
            Cara Penggunaan
          </a>
          <a className="hover:text-brand" href="/privacy-policy">
            Kebijakan Privasi
          </a>
          <a className="hover:text-brand" href="/terms-of-service">
            Ketentuan Layanan
          </a>
        </nav>
        <div className="flex-1">
          <form
            action="/search"
            method="get"
            className="flex items-center gap-2 rounded-full bg-soft px-4 py-2 text-sm text-ink dark:bg-slate-800 dark:text-slate-100 md:max-w-[400px]"
          >
            <IconSearch className="h-4 w-4 text-slate-400" />
            <input
              name="q"
              className="w-full bg-transparent outline-none placeholder:text-slate-400"
              placeholder="Cari Netflix, Spotify, Canva, Adobe..."
            />
          </form>
        </div>
        <div className="flex items-center gap-2">
          <a
            className="flex h-10 w-10 items-center justify-center rounded-full bg-soft text-slate-600 transition active:scale-95 dark:bg-slate-800 dark:text-slate-100"
            aria-label="AI Chat"
            href="/chat"
          >
            <IconSparkles className="h-5 w-5" />
          </a>
          <a
            className="flex h-10 w-10 items-center justify-center rounded-full bg-soft text-slate-600 transition active:scale-95 dark:bg-slate-800 dark:text-slate-100"
            aria-label="Hubungi CS via WhatsApp"
            href={wa}
            target="_blank"
            rel="noreferrer"
          >
            <IconWhatsapp className="h-5 w-5" />
          </a>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
