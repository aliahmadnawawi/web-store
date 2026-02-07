import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const unwrapList = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  if (payload.data && Array.isArray(payload.data.data)) return payload.data.data;
  return [];
};

const normCat = (c, mode) => {
  const id = c?.category_id || c?.id || c?.categoryId;
  const name = c?.category_name || c?.name || c?.category || c?.product_name;
  return { id: String(id || ""), name: String(name || ""), mode };
};

const normalize = (v) => String(v || "").toLowerCase().trim();

const normalizeKind = (raw) => {
  const k = normalize(raw);
  if (k === "topup" || k === "top-up" || k === "top_up") return "game";
  if (k === "paket-data" || k === "paket_data") return "data";
  if (k === "listrik") return "pln";
  if (k === "google-play" || k === "google_play" || k === "gplay") return "googleplay";
  if (k === "pln-pasca" || k === "pln_pasca" || k === "pln-pascabayar" || k === "pln_pascabayar") return "plnpostpaid";
  if (k === "tagihan" || k === "pascabayar") return "postpaid";
  return k;
};

const RULES = {
  pulsa: { keywords: ["pulsa", "telepon", "telp"], prefer: "prepaid" },
  data: { keywords: ["data", "paket data", "internet"], prefer: "prepaid" },
  game: { keywords: ["game", "topup", "top up", "diamond", "uc"], prefer: "prepaid" },
  pln: { keywords: ["pln", "token", "listrik"], prefer: "prepaid" },
  plnpostpaid: { keywords: ["pln", "listrik", "tagihan", "pascabayar"], prefer: "postpaid" },
  wifi: { keywords: ["wifi", "internet", "indihome", "first media"], prefer: "postpaid" },
  voucher: { keywords: ["voucher", "e-voucher", "evoucher"], prefer: "prepaid" },
  googleplay: { keywords: ["google play", "googleplay", "gplay"], prefer: "prepaid" },
  bpjs: { keywords: ["bpjs"], prefer: "postpaid" },
  pdam: { keywords: ["pdam", "air"], prefer: "postpaid" },
  telkom: { keywords: ["telkom", "telepon rumah", "indihome"], prefer: "postpaid" },
  postpaid: { keywords: ["tagihan", "pascabayar", "pembayaran"], prefer: "postpaid" },
};

const scoreCategory = (cat, kind) => {
  const rule = RULES[kind];
  if (!rule) return 0;
  const n = normalize(cat.name);
  let score = 0;
  for (const kw of rule.keywords) {
    const key = normalize(kw);
    if (!key) continue;
    if (n === key) score += 50;
    if (n.startsWith(key)) score += 30;
    if (n.includes(key)) score += 20;
  }
  if (rule.prefer === cat.mode) score += 8;
  if (kind === "pln" && (n.includes("token") || n.includes("prabayar"))) score += 10;
  if (kind === "wifi" && (n.includes("wifi") || n.includes("internet"))) score += 10;
  return score;
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

export default async function PpobGoPage({ params }) {
  const kind = normalizeKind(params?.kind || "");
  const base = process.env.NEXT_PUBLIC_CATALOG_API;
  if (!base) redirect("/ppob");

  const [prepaid, postpaid] = await Promise.all([
    getJson(`${base}/ppob/prepaid/categories`),
    getJson(`${base}/ppob/postpaid/categories`),
  ]);

  const prepaidCats = unwrapList(prepaid.data).map((c) => normCat(c, "prepaid")).filter((c) => c.id && c.name);
  const postpaidCats = unwrapList(postpaid.data).map((c) => normCat(c, "postpaid")).filter((c) => c.id && c.name);

  const all = [...prepaidCats, ...postpaidCats];
  let best = null;
  for (const cat of all) {
    const score = scoreCategory(cat, kind);
    if (score <= 0) continue;
    if (!best || score > best.score) best = { cat, score };
  }

  if (!best) redirect("/ppob");

  redirect(`/ppob/${best.cat.mode}/${best.cat.id}`);
}
