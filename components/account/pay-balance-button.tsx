"use client";

import { useMemo, useState, useTransition } from "react";
import { fieldClassName } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";

export function PayBalanceButton({ balanceCents }: { balanceCents: number }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const defaultAmount = useMemo(() => (balanceCents / 100).toFixed(2), [balanceCents]);

  if (balanceCents <= 0) {
    return null;
  }

  return (
    <form
      className="space-y-3 rounded-[1.5rem] border border-brand-100 bg-brand-50/70 p-4"
      onSubmit={(event) => {
        event.preventDefault();
        setError(null);
        const formData = new FormData(event.currentTarget);
        const amountRaw = Number(formData.get("amount"));
        const amountCents = Math.round(amountRaw * 100);

        startTransition(async () => {
          const response = await fetch("/api/checkout/create-session", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ amountCents })
          });

          const payload = (await response.json()) as { checkoutUrl?: string; error?: string };
          if (!response.ok || !payload.checkoutUrl) {
            setError(payload.error ?? "Unable to start checkout.");
            return;
          }

          window.location.href = payload.checkoutUrl;
        });
      }}
    >
      <div className="space-y-1">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-800">Pay online</p>
        <p className="text-sm text-slate-700">Pay your full balance or choose a smaller amount. Current balance: {formatCurrency(balanceCents)}.</p>
        <p className="text-xs leading-5 text-slate-500">If you pay the club another way, an admin can confirm it and your remaining balance will update automatically after they post it.</p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          name="amount"
          type="number"
          step="0.01"
          min="1"
          max={(balanceCents / 100).toFixed(2)}
          defaultValue={defaultAmount}
          className={fieldClassName}
        />
        <button type="submit" disabled={isPending} className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">
          {isPending ? "Redirecting..." : "Pay with card"}
        </button>
      </div>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
    </form>
  );
}
