export type AccountingInvoice = {
  id: string;
  number: string | null;
  issue_date: string;
  currency: string;
  status: string;
  subtotal: number;
  tax: number;
  total: number;
};
export type AccountingPayment = {
  id: string;
  invoice_id: string;
  paid_on: string;
  method: string;
  amount: number;
};
export type AccountingExpense = {
  id: string;
  spent_on: string;
  category: string;
  description: string | null;
  amount: number;
};
export const accounts = {
  receivables: "1100 · Accounts receivable",
  cash: "1000 · Cash / bank",
  sales: "4000 · Invoice sales",
  tax: "2100 · Invoice tax",
  expense: "5000 · Operating expenses",
  suspense: "2999 · Unclassified invoice difference",
} as const;
export type Entry = {
  id: string;
  date: string;
  reference: string;
  description: string;
  currency: string;
  source: "invoice" | "payment" | "expense";
  sourceId: string;
  account: string;
  debit: bigint;
  credit: bigint;
};
export function minorUnits(value: number): bigint {
  if (!Number.isFinite(value) || Math.abs(value) > Number.MAX_SAFE_INTEGER / 100)
    throw new Error("Amount is outside the supported precision.");
  const negative = value < 0;
  const raw = String(Math.abs(value));
  const [whole = "0", fraction = ""] = (raw.includes("e") ? Math.abs(value).toFixed(8) : raw).split(
    ".",
  );
  const cents =
    BigInt(whole) * 100n +
    BigInt((fraction + "00").slice(0, 2)) +
    (Number(fraction[2] ?? 0) >= 5 ? 1n : 0n);
  return negative ? -cents : cents;
}
export function minorMoney(value: bigint, currency: string) {
  const negative = value < 0n;
  const absolute = negative ? -value : value;
  return `${currency} ${negative ? "-" : ""}${(absolute / 100n).toLocaleString("en-US")}.${String(absolute % 100n).padStart(2, "0")}`;
}
/** Reconstructed from source records; never writes a second financial posting. */
export function accountingEntries(
  invoices: AccountingInvoice[],
  payments: AccountingPayment[],
  expenses: AccountingExpense[],
  expenseCurrency: string,
): Entry[] {
  const result: Entry[] = [];
  const invoiceMap = new Map(
    invoices.filter((i) => ["sent", "partial", "paid"].includes(i.status)).map((i) => [i.id, i]),
  );
  const push = (
    base: Omit<Entry, "account" | "debit" | "credit">,
    account: string,
    signedDebit: bigint,
  ) => {
    if (signedDebit !== 0n)
      result.push({
        ...base,
        id: `${base.id}:${account}`,
        account,
        debit: signedDebit > 0n ? signedDebit : 0n,
        credit: signedDebit < 0n ? -signedDebit : 0n,
      });
  };
  for (const invoice of invoiceMap.values()) {
    const base = {
      id: `invoice:${invoice.id}`,
      date: invoice.issue_date,
      reference: invoice.number ?? invoice.id,
      description: "Issued invoice",
      currency: invoice.currency,
      source: "invoice" as const,
      sourceId: invoice.id,
    };
    const total = minorUnits(invoice.total),
      subtotal = minorUnits(invoice.subtotal),
      tax = minorUnits(invoice.tax);
    push(base, accounts.receivables, total);
    push(base, accounts.sales, -subtotal);
    push(base, accounts.tax, -tax);
    push(
      {
        ...base,
        description: "Stored total differs from subtotal plus tax; review source invoice",
      },
      accounts.suspense,
      subtotal + tax - total,
    );
  }
  for (const payment of payments) {
    const invoice = invoiceMap.get(payment.invoice_id);
    if (!invoice)
      throw new Error(
        "A payment has no issued invoice in the loaded records. Refresh or correct its source before using this ledger.",
      );
    const base = {
      id: `payment:${payment.id}`,
      date: payment.paid_on,
      reference: invoice.number ?? invoice.id,
      description: `Payment · ${payment.method}`,
      currency: invoice.currency,
      source: "payment" as const,
      sourceId: invoice.id,
    };
    const value = minorUnits(payment.amount);
    push(base, accounts.cash, value);
    push(base, accounts.receivables, -value);
  }
  for (const expense of expenses) {
    const base = {
      id: `expense:${expense.id}`,
      date: expense.spent_on,
      reference: expense.category,
      description: expense.description ?? "Recorded expense",
      currency: expenseCurrency,
      source: "expense" as const,
      sourceId: expense.id,
    };
    const value = minorUnits(expense.amount);
    push(base, accounts.expense, value);
    push(base, accounts.cash, -value);
  }
  return result.sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
}
export function trialBalance(entries: Entry[]) {
  const totals = new Map<string, { currency: string; account: string; net: bigint }>();
  for (const e of entries) {
    const key = JSON.stringify([e.currency, e.account]);
    const row = totals.get(key) ?? { currency: e.currency, account: e.account, net: 0n };
    row.net += e.debit - e.credit;
    totals.set(key, row);
  }
  return [...totals.values()].map((r) => ({
    ...r,
    debit: r.net > 0n ? r.net : 0n,
    credit: r.net < 0n ? -r.net : 0n,
  }));
}
