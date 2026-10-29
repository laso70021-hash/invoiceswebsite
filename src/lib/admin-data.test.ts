import { describe, expect, it } from "vitest";
import { currencyTotals } from "./admin-data";

describe("Platform payment totals", () => {
  it("keeps different currencies separate rather than adding unlike money", () => {
    expect(currencyTotals([{ currency: "TZS", amount: 50000 }, { currency: "TZS", amount: 68000 }, { currency: "USD", amount: 25 }])).toEqual({ TZS: 118000, USD: 25 });
  });
});