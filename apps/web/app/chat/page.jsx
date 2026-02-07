"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

const fallbackAnswer = (text) => {
  const q = String(text || "").toLowerCase();
  if (q.includes("cara bayar") || q.includes("bayar")) {
    return "Buka halaman invoice, lalu ikuti instruksi pembayaran (VA/QRIS). Setelah bayar, tekan Refresh Status sampai status berubah menjadi PAID.";
  }
  if (q.includes("qris")) {
    return "Pilih metode QRIS saat checkout. Di halaman invoice, akan muncul QR untuk dibayar via aplikasi e-wallet/banking yang mendukung QRIS.";
  }
  if (q.includes("ppob") || q.includes("pulsa") || q.includes("data") || q.includes("pln") || q.includes("token") || q.includes("game")) {
    return "Masuk menu PPOB, pilih kategori (Pulsa/Data/PLN/Game/Voucher), isi nomor/ID pelanggan dulu, lalu pilih nominal dan checkout.";
  }
  if (q.includes("invoice") || q.includes("status")) {
    return "Kalau kamu checkout sebagai guest, kamu bisa lacak invoice di beranda (fitur Lacak Pesanan). Kalau member, buka menu History.";
  }
  return "Aku bisa bantu: cara bayar, QRIS, PPOB, status invoice, dan alur pembelian. Tulis pertanyaanmu ya.";
};

export default function AiChatPage() {
  const wa = process.env.NEXT_PUBLIC_CS_WHATSAPP || "https://wa.me/628985228448";

  const [messages, setMessages] = useState([
    { role: "assistant", text: "Halo, aku AI Assistant Sebelas. Mau tanya soal cara bayar, PPOB, atau status invoice?" },
  ]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const quick = useMemo(() => ([
    "Cara bayar VA / QRIS",
    "Cara top up game",
    "Cara beli pulsa",
    "Cek status invoice",
  ]), []);

  const send = async (preset) => {
    const prompt = String(preset ?? text).trim();
    if (!prompt) return;
    setMessages((m) => [...m, { role: "user", text: prompt }]);
    setText("");
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_AI_API}/assistant`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: prompt }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "AI unavailable");
      const answer = String(data?.answer || "").trim() || fallbackAnswer(prompt);
      setMessages((m) => [...m, { role: "assistant", text: answer }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", text: fallbackAnswer(prompt) }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-soft px-6 py-6 pb-24 dark:bg-slate-950">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold font-[var(--font-poppins)] text-ink dark:text-slate-100">AI Chat</h1>
        <Link className="text-sm text-brand" href="/">Kembali</Link>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {quick.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => send(q)}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-ink dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
          >
            {q}
          </button>
        ))}
        <a
          href={wa}
          target="_blank"
          rel="noreferrer"
          className="rounded-full bg-brand px-4 py-2 text-xs font-semibold text-white"
        >
          Hubungi CS (WhatsApp)
        </a>
      </div>

      <div className="mt-4 space-y-2">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`max-w-[92%] rounded-2xl px-4 py-3 text-sm shadow-card ${
              m.role === "user"
                ? "ml-auto bg-brand text-white"
                : "bg-white text-ink dark:bg-slate-900 dark:text-slate-100"
            }`}
          >
            {m.text}
          </div>
        ))}
      </div>

      <div className="fixed bottom-16 left-0 right-0 md:hidden">
        <div className="page-container">
          <div className="flex items-center gap-2 rounded-2xl bg-white p-2 shadow-card dark:bg-slate-900">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Tulis pertanyaan..."
              className="flex-1 bg-transparent px-2 py-2 text-sm text-ink outline-none placeholder:text-slate-400 dark:text-slate-100"
              onKeyDown={(e) => {
                if (e.key === "Enter") send();
              }}
            />
            <button
              type="button"
              onClick={() => send()}
              disabled={loading}
              className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {loading ? "..." : "Kirim"}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 hidden md:block">
        <div className="rounded-2xl bg-white p-4 shadow-card dark:bg-slate-900">
          <div className="flex gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Tulis pertanyaan..."
              className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              onKeyDown={(e) => {
                if (e.key === "Enter") send();
              }}
            />
            <button
              type="button"
              onClick={() => send()}
              disabled={loading}
              className="rounded-xl bg-brand px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {loading ? "..." : "Kirim"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

