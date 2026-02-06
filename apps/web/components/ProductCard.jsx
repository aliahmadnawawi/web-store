import NotificationDot from "@/components/NotificationDot";

export default function ProductCard({ product }) {
  return (
    <div className="group relative rounded-2xl bg-white p-3 shadow-card transition hover:-translate-y-1">
      <div className="relative h-28 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200">
        <span className="absolute left-2 top-2 rounded-full bg-brand px-2 py-1 text-[10px] font-semibold text-white">{product.tag}</span>
        {product.hot && <NotificationDot />}
      </div>
      <div className="mt-3">
        <h4 className="text-sm font-semibold text-ink">{product.name}</h4>
        <p className="text-xs text-slate-500">{product.desc}</p>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-base font-bold text-ink">{product.price}</span>
          <button className="rounded-full bg-brand px-3 py-1 text-xs font-semibold text-white transition active:scale-95">
            Beli
          </button>
        </div>
      </div>
    </div>
  );
}
