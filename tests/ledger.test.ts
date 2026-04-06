import { describe, expect, it } from "vitest";
import { computeBalanceCents, getBalanceTone } from "@/lib/ledger";

describe("ledger helpers", () => {
  it("computes balances from charges and payments", () => {
    expect(
      computeBalanceCents([
        { amountCents: 12000 },
        { amountCents: 2500 },
        { amountCents: -5000 }
      ])
    ).toBe(9500);
  });

  it("returns the right balance tone", () => {
    expect(getBalanceTone(2500)).toBe("due");
    expect(getBalanceTone(-1500)).toBe("credit");
    expect(getBalanceTone(0)).toBe("settled");
  });
});
