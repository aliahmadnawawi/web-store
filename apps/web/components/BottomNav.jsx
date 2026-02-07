"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import NotificationDot from "@/components/NotificationDot";
import { IconCart, IconChat, IconHome, IconUser } from "@/components/Icons";

export default function BottomNav() {
  const pathname = usePathname();
  const isActive = (href) => pathname === href || (href !== "/" && pathname?.startsWith(href));

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-100 bg-white md:hidden dark:border-slate-800 dark:bg-slate-950">
      <div className="page-container flex items-center justify-between py-2 text-xs text-slate-500 dark:text-slate-300">
        <Link href="/" className={`flex flex-col items-center gap-1 ${isActive("/") ? "text-brand" : ""}`}>
          <IconHome className="h-5 w-5" />
          Home
        </Link>
        <Link href="/chat" className={`flex flex-col items-center gap-1 ${isActive("/chat") ? "text-brand" : ""}`}>
          <IconChat className="h-5 w-5" />
          Chat
        </Link>
        <Link href="/cart" className={`relative flex flex-col items-center gap-1 ${isActive("/cart") ? "text-brand" : ""}`}>
          <IconCart className="h-5 w-5" />
          Cart
          <NotificationDot />
        </Link>
        <Link href="/profile" className={`flex flex-col items-center gap-1 ${isActive("/profile") ? "text-brand" : ""}`}>
          <IconUser className="h-5 w-5" />
          Profile
        </Link>
      </div>
    </nav>
  );
}
