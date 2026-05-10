"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm({
  from,
  error,
}: {
  from: string;
  error?: string;
}) {
  const router = useRouter();
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(error ?? null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const res = await fetch("/api/cms/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pw }),
    });
    setBusy(false);
    if (res.ok) {
      router.push(from || "/c4m5s6");
      router.refresh();
    } else {
      const j = await res.json().catch(() => ({}));
      setErr(j.error || "Hibás jelszó");
    }
  }

  return (
    <form className="cms-form" onSubmit={onSubmit}>
      {err ? <div className="err">{err}</div> : null}
      <label>
        <span>Jelszó</span>
        <input
          type="password"
          autoFocus
          required
          value={pw}
          onChange={(e) => setPw(e.target.value)}
        />
      </label>
      <button className="cms-btn primary" type="submit" disabled={busy}>
        {busy ? "Belépés…" : "Belépés"}
      </button>
    </form>
  );
}
