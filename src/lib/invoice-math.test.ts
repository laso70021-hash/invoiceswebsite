import { describe, expect, it } from "vitest";
import { balance, displayStatus, totals } from "./invoice-math";

describe("invoice math", () => {
  it("applies 18% VAT on subtotal", () => {
    const t = totals(
      [
        { description: "Website Development", qty: 1, price: 2_000_000, discount: 0 },
        { description: "Hosting", qty: 1, price: 300_000, discount: 0 },
      ],
      18,
    );
    expect(t).toEqual({ subtotal: 2_300_000, tax: 414_000, total: 2_714_000 });
  });
  it("applies line discount before tax", () => {
    expect(totals([{ description: "x", qty: 2, price: 100, discount: 10 }], 18).total).toBe(212.4);
  });
  it("balance never goes negative", () => {
    expect(balance(100, 150)).toBe(0);
  });
  it("unpaid past-due sent invoice is overdue", () => {
    expect(displayStatus("sent", "2020-01-01", 50)).toBe("Overdue");
  });
});
