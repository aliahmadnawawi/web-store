import { IconBolt, IconGamepad, IconGrid, IconPhone, IconStar, IconTicket, IconWifi } from "@/components/Icons";
import Link from "next/link";

const items = [
  { label: "Premium", href: "/premium", Icon: IconStar },
  { label: "Pulsa", href: "/ppob/go/pulsa", Icon: IconPhone },
  { label: "Data", href: "/ppob/go/data", Icon: IconWifi },
  { label: "PLN", href: "/ppob/go/pln", Icon: IconBolt },
  { label: "Game", href: "/ppob/go/game", Icon: IconGamepad },
  { label: "WiFi", href: "/ppob/go/wifi", Icon: IconWifi },
  { label: "Voucher", href: "/ppob/go/voucher", Icon: IconTicket },
  { label: "Kategori", href: "/categories", Icon: IconGrid },
];

export default function QuickAccess() {
  return (
    <section className="page-container pt-4">
      <div className="grid grid-cols-4 gap-2 rounded-2xl bg-white p-4 shadow-card dark:bg-slate-900 sm:grid-cols-8">
        {items.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="flex flex-col items-center gap-2 rounded-xl px-2 py-3 text-xs text-ink transition active:scale-95 dark:text-slate-100"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-soft text-slate-700 dark:bg-slate-800 dark:text-slate-100">
              <item.Icon className="h-5 w-5" />
            </span>
            <span className="font-medium">{item.label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
