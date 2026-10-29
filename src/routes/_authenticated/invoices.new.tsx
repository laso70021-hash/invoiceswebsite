import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/swahivo/app-shell";
import { Card } from "@/components/swahivo/ui";
import { Button } from "@/components/ui/button";
import { DocumentPreview } from "@/components/swahivo/document-preview";
import { DocumentStylePicker } from "@/components/swahivo/document-style-picker";
import { customersQuery, profileQuery } from "@/lib/data";
import { lineAmount, money, totals, type LineItem } from "@/lib/invoice-math";

export const Route = createFileRoute("/_authenticated/invoices/new")({
  head: () => ({ meta: [{ title: "New Invoice — Swahivo" }, { name: "description", content: "Create an invoice." }, { property: "og:title", content: "New Invoice — Swahivo" }, { property: "og:description", content: "Create and save your business invoice." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: NewInvoice,
});

const field = "w-full rounded-lg border bg-card px-3 py-2 text-sm outline-none focus:border-primary";

function NewInvoice() {
  const { data: customers = [] } = useQuery(customersQuery);
  const { data: profile } = useQuery(profileQuery);
  const currency = profile?.currency ?? "TZS";
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [customerId, setCustomerId] = useState("");
  const [due, setDue] = useState("");
  const [taxRate, setTaxRate] = useState(18);
  const [items, setItems] = useState<LineItem[]>([{ description: "", qty: 1, price: 0, discount: 0 }]);
  const [busy, setBusy] = useState(false);
  const t = totals(items, taxRate);
  const upd = (i: number, p: Partial<LineItem>) => setItems(items.map((it, k) => (k === i ? { ...it, ...p } : it)));

  async function save(status: "draft" | "sent") {
    if (!customerId) { toast.error("Choose a customer first."); return; }
    if (!items.some((i) => i.description && i.price > 0)) { toast.error("Add at least one item with a price."); return; }
    setBusy(true);
    const { data, error } = await supabase.from("invoices").insert({
      currency, customer_id: customerId || null, due_date: due || null, tax_rate: taxRate, items, status, ...t,
    }).select("id").single();
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(status === "draft" ? "Draft saved" : "Invoice finalized");
    await qc.invalidateQueries({ queryKey: ["invoices"] });
    if (data) navigate({ to: "/invoices/$id", params: { id: data.id } });
  }

  return (
    <AppShell>
      <h1 className="text-2xl font-extrabold">Create Invoice</h1>
      <DocumentStylePicker />
      <Card className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <label className="text-sm">Customer
            <select className={field} value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
              <option value="">Select customer</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label className="text-sm">Due date<input type="date" className={field} value={due} onChange={(e) => setDue(e.target.value)} /></label>
          <label className="text-sm">Tax (%)<input type="number" className={field} value={taxRate} onChange={(e) => setTaxRate(Number(e.target.value))} /></label>
        </div>
        <div className="overflow-x-auto"><table className="w-full min-w-[650px] text-sm">
          <thead className="bg-muted text-left text-xs text-muted-foreground"><tr><th className="p-2">Item / Description</th><th>Qty</th><th>Unit Price</th><th>Discount %</th><th>Amount</th><th /></tr></thead>
          <tbody>{items.map((it, i) => (
            <tr key={i}>
              <td className="p-1"><input className={field} value={it.description} onChange={(e) => upd(i, { description: e.target.value })} /></td>
              <td className="p-1 w-20"><input type="number" min={0} className={field} value={it.qty} onChange={(e) => upd(i, { qty: Number(e.target.value) })} /></td>
              <td className="p-1 w-36"><input type="number" min={0} className={field} value={it.price} onChange={(e) => upd(i, { price: Number(e.target.value) })} /></td>
              <td className="p-1 w-24"><input type="number" min={0} max={100} className={field} value={it.discount} onChange={(e) => upd(i, { discount: Number(e.target.value) })} /></td>
              <td className="p-1">{money(lineAmount(it), currency)}</td>
              <td><Button variant="ghost" size="icon" aria-label={`Remove item ${i + 1}`} onClick={() => setItems(items.filter((_, k) => k !== i))}><Trash2 className="h-4 w-4 text-muted-foreground" /></Button></td>
            </tr>
          ))}</tbody>
        </table></div>
        <Button variant="outline" onClick={() => setItems([...items, { description: "", qty: 1, price: 0, discount: 0 }])}><Plus className="h-4 w-4" />Add Item</Button>
        <div className="ml-auto w-64 space-y-1 text-sm">
          <div className="flex justify-between"><span>Subtotal</span><span>{money(t.subtotal, currency)}</span></div>
          <div className="flex justify-between"><span>Tax ({taxRate}%)</span><span>{money(t.tax, currency)}</span></div>
          <div className="flex justify-between rounded bg-accent px-2 py-1 font-bold"><span>Total</span><span className="text-primary">{money(t.total, currency)}</span></div>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" disabled={busy} onClick={() => save("draft")}>Save Draft</Button>
          <Button disabled={busy} onClick={() => save("sent")}>Finalize</Button>
        </div>
      </Card>
      <DocumentPreview document={{ title: "Draft Invoice", number: "", issueDate: new Date().toLocaleDateString("en-CA"), dueDate: due, party: customers.find(c => c.id === customerId)?.name ?? "", partyDetails: customers.find(c => c.id === customerId)?.address ?? "", business: profile ?? {}, currency, items, taxRate, ...t }} />
    </AppShell>
  );
}
