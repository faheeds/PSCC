import Stripe from "stripe";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { markPaymentPaidByCheckoutSession } from "@/lib/ledger";
import { stripe } from "@/lib/payments/stripe";

export async function POST(request: Request) {
  if (!stripe || !env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Stripe webhook is not configured." }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });
  }

  const payload = await request.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid webhook signature.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const existing = await prisma.processedWebhookEvent.findUnique({
    where: { eventId: event.id }
  });

  if (existing) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.metadata?.checkoutType === "member_payment" && session.id) {
        await markPaymentPaidByCheckoutSession(
          session.id,
          String(session.payment_intent || ""),
          session.amount_total ?? null
        );
      }
    }

    await prisma.processedWebhookEvent.create({
      data: {
        provider: "stripe",
        eventId: event.id,
        eventType: event.type
      }
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook processing failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
