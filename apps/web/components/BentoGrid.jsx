const bentoItems = [
  { title: "Akun Premium", desc: "Netflix, Spotify, Canva", color: "bg-[#FFE8C7]" },
  { title: "Game Top Up", desc: "MLBB, FF, Valorant", color: "bg-[#E4F4FF]" },
  { title: "Voucher Fisik", desc: "Gift card populer", color: "bg-[#EDE6FF]" },
  { title: "Pulsa/Data", desc: "Semua operator", color: "bg-[#E8FBE9]" },
];

export default function BentoGrid() {
  return (
    <section className="page-container pt-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {bentoItems.map((item, idx) => (
          <div
            key={item.title}
            className={`rounded-2xl p-4 shadow-card ${item.color} ${idx === 0 ? "md:col-span-2" : ""}`}
          >
            <p className="text-xs uppercase tracking-wide text-slate-500">Featured</p>
            <h3 className="mt-1 font-semibold font-[var(--font-poppins)] text-ink">{item.title}</h3>
            <p className="text-xs text-slate-500">{item.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
