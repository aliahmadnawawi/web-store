import { IconGamepad, IconGrid, IconPhone, IconStar, IconTicket } from "@/components/Icons";

const items = [
  { label: "Premium", Icon: IconStar },
  { label: "Top Up", Icon: IconGamepad },
  { label: "Voucher", Icon: IconTicket },
  { label: "Pulsa", Icon: IconPhone },
  { label: "Lihat Semua", Icon: IconGrid },
];

export default function QuickAccess() {
  return (
    <section className="page-container pt-4">
      <div className="grid grid-cols-5 gap-2 rounded-2xl bg-white p-4 shadow-card dark:bg-slate-900">
        {items.map((item) => (
          <button
            key={item.label}
            className="flex flex-col items-center gap-2 rounded-xl px-2 py-3 text-xs text-ink transition active:scale-95 dark:text-slate-100"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-soft text-slate-700 dark:bg-slate-800 dark:text-slate-100">
              <item.Icon className="h-5 w-5" />
            </span>
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
