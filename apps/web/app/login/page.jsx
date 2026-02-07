"use client";

import Link from "next/link";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { setSession } from "@/lib/session";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const [googleLoaded, setGoogleLoaded] = useState(false);

  const canSubmit = useMemo(() => {
    return email.trim().includes("@") && password.trim().length >= 6;
  }, [email, password]);

  useEffect(() => {
    if (!googleClientId) return;
    if (!googleLoaded) return;
    // `google` comes from Google Identity Services script.
    const init = () => {
      try {
        // eslint-disable-next-line no-undef
        if (!window.google?.accounts?.id) return;
        // eslint-disable-next-line no-undef
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async (resp) => {
            const idToken = resp?.credential || "";
            if (!idToken) return;
            setLoading(true);
            setError("");
            try {
              const res = await fetch(`${process.env.NEXT_PUBLIC_ORDERS_API}/auth/google`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ idToken }),
              });
              const data = await res.json().catch(() => ({}));
              if (!res.ok) throw new Error(data?.error || "Login Google gagal");
              setSession({ token: data?.token || "", userId: data?.userId || "" });
              router.push("/history");
            } catch (e) {
              setError(e?.message || "Login Google gagal");
            } finally {
              setLoading(false);
            }
          },
        });
        const el = document.getElementById("googleBtn");
        if (!el) return;
        el.innerHTML = "";
        // eslint-disable-next-line no-undef
        window.google.accounts.id.renderButton(el, { theme: "outline", size: "large", width: 320 });
      } catch {}
    };
    init();
  }, [googleClientId, googleLoaded, router]);

  const submit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_ORDERS_API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password: password.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Login gagal");
      setSession({ token: data?.token || "", userId: data?.userId || "" });
      router.push("/history");
    } catch (e) {
      setError(e?.message || "Login gagal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-soft px-6 py-6 dark:bg-slate-950">
      {googleClientId ? (
        <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onLoad={() => setGoogleLoaded(true)} />
      ) : null}

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold font-[var(--font-poppins)] text-ink dark:text-slate-100">Login</h1>
        <Link className="text-sm text-brand" href="/">Kembali</Link>
      </div>

      <div className="mt-4 rounded-2xl bg-white p-5 shadow-card dark:bg-slate-900">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Login untuk mengaktifkan history dan keranjang. Kamu tetap bisa checkout tanpa login.
        </p>

        <div className="mt-4 grid gap-3">
          {googleClientId ? (
            <div className="rounded-2xl bg-soft p-4 dark:bg-slate-950">
              <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">Login dengan Google</div>
              <div className="mt-3" id="googleBtn" />
              <div className="mt-3 text-[11px] text-slate-500 dark:text-slate-300">
                Jika tombol tidak muncul, pastikan `PUBLIC_GOOGLE_CLIENT_ID` sudah di-set di server.
              </div>
            </div>
          ) : null}

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
              autoComplete="current-password"
            />
          </div>

          {error ? <div className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">{error}</div> : null}

          <button
            onClick={submit}
            disabled={!canSubmit || loading}
            className="rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white transition disabled:opacity-60 active:scale-[0.99]"
          >
            {loading ? "..." : "Login"}
          </button>

          <div className="text-xs text-slate-500 dark:text-slate-300">
            Belum punya akun? <Link className="font-semibold text-brand" href="/register">Daftar</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
