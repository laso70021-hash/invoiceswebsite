import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { AppShell } from "@/components/swahivo/app-shell";
import { Card } from "@/components/swahivo/ui";
import { Button } from "@/components/ui/button";
import { profileQuery, type Customer, type Invoice } from "@/lib/data";
import { money } from "@/lib/invoice-math";

type Row = Tables<"payments"> & { invoices: (Omit<Invoice, "customers"> & { customers: Customer | null }) | null };

const receiptsQuery = queryOptions({
  queryKey: ["receipts"],
  queryFn: async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) throw new Error("Sign in to view your records.");
    const { data, error } = await supabase.from("payments").select("*, invoices(*, customers(*))").eq("user_id", u.user.id).order("paid_on", { ascending: false });
    if (error) throw error;
    return data as unknown as Row[];
  },
});

export const Route = createFileRoute("/_authenticated/receipts")({
  head: () => ({ meta: [{ title: "Receipts — Swahivo" }, { name: "description", content: "Every payment receipt you have issued." }, { property: "og:title", content: "Receipts — Swahivo" }, { property: "og:description", content: "Download receipts for payments received." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: Receipts,
});

function Receipts() {
  const { data: rows = [], isLoading } = useQuery(receiptsQuery);
  const { data: profile } = useQuery(profileQuery);
  async function download(r: Row) {
    if (!r.invoices) return;
    const { downloadDocument } = await import("@/lib/document-pdf");
    try { await downloadDocument(r.invoices, profile ?? {}, r); } catch { toast.error("Could not create the PDF."); }
  }
  return (
    <AppShell>
      <h1 className="text-2xl font-extrabold">Receipts</h1>
      <p className="text-sm text-muted-foreground">A receipt is created each time you record a payment on an invoice.</p>
      <Card className="overflow-x-auto">
        {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : rows.length === 0 ? <p className="text-sm text-muted-foreground">No receipts yet. Record a payment on an invoice to create one.</p> : (
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-muted text-left text-xs text-muted-foreground"><tr><th className="p-2">Date</th><th>Invoice</th><th>Customer</th><th>Method</th><th>Amount</th><th /></tr></thead>
            <tbody>{rows.map((r) => (
              <tr key={r.id} className="border-b last:border-0">
                <td className="p-2">{r.paid_on}</td>
                <td>{r.invoices ? <Link to="/invoices/$id" params={{ id: r.invoices.id }} className="text-primary hover:underline">{r.invoices.number}</Link> : "—"}</td>
                <td>{r.invoices?.customers?.name ?? "—"}</td><td>{r.method}</td>
                <td className="font-semibold">{money(r.amount, r.invoices?.currency)}</td>
                <td className="p-2 text-right"><Button variant="ghost" size="sm" onClick={() => download(r)}><Download />PDF</Button></td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </Card>
    </AppShell>
  );
}
