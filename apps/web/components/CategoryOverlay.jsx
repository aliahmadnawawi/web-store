"use client";

const categories = [
  "Akun Premium",
  "Apps & Tools",
  "E-Voucher",
  "Game Top Up",
  "Gift Card",
  "Pulsa & Data",
  "Streaming",
  "Software License",
  "Voucher Fisik",
];

export default function CategoryOverlay({ open, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm">
      <div className="absolute inset-0 bg-white p-6 overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold font-[var(--font-poppins)]">Semua Kategori</h2>
          <button onClick={onClose} className="rounded-full bg-soft px-3 py-2 text-sm font-semibold">
            Tutup
          </button>
        </div>
        <p className="mt-2 text-sm text-slate-500">Urut alfabet, scroll cepat.</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {categories.map((cat) => (
            <button key={cat} className="flex items-center gap-2 rounded-xl bg-soft px-3 py-3 text-sm text-ink">
              <span className="h-2 w-2 rounded-full bg-brand"></span>
              {cat}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
