"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { btnPrimary, inputCls, labelCls } from "@/lib/ui";

export function LoginForm({ next }: { next?: string }) {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const f = new FormData(e.currentTarget);
    const res = await signIn("credentials", {
      identifier: String(f.get("identifier") ?? ""),
      password: String(f.get("password") ?? ""),
      redirect: false,
    });
    if (res?.error) {
      // "CredentialsSignin" is NextAuth's generic code; our authorize() throws readable messages for lockouts.
      setError(res.error === "CredentialsSignin" ? "Wrong email/phone or password." : res.error);
      setBusy(false);
      return;
    }
    router.push(next ?? "/post-login");
    router.refresh();
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="mb-8">
          <h1 className="font-display text-2xl font-bold mb-1">Welcome back, comrade</h1>
          <p className="text-sm text-muted-foreground">Sign in to your account to continue</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="identifier" className={labelCls}>Email or phone</label>
            <input id="identifier" name="identifier" type="text" autoComplete="username" placeholder="you@gmail.com or 0712 345 678" required className={inputCls} />
          </div>
          <div>
            <label htmlFor="password" className={labelCls}>Password</label>
            <div className="relative">
              <input id="password" name="password" type={show ? "text" : "password"} autoComplete="current-password" required className={`${inputCls} pr-10`} />
              <button type="button" onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">Forgot your password? Contact support and we&apos;ll help you get back in.</p>
          </div>

          {error && <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

          <button type="submit" disabled={busy} className={`${btnPrimary} w-full`}>
            <LogIn className="w-4 h-4" /> {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-6 pt-6 border-t border-border text-sm text-muted-foreground text-center">
          New here?{" "}
          <Link href="/register" className="text-primary font-medium hover:underline">Join as a student</Link>
        </p>
      </div>
    </div>
  );
}
