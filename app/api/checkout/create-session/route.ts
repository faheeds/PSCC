import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getMemberBalance } from "@/lib/ledger";
import { assertMemberApiRequest } from "@/lib/member-auth";
import { createMemberCheckoutSession } from "@/lib/payments/checkout";
import { stripe } from "@/lib/payments/stripe";

const requestSchema = z.object({
  amountCents: z.number().int().positive()
});

export async function POST(request: Request) {
  try {
    const session = await assertMemberApiRequest();
    const memberId = session.user?.memberId;
    const body = requestSchema.parse(await request.json());

    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe is not configured. Add STRIPE_SECRET_KEY before testing checkout." },
        { status: 500 }
      );
    }

    const [member, balanceCents] = await Promise.all([
      prisma.member.findUnique({ where: { id: memberId ?? "" } }),
      getMemberBalance(memberId ?? "")
    ]);

    if (!member) {
      return NextResponse.json({ error: "Member account not found." }, { status: 404 });
    }

    if (balanceCents <= 0) {
      return NextResponse.json({ error: "There is no outstanding balance to pay." }, { status: 400 });
    }

    if (body.amountCents > balanceCents) {
      return NextResponse.json({ error: "Payment amount cannot exceed the outstanding balance." }, { status: 400 });
    }

    const payment = await prisma.payment.create({
      data: {
        memberId: member.id,
        amountCents: body.amountCents
      }
    });

    const checkoutSession = await createMemberCheckoutSession({
      paymentId: payment.id,
      memberEmail: member.email,
      memberName: member.name,
      amountCents: body.amountCents
    });

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        checkoutSessionId: checkoutSession.id
      }
    });

    return NextResponse.json({ checkoutUrl: checkoutSession.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create checkout session.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
