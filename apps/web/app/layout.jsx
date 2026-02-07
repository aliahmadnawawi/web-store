import "./globals.css";
import { Inter, Poppins } from "next/font/google";
import Script from "next/script";
import ServiceWorker from "@/components/ServiceWorker";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-poppins" });

export const metadata = {
  title: "Sebelas Indonesia | Digital Products Super App",
  description: "Marketplace digital products with instant delivery and AI recommendations.",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.png",
    apple: "/logo.png",
  },
  alternates: {
    canonical: "https://sebelasindonesia.app/",
  },
  openGraph: {
    title: "Sebelas Indonesia",
    description: "Marketplace digital products with instant delivery and AI recommendations.",
    url: "https://sebelasindonesia.app/",
    siteName: "Sebelas Indonesia",
    locale: "id_ID",
    type: "website",
  },
};

export const viewport = {
  themeColor: "#038383",
  width: "device-width",
  initialScale: 1,
};

const themeInitScript = `
(() => {
  try {
    const stored = localStorage.getItem("theme");
    const theme =
      stored === "dark" || stored === "light"
        ? stored
        : (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    document.documentElement.classList.toggle("dark", theme === "dark");
  } catch (_) {}
})();
`;

export default function RootLayout({ children }) {
  return (
    <html lang="id" className={`${inter.variable} ${poppins.variable}`} suppressHydrationWarning>
      <body className="font-[var(--font-inter)]">
        <Script id="theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
        {children}
        <ServiceWorker />
      </body>
    </html>
  );
}
