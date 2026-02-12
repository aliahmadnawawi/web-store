import { IconFileText, IconGrid, IconHistory, IconShield, IconSparkles, IconStar, IconUser } from "@/components/Icons";
import Link from "next/link";

const items = [
  { label: "Premium", href: "/premium", Icon: IconStar },
  { label: "Kategori", href: "/categories", Icon: IconGrid },
  { label: "Cara Penggunaan", href: "/how-to-use", Icon: IconSparkles },
  { label: "History", href: "/history", Icon: IconHistory },
  { label: "Profile", href: "/profile", Icon: IconUser },
  { label: "Privasi", href: "/privacy-policy", Icon: IconShield },
  { label: "Ketentuan", href: "/terms-of-service", Icon: IconFileText },
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
