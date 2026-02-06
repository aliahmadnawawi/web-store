"use client";

import { useEffect, useState } from "react";

const slides = [
  {
    title: "Flash Sale Digital Hari Ini",
    subtitle: "Potongan hingga 60%",
    tag: "Flash Sale",
  },
  {
    title: "Premium Accounts Bundles",
    subtitle: "Netflix, Spotify, Canva",
    tag: "Bundle",
  },
  {
    title: "Game Top Up Aman",
    subtitle: "Proses instan & anti gagal",
    tag: "Top Up",
  },
];

export default function Carousel() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % slides.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="page-container pt-4">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand to-[#055A5A] text-white shadow-card">
        <div className="flex h-36 items-center px-6">
          <div className="space-y-2 animate-[floatIn_0.6s_ease]">
            <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">{slides[active].tag}</span>
            <h2 className="text-xl font-bold font-[var(--font-poppins)]">{slides[active].title}</h2>
            <p className="text-sm text-white/80">{slides[active].subtitle}</p>
          </div>
        </div>
        <div className="absolute bottom-3 right-4 flex gap-1">
          {slides.map((_, idx) => (
            <span
              key={idx}
              className={`h-2 w-2 rounded-full ${idx === active ? "bg-white" : "bg-white/30"}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
