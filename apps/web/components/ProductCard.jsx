import Link from "next/link";
import NotificationDot from "@/components/NotificationDot";

const formatIdr = (value) => {
  const n = typeof value === "number" ? value : Number(String(value || "").replace(/[^0-9]/g, ""));
  if (!Number.isFinite(n) || n <= 0) return "Rp -";
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
};

export default function ProductCard({ product }) {
  const name = product?.name || "Produk";
  const desc = product?.description || product?.desc || "";
  const price = product?.price;
  const slug = product?.slug;
  const image = product?.image || product?.image_url;
  const tag = product?.tag || product?.type || "Premium";

  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white p-3 shadow-card transition hover:-translate-y-1 dark:bg-slate-900">
      <div className="relative h-28 overflow-hidden rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900">
        <span className="absolute left-2 top-2 rounded-full bg-brand px-2 py-1 text-[10px] font-semibold text-white">{tag}</span>
        {product?.hot && <NotificationDot />}
        {image ? (
          <img
            src={image}
            alt={name}
            className="h-full w-full object-cover opacity-95 transition duration-300 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : null}
      </div>

      <div className="mt-3">
        <h4 className="line-clamp-2 text-sm font-semibold text-ink dark:text-slate-100">
          {slug ? <Link href={`/product/${slug}`}>{name}</Link> : name}
        </h4>
        <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-300">{desc}</p>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-base font-bold text-ink dark:text-slate-100">{typeof price === "string" && price.includes("Rp") ? price : formatIdr(price)}</span>
          {slug ? (
            <Link
              href={`/product/${slug}`}
              className="rounded-full bg-brand px-3 py-1 text-xs font-semibold text-white transition active:scale-95"
            >
              Beli
            </Link>
          ) : (
            <button className="rounded-full bg-brand px-3 py-1 text-xs font-semibold text-white transition active:scale-95" type="button">
              Beli
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
