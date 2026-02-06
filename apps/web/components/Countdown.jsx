"use client";

import { useEffect, useState } from "react";

export default function Countdown({ target }) {
  const [time, setTime] = useState("00:00:00");

  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, new Date(target).getTime() - Date.now());
      const hours = String(Math.floor(diff / 3600000)).padStart(2, "0");
      const minutes = String(Math.floor((diff % 3600000) / 60000)).padStart(2, "0");
      const seconds = String(Math.floor((diff % 60000) / 1000)).padStart(2, "0");
      setTime(`${hours}:${minutes}:${seconds}`);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [target]);

  return (
    <div className="flex items-center gap-2 rounded-full bg-danger/10 px-3 py-1 text-xs font-semibold text-danger">
      <span>Flash Sale</span>
      <span className="rounded-full bg-danger px-2 py-0.5 text-white">{time}</span>
    </div>
  );
}
