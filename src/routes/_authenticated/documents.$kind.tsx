import { DocumentPreview } from "@/components/swahivo/document-preview";
import { DocumentStylePicker } from "@/components/swahivo/document-style-picker";
import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { queryOptions, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowRightLeft, Download, Plus, Send, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { AppShell } from "@/components/swahivo/app-shell";
import { Card } from "@/components/swahivo/ui";
import { Button } from "@/components/ui/button";
import { customersQuery, profileQuery } from "@/lib/data";
import { docKinds, isDocKind, type DocKind } from "@/lib/doc-kinds";
import { lineAmount, money, totals, type LineItem } from "@/lib/invoice-math";

export type BusinessDoc = Omit<Tables<"documents">, "items"> & { items: LineItem[] };

const docsQuery = (kind: DocKind) => queryOptions({
  queryKey: ["documents", kind],
  queryFn: async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) throw new Error("Sign in to view your records.");
    const { data, error } = await supabase.from("documents").select("*").eq("user_id", u.user.id).eq("kind", kind).order("created_at", { ascending: false });
    if (error) throw error;
    return data as unknown as BusinessDoc[];
  },
});

export const Route = createFileRoute("/_authenticated/documents/$kind")({
  beforeLoad: ({ params }) => { if (!isDocKind(params.kind)) throw notFound(); },
  head: ({ params }) => {
    const l = isDocKind(params.kind) ? docKinds[params.kind].label : "Documents";
    return { meta: [{ title: `${l} — Swahivo` }, { name: "description", content: `Create and download ${l.toLowerCase()}.` }, { property: "og:title", content: `${l} — Swahivo` }, { property: "og:description", content: `Create and download ${l.toLowerCase()} for your business.` }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] };
  },
  component: DocsPage,
});

const field = "w-full rounded-lg border bg-card px-3 py-2 text-sm outline-none focus:border-primary";
const blank = (): LineItem => ({ description: "", qty: 1, price: 0, discount: 0 });

