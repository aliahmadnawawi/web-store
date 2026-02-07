import Link from "next/link";

const bentoItems = [
  { title: "Akun Premium", desc: "Netflix, Spotify, Canva", href: "/premium", color: "bg-[#FFE8C7] dark:bg-[#2a1f0e]" },
  { title: "Game Top Up", desc: "MLBB, FF, Valorant", href: "/ppob", color: "bg-[#E4F4FF] dark:bg-[#0f1f2a]" },
  { title: "Voucher", desc: "Voucher game & hiburan", href: "/ppob", color: "bg-[#EDE6FF] dark:bg-[#19132a]" },
  { title: "Pulsa/Data", desc: "Semua operator", href: "/ppob", color: "bg-[#E8FBE9] dark:bg-[#0f2414]" },
];

export default function BentoGrid() {
  return (
    <section className="page-container pt-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {bentoItems.map((item, idx) => (
          <Link
            key={item.title}
            href={item.href}
            className={`rounded-2xl p-4 shadow-card ${item.color} ${idx === 0 ? "md:col-span-2" : ""}`}
          >
            <p className="text-xs uppercase tracking-wide text-slate-600 dark:text-slate-300">Featured</p>
            <h3 className="mt-1 font-semibold font-[var(--font-poppins)] text-ink dark:text-slate-100">{item.title}</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300">{item.desc}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
