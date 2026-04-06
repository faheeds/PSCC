import Link from "next/link";
import { markPaymentPaidByCheckoutSession } from "@/lib/ledger";
import { stripe } from "@/lib/payments/stripe";
import { Card, PageShell, SectionTitle } from "@/components/ui";

export default async function PaymentSuccessPage(props: {
  searchParams?: Promise<{
    payment?: string;
    session_id?: string;
  }>;
}) {
  const searchParams = (await props.searchParams) ?? {};
  const sessionId = searchParams.session_id;
  const paymentId = searchParams.payment;
  let statusMessage = "Once Stripe confirms the checkout session, your member balance updates automatically.";

  if (stripe && sessionId) {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);

      if (
        session.payment_status === "paid" &&
        session.metadata?.checkoutType === "member_payment" &&
        session.metadata?.paymentId === paymentId
      ) {
        await markPaymentPaidByCheckoutSession(
          session.id,
          String(session.payment_intent || ""),
          session.amount_total ?? null
        );
        statusMessage = "Your payment has been confirmed and your balance is being updated now.";
      }
    } catch {
      statusMessage = "Stripe accepted your payment. The balance will update automatically once the payment is synced.";
    }
  }

  return (
    <main className="min-h-screen">
      <PageShell className="flex min-h-[70vh] items-center justify-center">
        <Card className="w-full max-w-xl space-y-6 text-center">
          <SectionTitle
            eyebrow="Payment Submitted"
            title="Thanks, your payment is on its way to the club ledger."
            description={statusMessage}
          />
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/account" className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white no-underline">
              Return to member portal
            </Link>
            <Link href="/" className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-ink no-underline">
              Back home
            </Link>
          </div>
        </Card>
      </PageShell>
    </main>
  );
}