function DocsPage() {
  const kind = Route.useParams().kind as DocKind;
  const cfg = docKinds[kind];
  const sendable = kind === "quotation" || kind === "proforma";
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: docs = [], isLoading } = useQuery(docsQuery(kind));
  const { data: customers = [] } = useQuery(customersQuery);
  const { data: profile } = useQuery(profileQuery);
  const [open, setOpen] = useState(false);
  const [party, setParty] = useState("");
  const [details, setDetails] = useState("");
  const [date, setDate] = useState("");
  const [taxRate, setTaxRate] = useState(cfg.taxed ? 18 : 0);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<LineItem[]>([blank()]);
  const [busy, setBusy] = useState(false);
  const t = totals(cfg.priced ? items : [], cfg.taxed ? taxRate : 0);
  const upd = (i: number, p: Partial<LineItem>) => setItems(items.map((it, k) => (k === i ? { ...it, ...p } : it)));

  function pickCustomer(id: string) {
    const c = customers.find((x) => x.id === id);
    if (c) { setParty(c.name); setDetails([c.address, c.email].filter(Boolean).join("\n")); }
  }

  async function save() {
    if (!party.trim()) { toast.error(`Enter the ${cfg.party.toLowerCase()} name.`); return; }
    const valid = items.filter((i) => i.description.trim() && i.qty > 0);
    if (!valid.length) { toast.error("Add at least one item."); return; }
    setBusy(true);
    const { error } = await supabase.from("documents").insert({
      kind, party_name: party.trim(), party_details: details || null, due_date: date || null,
      tax_rate: cfg.taxed ? taxRate : 0, items: valid, notes: notes || null, currency: profile?.currency ?? "TZS", ...t,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`${cfg.single} saved`);
    setOpen(false); setParty(""); setDetails(""); setDate(""); setNotes(""); setItems([blank()]);
    qc.invalidateQueries({ queryKey: ["documents", kind] });
  }

  async function remove(d: BusinessDoc) {
    if (!confirm(`Delete ${d.number}?`)) return;
    const { error } = await supabase.from("documents").delete().eq("id", d.id).eq("user_id", d.user_id);
    if (error) { toast.error(error.message); return; }
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["documents", kind] });
  }

  async function download(d: BusinessDoc) {
    const { downloadBusinessDocument } = await import("@/lib/document-pdf");
    try { await downloadBusinessDocument(d, cfg, profile ?? {}); } catch { toast.error("Could not create the PDF."); }
  }

  async function send(d: BusinessDoc) {
    const token = d.share_token ?? crypto.randomUUID();
    const { error } = await supabase.from("documents").update({ share_token: token, status: d.status === "draft" ? "sent" : d.status }).eq("id", d.id).eq("user_id", d.user_id);
    if (error) { toast.error(error.message); return; }
    const url = `${window.location.origin}/q/${token}`;
    try { await navigator.clipboard.writeText(url); toast.success("Link copied — paste it to your customer"); } catch { toast.success(url); }
    qc.invalidateQueries({ queryKey: ["documents", kind] });
  }

  function whatsapp(d: BusinessDoc) {
    if (!d.share_token) return;
    const text = `${cfg.single} ${d.number} from ${profile?.business_name || "us"}: ${window.location.origin}/q/${d.share_token}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener");
  }

  async function convert(d: BusinessDoc) {
    if (d.invoice_id) { navigate({ to: "/invoices/$id", params: { id: d.invoice_id } }); return; }
    let cust = customers.find((c) => c.name.trim().toLowerCase() === d.party_name.trim().toLowerCase());
    if (!cust) {
      const { data, error } = await supabase.from("customers").insert({ name: d.party_name, address: d.party_details }).select().single();
      if (error) { toast.error(error.message); return; }
      cust = data;
    }
    const { data: inv, error } = await supabase.from("invoices").insert({
      customer_id: cust.id, currency: d.currency, items: d.items, tax_rate: d.tax_rate, subtotal: d.subtotal, tax: d.tax, total: d.total, notes: d.notes, status: "draft",
    }).select("id").single();
    if (error) { toast.error(error.message); return; }
    await supabase.from("documents").update({ status: "converted", invoice_id: inv.id }).eq("id", d.id).eq("user_id", d.user_id);
    toast.success("Draft invoice created");
    qc.invalidateQueries();
    navigate({ to: "/invoices/$id", params: { id: inv.id } });
  }

  return (
    <AppShell>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">{cfg.label}</h1>
        <Button onClick={() => setOpen(!open)}><Plus />New {cfg.single}</Button>
      </div>
      <DocumentStylePicker />
      {open && (
        <Card className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <label className="text-sm">{cfg.party}
              <input className={field} value={party} onChange={(e) => setParty(e.target.value)} placeholder="Name" />
            </label>
            {cfg.party !== "Supplier" && customers.length > 0 && (
              <label className="text-sm">Fill from customer
                <select className={field} defaultValue="" onChange={(e) => pickCustomer(e.target.value)}>
                  <option value="">Choose…</option>
                  {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </label>
            )}
            <label className="text-sm">{cfg.date}<input type="date" className={field} value={date} onChange={(e) => setDate(e.target.value)} /></label>
            {cfg.taxed && <label className="text-sm">Tax (%)<input type="number" className={field} value={taxRate} onChange={(e) => setTaxRate(Number(e.target.value))} /></label>}
            <label className="text-sm md:col-span-2">Address / contact<textarea rows={2} className={field} value={details} onChange={(e) => setDetails(e.target.value)} /></label>
          </div>
          <div className="overflow-x-auto"><table className="w-full min-w-[600px] text-sm">
            <thead className="bg-muted text-left text-xs text-muted-foreground"><tr><th className="p-2">Item / Description</th><th>Qty</th>{cfg.priced && <><th>Unit Price</th><th>Discount %</th><th>Amount</th></>}<th /></tr></thead>
            <tbody>{items.map((it, i) => (
              <tr key={i}>
                <td className="p-1"><input aria-label="Description" className={field} value={it.description} onChange={(e) => upd(i, { description: e.target.value })} /></td>
                <td className="w-20 p-1"><input aria-label="Quantity" type="number" min={0} className={field} value={it.qty} onChange={(e) => upd(i, { qty: Number(e.target.value) })} /></td>
                {cfg.priced && <>
                  <td className="w-36 p-1"><input aria-label="Unit price" type="number" min={0} className={field} value={it.price} onChange={(e) => upd(i, { price: Number(e.target.value) })} /></td>
                  <td className="w-24 p-1"><input aria-label="Discount" type="number" min={0} max={100} className={field} value={it.discount} onChange={(e) => upd(i, { discount: Number(e.target.value) })} /></td>
                  <td className="p-1">{money(lineAmount(it))}</td>
                </>}
                <td><Button variant="ghost" size="icon" aria-label={`Remove item ${i + 1}`} onClick={() => setItems(items.filter((_, k) => k !== i))}><Trash2 className="h-4 w-4 text-muted-foreground" /></Button></td>
              </tr>
            ))}</tbody>
          </table></div>
          <Button variant="outline" onClick={() => setItems([...items, blank()])}><Plus />Add Item</Button>
          <label className="block text-sm">Notes<textarea rows={2} className={field} value={notes} onChange={(e) => setNotes(e.target.value)} /></label>
          {cfg.priced && (
            <div className="ml-auto w-64 space-y-1 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>{money(t.subtotal)}</span></div>
              {cfg.taxed && <div className="flex justify-between"><span>Tax ({taxRate}%)</span><span>{money(t.tax)}</span></div>}
              <div className="flex justify-between rounded bg-accent px-2 py-1 font-bold"><span>Total</span><span className="text-primary">{money(t.total)}</span></div>
            </div>
          )}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button disabled={busy} onClick={save}>Save {cfg.single}</Button>
          </div>
        </Card>
      )}
      {open && <DocumentPreview document={{ title: cfg.single, number: "", issueDate: new Date().toLocaleDateString("en-CA"), dueDate: date, dueLabel: cfg.date, partyLabel: cfg.party, party, partyDetails: details, business: profile ?? {}, currency: profile?.currency ?? "TZS", items, taxRate: cfg.taxed ? taxRate : 0, notes, priced: cfg.priced, ...t }} />}
      <Card className="overflow-x-auto">
        {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : docs.length === 0 ? <p className="text-sm text-muted-foreground">No {cfg.label.toLowerCase()} yet.</p> : (
          <table className="w-full min-w-[700px] text-sm">
            <thead className="bg-muted text-left text-xs text-muted-foreground"><tr><th className="p-2">Number</th><th>{cfg.party}</th><th>Issued</th><th>{cfg.date}</th>{cfg.priced && <th>Total</th>}{sendable && <th>Status</th>}<th /></tr></thead>
            <tbody>{docs.map((d) => (
              <tr key={d.id} className="border-b last:border-0">
                <td className="p-2 font-medium text-primary">{d.number}</td><td>{d.party_name}</td><td>{d.issue_date}</td><td>{d.due_date ?? "—"}</td>
                {cfg.priced && <td>{money(d.total, d.currency)}</td>}
                {sendable && <td className="capitalize">{d.status}</td>}
                <td className="whitespace-nowrap p-2 text-right">
                  {sendable && <>
                    <Button variant="ghost" size="sm" onClick={() => send(d)}><Send />{d.share_token ? "Copy link" : "Send"}</Button>
                    {d.share_token && <Button variant="ghost" size="sm" onClick={() => whatsapp(d)}>WhatsApp</Button>}
                    <Button variant="ghost" size="sm" onClick={() => convert(d)}><ArrowRightLeft />{d.invoice_id ? "Open invoice" : "To invoice"}</Button>
                  </>}
                  <Button variant="ghost" size="sm" onClick={() => download(d)}><Download />PDF</Button>
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => remove(d)}>Delete</Button>
                </td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </Card>
    </AppShell>
  );
}
