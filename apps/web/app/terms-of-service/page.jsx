import Link from "next/link";

export const metadata = {
  title: "Ketentuan Layanan | Sebelas Indonesia",
  description: "Ketentuan layanan platform Sebelas Indonesia.",
  alternates: { canonical: "https://sebelasindonesia.app/terms-of-service" },
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-soft px-6 py-6 dark:bg-slate-950">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold font-[var(--font-poppins)] text-ink dark:text-slate-100">Ketentuan Layanan</h1>
        <Link className="text-sm text-brand" href="/">Kembali</Link>
      </div>

      <div className="mt-4 rounded-2xl bg-white p-5 shadow-card dark:bg-slate-900">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Dengan menggunakan layanan Sebelas Indonesia, pengguna dianggap telah membaca dan menyetujui ketentuan berikut.
        </p>

        <div className="mt-4 space-y-4 text-sm text-slate-700 dark:text-slate-200">
          <section>
            <h2 className="font-semibold text-ink dark:text-slate-100">1. Ruang Lingkup Layanan</h2>
            <p className="mt-1">Sebelas Indonesia menyediakan layanan pembelian produk digital dan layanan terkait melalui sistem checkout online.</p>
          </section>

          <section>
            <h2 className="font-semibold text-ink dark:text-slate-100">2. Akun Pengguna</h2>
            <p className="mt-1">Pengguna bertanggung jawab atas keamanan akun. Guest checkout tetap diperbolehkan sesuai alur yang tersedia.</p>
          </section>

          <section>
            <h2 className="font-semibold text-ink dark:text-slate-100">3. Pembayaran dan Verifikasi</h2>
            <p className="mt-1">Pesanan diproses setelah pembayaran tervalidasi. Kesalahan input data oleh pengguna menjadi tanggung jawab pengguna.</p>
          </section>

          <section>
            <h2 className="font-semibold text-ink dark:text-slate-100">4. Pengiriman Produk Digital</h2>
            <p className="mt-1">Produk digital dikirim mengikuti status pembayaran dan ketersediaan sistem. Waktu proses dapat bervariasi.</p>
          </section>

          <section>
            <h2 className="font-semibold text-ink dark:text-slate-100">5. Refund dan Komplain</h2>
            <p className="mt-1">Permintaan refund/komplain diproses sesuai kebijakan internal dan bukti transaksi yang valid.</p>
          </section>

          <section>
            <h2 className="font-semibold text-ink dark:text-slate-100">6. Larangan Penggunaan</h2>
            <p className="mt-1">Dilarang menggunakan platform untuk aktivitas melanggar hukum, penyalahgunaan sistem, atau tindakan yang merugikan pihak lain.</p>
          </section>

          <section>
            <h2 className="font-semibold text-ink dark:text-slate-100">7. Batas Tanggung Jawab</h2>
            <p className="mt-1">Sebelas Indonesia tidak bertanggung jawab atas kerugian tidak langsung akibat gangguan pihak ketiga di luar kendali sistem.</p>
          </section>

          <section>
            <h2 className="font-semibold text-ink dark:text-slate-100">8. Perubahan Ketentuan</h2>
            <p className="mt-1">Ketentuan layanan dapat diperbarui sewaktu-waktu dan berlaku sejak dipublikasikan pada halaman ini.</p>
          </section>
        </div>
      </div>
    </div>
  );
}

