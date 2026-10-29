import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { sharedInvoiceSchema } from "@/lib/shared-invoice";
import { DocumentPreview } from "@/components/swahivo/document-preview";
import { createDocumentPdf } from "@/lib/document-pdf";
import { whatsappUrl } from "@/lib/branding";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/bill/$token")({
  ssr: false,
  head: () => ({
    meta: [{ title: "Your invoice — Swahivo" }, { name: "robots", content: "noindex,nofollow" }],
  }),
  component: SharedInvoice,
});
function SharedInvoice() {
  const { token } = Route.useParams();
  const [busy, setBusy] = useState(false);
  const {
    data: d,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["shared-invoice", token],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_shared_invoice", { _token: token });
      if (error) throw error;
      return data ? sharedInvoiceSchema.parse(data) : null;
    },
  });
  if (isLoading) return <p className="p-10 text-center">Loading invoice…</p>;
  if (error)
    return (
      <main className="p-10 text-center">
        <p role="alert">Unable to load invoice: {error.message}</p>
        <p>The owner may need to enable the invoice-sharing backend.</p>
      </main>
    );
  if (!d)
    return (
      <main className="space-y-3 p-10 text-center">
        <h1 className="text-xl font-bold">Invoice unavailable</h1>
        <p>The link may be revoked, or this invoice requires the recipient business account.</p>
        <Link to="/auth" search={{ redirect: `/bill/${token}` }} className="text-primary underline">
          Sign in to your business account
        </Link>
      </main>
    );
  const document = {
    title: d.status === "draft" ? "Draft Invoice" : "Invoice",
    number: d.number ?? d.id,
    issueDate: d.issue_date,
    dueDate: d.due_date ?? null,
    party: d.customer_name ?? "",
    partyDetails: d.customer_address ?? null,
    business: d.business,
    currency: d.currency,
    items: d.items,
    subtotal: d.subtotal,
    tax: d.tax,
    taxRate: d.tax_rate,
    total: d.total,
    paid: d.amount_paid,
    notes: d.notes ?? null,
  };
  let contact = "";
  try {
    if (d.business.whatsapp_number)
      contact = whatsappUrl(
        d.business.whatsapp_number,
        `Hello, regarding invoice ${d.number ?? d.id}`,
      );
  } catch {
    /* Invalid business contact is not shown. */
  }
  async function download() {
    setBusy(true);
    try {
      (await createDocumentPdf(document)).save(`${d!.number ?? "Invoice"}.pdf`);
    } catch {
      toast.error("Could not generate PDF.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="mx-auto max-w-5xl space-y-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Invoice from {d.business.business_name}</h1>
        <div className="flex gap-2">
          <Button disabled={busy} onClick={download}>
            Download PDF
          </Button>
          {contact && (
            <Button asChild variant="outline">
              <a href={contact} target="_blank" rel="noreferrer">
                Contact on WhatsApp
              </a>
            </Button>
          )}
        </div>
      </div>
      <DocumentPreview document={document} />
      <p className="text-center text-xs text-muted-foreground">
        This page displays an invoice. It does not process a payment.
      </p>
    </main>
  );
}
