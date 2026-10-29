export type LineItem = { description: string; qty: number; price: number; discount: number };

const r2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

/** Line amount after percentage discount, rounded to 2 decimals. */
export function lineAmount(it: LineItem) {
  return r2(it.qty * it.price * (1 - (it.discount || 0) / 100));
}

export function totals(items: LineItem[], taxRate: number) {
  const subtotal = r2(items.reduce((s, it) => s + lineAmount(it), 0));
  const tax = r2((subtotal * taxRate) / 100);
  return { subtotal, tax, total: r2(subtotal + tax) };
}

export function balance(total: number, paid: number) {
  return r2(Math.max(0, total - paid));
}

export function money(n: number, currency = "TZS") {
  return `${currency} ${Number(n).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

export function displayStatus(status: string, due: string | null, balanceDue: number) {
  if (status !== "paid" && status !== "draft" && due && balanceDue > 0 && new Date(due) < new Date(new Date().toDateString()))
    return "Overdue";
  return ({ draft: "Draft", sent: "Sent", partial: "Partially Paid", paid: "Paid" } as Record<string, string>)[status] ?? status;
}
