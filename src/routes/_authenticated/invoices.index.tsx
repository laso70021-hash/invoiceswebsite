import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/swahivo/app-shell";
import { Card, StatusPill } from "@/components/swahivo/ui";
import { supabase } from "@/integrations/supabase/client";
import { invoicesQuery } from "@/lib/data";
import { balance, displayStatus, money } from "@/lib/invoice-math";

export const Route = createFileRoute("/_authenticated/invoices/")({
  head: () => ({ meta: [{ title: "Invoices — Swahivo" }, { name: "description", content: "All your invoices." }, { property: "og:title", content: "Invoices — Swahivo" }, { property: "og:description", content: "Review invoices, balances and payment status." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: Invoices,
});

function Invoices() {
  const qc = useQueryClient();
  const { data: inv = [], isLoading } = useQuery(invoicesQuery);

  async function remove(id: string, number: string | null) {
    if (!confirm(`Delete invoice ${number ?? "draft"}? This also removes its payments.`)) return;
    const { data: session, error: authError } = await supabase.auth.getUser();
    if (authError || !session.user) { toast.error("Sign in to delete an invoice."); return; }
    const { error } = await supabase.from("invoices").delete().eq("user_id", session.user.id).eq("id", id).select("id").single();
    if (error) { toast.error(error.message); return; }
    toast.success("Invoice deleted");
    qc.invalidateQueries();
  }

  return (
    <AppShell>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">Invoices</h1>
        <Link to="/invoices/new" className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"><Plus className="h-4 w-4" />New Invoice</Link>
      </div>
      <Card className="overflow-x-auto">
        {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : inv.length === 0 ? <p className="text-sm text-muted-foreground">No invoices yet.</p> : (
          <table className="w-full min-w-[800px] text-sm">
            <thead className="bg-muted text-left text-xs text-muted-foreground"><tr><th className="p-2">Invoice #</th><th>Customer</th><th>Issue</th><th>Due</th><th>Total</th><th>Balance</th><th>Status</th><th /></tr></thead>
            <tbody>{inv.map((i) => (
              <tr key={i.id} className="border-b last:border-0">
                <td className="p-2 font-medium text-primary"><Link to="/invoices/$id" params={{ id: i.id }} className="hover:underline">{i.number}</Link></td>
                <td>{i.customers?.name ?? "—"}</td><td>{i.issue_date}</td><td>{i.due_date ?? "—"}</td>
                <td>{money(i.total, i.currency)}</td><td>{money(balance(i.total, i.amount_paid), i.currency)}</td>
                <td><StatusPill status={displayStatus(i.status, i.due_date, balance(i.total, i.amount_paid))} /></td>
                <td className="space-x-3 whitespace-nowrap p-2 text-right text-xs font-semibold">
                  <Link to="/invoices/$id" params={{ id: i.id }} className="text-primary hover:underline">View</Link>
                  <button onClick={() => remove(i.id, i.number)} className="text-destructive hover:underline">Delete</button>
                </td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </Card>
    </AppShell>
  );
}
