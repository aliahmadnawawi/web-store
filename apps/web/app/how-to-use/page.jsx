import Link from "next/link";

export const metadata = {
  title: "Cara Penggunaan | Sebelas Indonesia",
  description: "Panduan ringkas menggunakan marketplace digital Sebelas Indonesia.",
  alternates: { canonical: "https://sebelasindonesia.app/how-to-use" },
};

export default function HowToUsePage() {
  return (
    <div className="min-h-screen bg-soft px-6 py-6 dark:bg-slate-950">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold font-[var(--font-poppins)] text-ink dark:text-slate-100">Cara Penggunaan</h1>
        <Link className="text-sm text-brand" href="/">Kembali</Link>
      </div>

      <div className="mt-4 space-y-4 text-sm text-slate-700 dark:text-slate-200">
        <section className="rounded-2xl bg-white p-5 shadow-card dark:bg-slate-900">
          <h2 className="font-semibold text-ink dark:text-slate-100">1. Pilih Produk</h2>
          <p className="mt-1">
            Telusuri etalase premium atau kategori di menu Kategori. Klik produk, isi kontak (email/WhatsApp) dan metode pembayaran, lalu tekan “Beli Sekarang”.
          </p>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-card dark:bg-slate-900">
          <h2 className="font-semibold text-ink dark:text-slate-100">2. Checkout dan Invoice</h2>
          <p className="mt-1">
            Sistem membuat invoice unik dan memanggil Tripay (VA/QRIS). Invoice dikirimkan lewat halaman invoice, berisi jumlah, pay code, QRIS, instruksi pembayaran, dan status.
          </p>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-card dark:bg-slate-900">
          <h2 className="font-semibold text-ink dark:text-slate-100">3. Bayar dan Terima Produk</h2>
          <p className="mt-1">
            Setelah membayar lewat Tripay, refresh halaman invoice hingga status “PAID”. Delivery (payload digital) akan muncul di bagian delivery, dan admin bisa memantau di dashboard.
          </p>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-card dark:bg-slate-900">
          <h2 className="font-semibold text-ink dark:text-slate-100">4. Guest & Member</h2>
          <p className="mt-1">
            Guest bisa langsung checkout tanpa akun. Member bisa daftar/login untuk mengakses history dan keranjang; history bisa dilihat di tab History.
          </p>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-card dark:bg-slate-900">
          <h2 className="font-semibold text-ink dark:text-slate-100">5. Dukungan & Legal</h2>
          <p className="mt-1">
            Hubungi CS WhatsApp atau AI Chat untuk bantuan. Untuk detail privasi & syarat, buka halaman Kebijakan Privasi dan Ketentuan Layanan di header atau Quick Access.
          </p>
        </section>
      </div>
    </div>
  );
}
