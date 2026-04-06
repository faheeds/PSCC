import { stripe } from "@/lib/payments/stripe";
import { env } from "@/lib/env";

export async function createMemberCheckoutSession(args: {
  paymentId: string;
  memberEmail: string;
  memberName: string;
  amountCents: number;
}) {
  if (!stripe) {
    throw new Error("Stripe is not configured. Add STRIPE_SECRET_KEY to continue.");
  }

  return stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: args.memberEmail,
    billing_address_collection: "auto",
    success_url: `${env.APP_BASE_URL}/payment/success?payment=${args.paymentId}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.APP_BASE_URL}/account?cancelled=1`,
    metadata: {
      checkoutType: "member_payment",
      paymentId: args.paymentId
    },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          product_data: {
            name: "PSCC balance payment",
            description: `Balance payment for ${args.memberName}`
          },
          unit_amount: args.amountCents
        }
      }
    ]
  });
}
