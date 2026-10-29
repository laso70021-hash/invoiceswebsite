import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { accountingEntries } from "./accounting";
/** Range through all source rows so a 1000-row API cap cannot silently truncate the ledger. */
async function everyRow<T>(
  getPage: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>,
) {
  const rows: T[] = [];
  for (let from = 0; ; from += 500) {
    const { data, error } = await getPage(from, from + 499);
    if (error) throw error;
    if (!data) throw new Error("Backend returned no source data.");
    rows.push(...data);
    if (data.length < 500) return rows;
  }
}
export const accountingQuery = queryOptions({
  queryKey: ["accounting"],
  queryFn: async () => {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error) throw error;
    if (!user) throw new Error("Sign in to view accounting.");
    const [invoices, payments, expenses, profile] = await Promise.all([
      everyRow((from, to) =>
        supabase
          .from("invoices")
          .select("id,number,issue_date,currency,status,subtotal,tax,total")
          .eq("user_id", user.id)
          .order("id")
          .range(from, to),
      ),
      everyRow((from, to) =>
        supabase
          .from("payments")
          .select("id,invoice_id,paid_on,method,amount")
          .eq("user_id", user.id)
          .order("id")
          .range(from, to),
      ),
      everyRow((from, to) =>
        supabase
          .from("expenses")
          .select("id,spent_on,category,description,amount")
          .eq("user_id", user.id)
          .order("id")
          .range(from, to),
      ),
      supabase.from("profiles").select("currency").eq("id", user.id).single(),
    ]);
    if (profile.error) throw profile.error;
    return {
      entries: accountingEntries(invoices, payments, expenses, profile.data.currency),
      expenseCurrency: profile.data.currency,
    };
  },
});
