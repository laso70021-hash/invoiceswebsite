import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/swahivo/ui";
import { Button } from "@/components/ui/button";
import { docKinds, isDocKind } from "@/lib/doc-kinds";
import { lineAmount, money, type LineItem } from "@/lib/invoice-math";

export const Route = createFileRoute("/q/$token")({
  ssr: false,
  head: () => ({ meta: [{ title: "Your quote — Swahivo" }, { name: "description", content: "Review and respond to a quote sent with Swahivo." }, { property: "og:title", content: "Your quote — Swahivo" }, { property: "og:description", content: "Review the quote and accept or decline it online." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: SharedDoc,
});

function SharedDoc() {
  const { token } = Route.useParams();
  const qc = useQueryClient();
  const key = ["shared", token];
  const { data: d, isLoading } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_shared_document", { _token: token });
      if (error) throw error;
      return data?.[0] ?? null;
    },
  });
  async function respond(accept: boolean) {
    const { error } = await supabase.rpc("respond_shared_document", { _token: token, _accept: accept });
    if (error) { toast.error(error.message); return; }
    toast.success(accept ? "Thank you — quote accepted" : "Quote declined");
    qc.invalidateQueries({ queryKey: key });
  }
  if (isLoading) return <p className="p-10 text-center text-muted-foreground">Loading…</p>;
  if (!d) return <p className="p-10 text-center text-muted-foreground">This link is not valid.</p>;
  const cfg = isDocKind(d.kind) ? docKinds[d.kind] : docKinds.quotation;
  const items = d.items as unknown as LineItem[];
  return (
    <main className="mx-auto max-w-3xl space-y-4 p-6">
      <Card className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4 rounded-lg bg-primary p-4 text-primary-foreground">
          <div><p className="text-xl font-extrabold">{d.business_name || "Business"}</p><p className="text-sm opacity-90">{cfg.single.toUpperCase()} {d.number}</p></div>
          <div className="text-right text-sm"><p>Issued {d.issue_date}</p>{d.due_date && <p>{cfg.date}: {d.due_date}</p>}</div>
        </div>
        <div className="text-sm"><p className="font-semibold">{cfg.party}: {d.party_name}</p>{d.party_details && <p className="whitespace-pre-line text-muted-foreground">{d.party_details}</p>}</div>
        <div className="overflow-x-auto"><table className="w-full min-w-[500px] text-sm">
          <thead className="bg-muted text-left text-xs text-muted-foreground"><tr><th className="p-2">Description</th><th>Qty</th><th>Price</th><th>Disc.</th><th className="text-right">Amount</th></tr></thead>
          <tbody>{items.map((it, i) => <tr key={i} className="border-b"><td className="p-2">{it.description}</td><td>{it.qty}</td><td>{money(it.price, d.currency)}</td><td>{it.discount}%</td><td className="text-right">{money(lineAmount(it), d.currency)}</td></tr>)}</tbody>
        </table></div>
        <div className="ml-auto w-64 space-y-1 text-sm">
          <div className="flex justify-between"><span>Subtotal</span><span>{money(d.subtotal, d.currency)}</span></div>
          <div className="flex justify-between"><span>Tax ({d.tax_rate}%)</span><span>{money(d.tax, d.currency)}</span></div>
          <div className="flex justify-between rounded bg-accent px-2 py-1 font-bold"><span>Total</span><span className="text-primary">{money(d.total, d.currency)}</span></div>
        </div>
        {d.notes && <p className="whitespace-pre-line text-sm text-muted-foreground">{d.notes}</p>}
        <div className="flex items-center justify-end gap-3 border-t pt-4">
          {d.status === "accepted" && <span className="font-semibold text-primary">You accepted this quote.</span>}
          {d.status === "declined" && <span className="font-semibold text-destructive">You declined this quote.</span>}
          {d.status === "converted" && <span className="font-semibold">This quote has been turned into an invoice.</span>}
          {["sent", "accepted", "declined"].includes(d.status) && <>
            <Button variant="outline" onClick={() => respond(false)}>Decline</Button>
            <Button onClick={() => respond(true)}>Accept quote</Button>
          </>}
        </div>
      </Card>
      <p className="text-center text-xs text-muted-foreground">Sent with Swahivo</p>
    </main>
  );
}
