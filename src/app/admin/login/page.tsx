"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    const res = await fetch("/api/admin/login", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (res.ok) router.push("/admin");
    else { setError(data.error ?? "Login failed"); setBusy(false); }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-maroon-deep px-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-xl">
        <p className="text-center font-display text-2xl font-bold text-maroon">॥ Kanha Closet</p>
        <h1 className="mt-1 text-center font-display text-xl text-muted">Admin Login</h1>
        <label htmlFor="email" className="mt-6 block text-sm font-medium">Email</label>
        <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-xl border border-gold/40 bg-cream px-4 py-2.5 focus:border-gold focus:outline-none" />
        <label htmlFor="password" className="mt-4 block text-sm font-medium">Password</label>
        <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-xl border border-gold/40 bg-cream px-4 py-2.5 focus:border-gold focus:outline-none" />
        {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}
        <button disabled={busy} className="mt-6 w-full rounded-full bg-maroon py-3 font-medium text-gold-light hover:bg-maroon-dark disabled:opacity-50">
          {busy ? "Signing in…" : "Sign In"}
        </button>
      </form>
    </div>
  );
}
