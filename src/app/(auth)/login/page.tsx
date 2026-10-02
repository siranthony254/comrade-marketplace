// /login — server wrapper so the redirect param is available without a Suspense boundary.
// Accepts ?next= (our links) and ?callbackUrl= (what the auth middleware sends).

import type { Metadata } from "next";
import { safeRedirectPath } from "@/lib/validations";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage({ searchParams }: { searchParams: { next?: string; callbackUrl?: string } }) {
  return <LoginForm next={safeRedirectPath(searchParams.next) ?? safeRedirectPath(searchParams.callbackUrl)} />;
}
