import Link from "next/link";

export const metadata = {
  title: "Kebijakan Privasi | Sebelas Indonesia",
  description: "Kebijakan privasi layanan Sebelas Indonesia.",
  alternates: { canonical: "https://sebelasindonesia.app/privacy-policy" },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-soft px-6 py-6 dark:bg-slate-950">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold font-[var(--font-poppins)] text-ink dark:text-slate-100">Kebijakan Privasi</h1>
        <Link className="text-sm text-brand" href="/">Kembali</Link>
      </div>

      <div className="mt-4 rounded-2xl bg-white p-5 shadow-card dark:bg-slate-900">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Dokumen ini menjelaskan bagaimana Sebelas Indonesia mengumpulkan, menggunakan, menyimpan, dan melindungi data pengguna.
        </p>

        <div className="mt-4 space-y-4 text-sm text-slate-700 dark:text-slate-200">
          <section>
            <h2 className="font-semibold text-ink dark:text-slate-100">1. Data yang Dikumpulkan</h2>
            <p className="mt-1">Kami dapat mengumpulkan data akun (email), data transaksi (invoice, produk, nominal), serta data teknis dasar (IP, user-agent, device fingerprint) untuk keamanan sistem.</p>
          </section>

          <section>
            <h2 className="font-semibold text-ink dark:text-slate-100">2. Tujuan Penggunaan Data</h2>
            <p className="mt-1">Data digunakan untuk memproses pesanan, verifikasi pembayaran, pengiriman produk digital, pencegahan fraud, peningkatan layanan, dan dukungan pelanggan.</p>
          </section>

          <section>
            <h2 className="font-semibold text-ink dark:text-slate-100">3. Penyimpanan dan Keamanan</h2>
            <p className="mt-1">Kami menerapkan kontrol akses, enkripsi saat transfer data, serta pembatasan akses internal untuk melindungi informasi pengguna.</p>
          </section>

          <section>
            <h2 className="font-semibold text-ink dark:text-slate-100">4. Berbagi Data ke Pihak Ketiga</h2>
            <p className="mt-1">Data tertentu dapat dibagikan ke mitra yang relevan (misalnya payment gateway) hanya untuk kebutuhan operasional transaksi.</p>
          </section>

          <section>
            <h2 className="font-semibold text-ink dark:text-slate-100">5. Hak Pengguna</h2>
            <p className="mt-1">Pengguna dapat meminta koreksi data, pembaruan data, atau penghapusan akun sesuai ketentuan hukum yang berlaku.</p>
          </section>

          <section>
            <h2 className="font-semibold text-ink dark:text-slate-100">6. Perubahan Kebijakan</h2>
            <p className="mt-1">Kebijakan ini dapat diperbarui sewaktu-waktu. Versi terbaru akan dipublikasikan di halaman ini.</p>
          </section>
        </div>
      </div>
    </div>
  );
}

