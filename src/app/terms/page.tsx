import type { Metadata } from "next";
import { DraftNotice, PageShell } from "@/components/PageShell";
import { PLATFORM } from "@/lib/constants/platform";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <PageShell title="Terms of Service">
      <DraftNotice />
      <h2>Who can use Comrade Market</h2>
      <p>Comrade Market is for currently enrolled students at Kenyan universities, colleges, KMTC and TVET institutions. We verify each member&apos;s student ID by hand before they can buy or sell.</p>
      <h2>Trading</h2>
      <p>Sellers are responsible for what they list and deliver. Services and orders of KES {PLATFORM.escrow.requiredAtOrAboveKes} or more are paid through escrow: your money is held until you confirm you received the order, or {PLATFORM.escrow.autoReleaseHours} hours after the seller marks it delivered if you say nothing. Small orders are paid directly to the seller and are not protected.</p>
      <h2>Fees</h2>
      <p>Joining and listing are free. On escrow orders the platform keeps {PLATFORM.fees.escrowRate * 100}% of the sale, deducted from the seller&apos;s payout. Buyers never pay extra.</p>
      <h2>Disputes</h2>
      <p>If something goes wrong, raise a problem on the order before confirming receipt. An administrator reviews the evidence and decides who is paid.</p>
      <h2>Conduct</h2>
      <p>No fake accounts, scams, spam, or taking payment for a listed item outside the platform. Breaking these rules can lead to suspension.</p>
    </PageShell>
  );
}
