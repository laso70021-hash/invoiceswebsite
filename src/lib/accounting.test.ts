import { describe, expect, it } from "vitest";
import { accountingEntries, trialBalance, minorUnits, accounts } from "./accounting";
const invoice = {
  id: "invoice1",
  number: "INV-1",
  issue_date: "2026-10-28",
  currency: "TZS",
  status: "sent",
  subtotal: 100000,
  tax: 18000,
  total: 118000,
};
describe("source accounting ledger", () => {
  it("balances invoice, partial payment and expense without double-counting sales", () => {
    const entries = accountingEntries(
      [invoice],
      [{ id: "p1", invoice_id: "invoice1", paid_on: "2026-10-28", method: "Cash", amount: 70000 }],
      [{ id: "e1", spent_on: "2026-10-28", category: "Travel", description: null, amount: 10000 }],
      "TZS",
    );
    expect(entries.reduce((sum, e) => sum + e.debit - e.credit, 0n)).toBe(0n);
    const trial = trialBalance(entries);
    expect(trial.find((e) => e.account === accounts.receivables)?.net).toBe(4800000n);
    expect(trial.find((e) => e.account === accounts.sales)?.credit).toBe(10000000n);
    expect(trial.find((e) => e.account === accounts.cash)?.net).toBe(6000000n);
  });
  it("excludes drafts and keeps currencies separate", () => {
    const entries = accountingEntries(
      [
        { ...invoice, status: "draft" },
        { ...invoice, id: "usd", currency: "USD" },
      ],
      [],
      [],
      "TZS",
    );
    expect(entries.every((e) => e.currency === "USD")).toBe(true);
    expect(entries.some((e) => e.sourceId === "invoice1")).toBe(false);
  });
  it("exposes inconsistent invoice totals in an unclassified account", () => {
    const entries = accountingEntries([{ ...invoice, total: 118001 }], [], [], "TZS");
    expect(entries.find((e) => e.account === accounts.suspense)?.credit).toBe(100n);
    expect(entries.reduce((sum, e) => sum + e.debit - e.credit, 0n)).toBe(0n);
  });
  it("does not silently omit unmatched payments", () => {
    expect(() =>
      accountingEntries(
        [],
        [{ id: "p", invoice_id: "unknown", paid_on: "2026-10-28", method: "Cash", amount: 1 }],
        [],
        "TZS",
      ),
    ).toThrow();
  });
  it("rounds to cents explicitly and rejects invalid numbers", () => {
    expect(minorUnits(1.005)).toBe(101n);
    expect(minorUnits(0.1) + minorUnits(0.2)).toBe(30n);
    expect(minorUnits(-1.005)).toBe(-101n);
    expect(() => minorUnits(Infinity)).toThrow();
  });
});
