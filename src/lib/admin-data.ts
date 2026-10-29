import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database, Tables } from "@/integrations/supabase/types";

export type AdminUser = Database["public"]["Functions"]["admin_list_users"]["Returns"][number];
export type AdminInvoice = Tables<"invoices"> & { customers: { name: string } | null };
export type AdminPayment = Tables<"payments"> & { invoices: { number: string | null; currency: string } | null };

// Paginate reads so platform totals do not stop at the Data API row limit.
async function allRows<T>(fetchPage: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>) {
  const rows: T[] = [];
  for (let from = 0; ; from += 500) {
    const { data, error } = await fetchPage(from, from + 499);
    if (error) throw new Error(error.message);
    rows.push(...(data ?? []));
    if (!data || data.length < 500) return rows;
  }
}

export const adminQuery = queryOptions({
  queryKey: ["admin", "platform"],
  queryFn: async () => {
    const [users, invoices, payments, session] = await Promise.all([
      supabase.rpc("admin_list_users"),
      allRows<AdminInvoice>((from, to) => supabase.from("invoices").select("*, customers(name)").order("created_at", { ascending: false }).order("id").range(from, to)),
      allRows<AdminPayment>((from, to) => supabase.from("payments").select("*, invoices(number, currency)").order("created_at", { ascending: false }).order("id").range(from, to)),
      supabase.auth.getUser(),
    ]);
    if (users.error) throw users.error;
    if (session.error || !session.data.user) throw new Error("Sign in to view administration.");
    return { users: users.data ?? [], invoices, payments, viewerId: session.data.user.id };
  },
});

export function currencyTotals(rows: { currency: string; amount: number }[]) {
  return rows.reduce<Record<string, number>>((totals, row) => {
    totals[row.currency] = (totals[row.currency] ?? 0) + Number(row.amount);
    return totals;
  }, {});
}