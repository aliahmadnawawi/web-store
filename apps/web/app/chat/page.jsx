import Link from "next/link";

export const metadata = {
  title: "Chat CS | Sebelas Indonesia",
  alternates: { canonical: "https://sebelasindonesia.app/chat" },
};

export default function ChatPage() {
  const wa = process.env.NEXT_PUBLIC_CS_WHATSAPP || "https://wa.me/6281234567890";
  return (
    <div className="min-h-screen bg-soft px-6 py-6 dark:bg-slate-950">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold font-[var(--font-poppins)] text-ink dark:text-slate-100">Chat CS</h1>
        <Link className="text-sm text-brand" href="/">Kembali</Link>
      </div>

      <div className="mt-4 rounded-2xl bg-white p-5 shadow-card dark:bg-slate-900">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Untuk bantuan pembayaran, refund, atau kendala delivery, chat CS via WhatsApp.
        </p>
        <a
          href={wa}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white"
        >
          Buka WhatsApp
        </a>
      </div>
    </div>
  );
}

