import Link from "next/link";
import { IconBolt, IconGamepad, IconPhone, IconTicket, IconWifi } from "@/components/Icons";

const unwrapList = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload.data)) return payload.data;
  if (payload.data && Array.isArray(payload.data.data)) return payload.data.data;
  return [];
};

const normCat = (c) => {
  const id = c?.category_id || c?.id || c?.categoryId;
  const name = c?.category_name || c?.name || c?.category || c?.product_name;
  const type = c?.type || c?.category_type || "";
  return { id: String(id || ""), name: String(name || ""), type: String(type || "") };
};

const iconFor = (name) => {
  const n = (name || "").toLowerCase();
  if (n.includes("pulsa") || n.includes("telp") || n.includes("telepon")) return IconPhone;
  if (n.includes("data")) return IconWifi;
  if (n.includes("game")) return IconGamepad;
  if (n.includes("token") || n.includes("pln") || n.includes("listrik")) return IconBolt;
  if (n.includes("wifi") || n.includes("internet")) return IconWifi;
  if (n.includes("voucher")) return IconTicket;
  return IconTicket;
};

async function getJson(url) {
  try {
    const res = await fetch(url, { cache: "no-store" });
    const data = await res.json();
    return { ok: res.ok, data };
  } catch {
    return { ok: false, data: null };
  }
}

export const metadata = {
  title: "PPOB | Sebelas Indonesia",
  description: "Pulsa, data, token PLN, dan layanan PPOB lainnya.",
  alternates: { canonical: "https://sebelasindonesia.app/ppob" },
};

export default async function PpobPage() {
  const [prepaid, postpaid] = await Promise.all([
    getJson(`${process.env.NEXT_PUBLIC_CATALOG_API}/ppob/prepaid/categories`),
    getJson(`${process.env.NEXT_PUBLIC_CATALOG_API}/ppob/postpaid/categories`),
  ]);

  const prepaidCats = unwrapList(prepaid.data).map(normCat).filter((c) => c.id && c.name);
  const postpaidCats = unwrapList(postpaid.data).map(normCat).filter((c) => c.id && c.name);

  return (
    <div className="min-h-screen bg-soft px-6 py-6 dark:bg-slate-950">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold font-[var(--font-poppins)] text-ink dark:text-slate-100">PPOB</h1>
        <Link className="text-sm text-brand" href="/">Kembali</Link>
      </div>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">Pilih kategori, lalu masukkan nomor sebelum daftar harga muncul.</p>

      <div className="mt-5">
        <h2 className="text-sm font-bold text-ink dark:text-slate-100">Prabayar</h2>
        <div className="mt-3 grid grid-cols-4 gap-3 sm:grid-cols-6">
          {prepaidCats.map((c) => (
            <Link
              key={c.id}
              href={`/ppob/prepaid/${c.id}`}
              className="rounded-2xl border border-slate-100 bg-white p-3 text-center transition active:scale-[0.99] dark:border-slate-800 dark:bg-slate-900"
            >
              {(() => {
                const Icon = iconFor(c.name);
                return (
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-soft text-slate-700 dark:bg-slate-800 dark:text-slate-100">
                    <Icon className="h-5 w-5" />
                  </div>
                );
              })()}
              <div className="mt-2 line-clamp-2 text-[11px] font-semibold text-ink dark:text-slate-100">{c.name}</div>
            </Link>
          ))}
          {prepaidCats.length === 0 ? (
            <div className="col-span-4 rounded-2xl border border-slate-100 bg-white p-4 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 sm:col-span-6">
              PPOB prabayar belum tersedia. Pastikan `TRIPAY_PPOB_API_KEY` sudah di-set.
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-sm font-bold text-ink dark:text-slate-100">Pascabayar</h2>
        <div className="mt-3 grid grid-cols-4 gap-3 sm:grid-cols-6">
          {postpaidCats.map((c) => (
            <Link
              key={c.id}
              href={`/ppob/postpaid/${c.id}`}
              className="rounded-2xl border border-slate-100 bg-white p-3 text-center transition active:scale-[0.99] dark:border-slate-800 dark:bg-slate-900"
            >
              {(() => {
                const Icon = iconFor(c.name);
                return (
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-soft text-slate-700 dark:bg-slate-800 dark:text-slate-100">
                    <Icon className="h-5 w-5" />
                  </div>
                );
              })()}
              <div className="mt-2 line-clamp-2 text-[11px] font-semibold text-ink dark:text-slate-100">{c.name}</div>
            </Link>
          ))}
          {postpaidCats.length === 0 ? (
            <div className="col-span-4 rounded-2xl border border-slate-100 bg-white p-4 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 sm:col-span-6">
              PPOB pascabayar belum tersedia. Pastikan `TRIPAY_PPOB_API_KEY` sudah di-set.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
