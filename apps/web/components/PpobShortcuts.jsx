"use client";

import Link from "next/link";
import { IconBolt, IconGamepad, IconPhone, IconTicket, IconWifi } from "@/components/Icons";

const items = [
  { label: "Pulsa", href: "/ppob/go/pulsa", Icon: IconPhone },
  { label: "Paket Data", href: "/ppob/go/data", Icon: IconWifi },
  { label: "Token PLN", href: "/ppob/go/pln", Icon: IconBolt },
  { label: "Tagihan PLN", href: "/ppob/go/plnpostpaid", Icon: IconBolt },
  { label: "Game Top Up", href: "/ppob/go/game", Icon: IconGamepad },
  { label: "WiFi/Indihome", href: "/ppob/go/wifi", Icon: IconWifi },
  { label: "Google Play", href: "/ppob/go/googleplay", Icon: IconTicket },
  { label: "Voucher", href: "/ppob/go/voucher", Icon: IconTicket },
];

export default function PpobShortcuts({ title = "PPOB Cepat", subtitle = "Klik icon, lalu isi nomor/ID dulu." }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-card dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-bold text-ink dark:text-slate-100">{title}</div>
          <div className="text-xs text-slate-500 dark:text-slate-300">{subtitle}</div>
        </div>
        <Link className="text-xs font-semibold text-brand" href="/ppob">Lihat</Link>
      </div>
      <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-8">
        {items.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="flex flex-col items-center gap-2 rounded-xl px-2 py-3 text-center text-[11px] font-medium text-ink transition active:scale-95 dark:text-slate-100"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-soft text-slate-700 dark:bg-slate-800 dark:text-slate-100">
              <item.Icon className="h-5 w-5" />
            </span>
            <span className="line-clamp-2">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
