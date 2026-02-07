"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { setSession } from "@/lib/session";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = useMemo(() => {
    return email.trim().includes("@") && password.trim().length >= 6;
  }, [email, password]);

  const submit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError("");
    try {
      const regRes = await fetch(`${process.env.NEXT_PUBLIC_ORDERS_API}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password: password.trim() }),
      });
      const regData = await regRes.json().catch(() => ({}));
      if (!regRes.ok) throw new Error(regData?.error || "Daftar gagal");

      // Auto-login
      const loginRes = await fetch(`${process.env.NEXT_PUBLIC_ORDERS_API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password: password.trim() }),
      });
      const loginData = await loginRes.json().catch(() => ({}));
      if (!loginRes.ok) throw new Error(loginData?.error || "Login gagal");
      setSession({ token: loginData?.token || "", userId: loginData?.userId || "" });
      router.push("/history");
    } catch (e) {
      setError(e?.message || "Daftar gagal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-soft px-6 py-6 dark:bg-slate-950">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold font-[var(--font-poppins)] text-ink dark:text-slate-100">Daftar</h1>
        <Link className="text-sm text-brand" href="/">Kembali</Link>
      </div>

      <div className="mt-4 rounded-2xl bg-white p-5 shadow-card dark:bg-slate-900">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Buat akun untuk mengaktifkan keranjang dan history. Checkout guest tetap tersedia.
        </p>

        <div className="mt-4 grid gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              placeholder="email@domain.com"
              autoComplete="email"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submit();
              }}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              placeholder="Min 6 karakter"
              autoComplete="new-password"
            />
          </div>

          {error ? <div className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">{error}</div> : null}

          <button
            onClick={submit}
            disabled={!canSubmit || loading}
            className="rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white transition disabled:opacity-60 active:scale-[0.99]"
          >
            {loading ? "..." : "Daftar"}
          </button>

          <div className="text-xs text-slate-500 dark:text-slate-300">
            Sudah punya akun? <Link className="font-semibold text-brand" href="/login">Login</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

