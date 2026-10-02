import type { Metadata } from "next";
import { DraftNotice, PageShell } from "@/components/PageShell";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <PageShell title="Privacy Policy">
      <DraftNotice />
      <h2>What we collect</h2>
      <p>Your name, email, phone number, school, student ID number, and two photos used only to verify you are a student: a photo of your student ID and a selfie holding it.</p>
      <h2>How we protect your ID photos</h2>
      <p>They are stored privately (never on a public link), are only viewable by our verification team, and every view is logged. If we cannot approve your signup, the photos are deleted immediately.</p>
      <h2>Who sees your details</h2>
      <p>Buyers and sellers see each other&apos;s name and phone number only on an order they share, so they can coordinate delivery. Your student ID number and photos are never shown to other members.</p>
      <h2>Your rights</h2>
      <p>Under Kenya&apos;s Data Protection Act 2019 you may ask us to show, correct or delete your data. Contact us through the details on the <a href="/contact">contact page</a>.</p>
    </PageShell>
  );
}
