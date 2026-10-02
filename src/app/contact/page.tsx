import type { Metadata } from "next";
import { PageShell } from "@/components/PageShell";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  const email = process.env.NEXT_PUBLIC_SUPPORT_EMAIL;
  return (
    <PageShell title="Contact us">
      {email ? (
        <p>Questions, a problem with an order, or locked out of your account? Email <a href={`mailto:${email}`}>{email}</a>.</p>
      ) : (
        <p>Support contact details are being set up. (Set NEXT_PUBLIC_SUPPORT_EMAIL to show your address here.)</p>
      )}
    </PageShell>
  );
}
