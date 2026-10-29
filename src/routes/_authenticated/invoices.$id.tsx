import { InvoiceSharing } from "@/components/swahivo/invoice-sharing";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Download, Check, Wallet, Receipt } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/swahivo/app-shell";
import { StatusPill } from "@/components/swahivo/ui";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { invoiceQuery, paymentsQuery, profileQuery } from "@/lib/data";
import { balance, displayStatus, lineAmount, money } from "@/lib/invoice-math";
import { DocumentPreview } from "@/components/swahivo/document-preview";
import { DocumentStylePicker } from "@/components/swahivo/document-style-picker";
import { invoiceDesign, downloadDocument } from "@/lib/document-pdf";

export const Route = createFileRoute("/_authenticated/invoices/$id")({
  head: () => ({
    meta: [
      { title: "Invoice Details — Swahivo" },
      {
        name: "description",
        content: "Review your Swahivo invoice, record payments and download receipts.",
      },
      { property: "og:title", content: "Invoice Details — Swahivo" },
      {
        property: "og:description",
        content: "Invoice details, payments and receipts for your business.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: async ({ context, params }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(invoiceQuery(params.id)),
      context.queryClient.ensureQueryData(paymentsQuery(params.id)),
      context.queryClient.ensureQueryData(profileQuery),
    ]);
  },
  component: InvoiceDetails,
});

const field =
  "mt-1 w-full rounded-md border bg-card px-3 py-2 text-sm outline-none focus:border-primary";

function InvoiceDetails() {
  const { id } = Route.useParams();
  const { data: invoice } = useSuspenseQuery(invoiceQuery(id));
  const { data: payments } = useSuspenseQuery(paymentsQuery(id));
  const { data: profile } = useSuspenseQuery(profileQuery);
  const qc = useQueryClient();
  const [showPayment, setShowPayment] = useState(false);
  const [amount, setAmount] = useState("");
  const [paidOn, setPaidOn] = useState("");
  const [method, setMethod] = useState("Bank Transfer");
  const [busy, setBusy] = useState(false);
  const due = balance(invoice.total, invoice.amount_paid);
  const business = profile?.business_name || "My Business";
  const refresh = () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: ["invoice", id] }),
      qc.invalidateQueries({ queryKey: ["payments", id] }),
      qc.invalidateQueries({ queryKey: ["invoices"] }),
    ]);

  async function finalize() {
    setBusy(true);
    try {
      const { error } = await supabase
        .from("invoices")
        .update({ status: "sent" })
        .eq("id", id)
        .eq("status", "draft");
      if (error) throw error;
      await refresh();
      toast.success("Invoice finalized");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not finalize invoice.");
    } finally {
      setBusy(false);
    }
  }

  async function recordPayment(e: React.FormEvent) {
    e.preventDefault();
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0 || value > due) {
      toast.error("Enter an amount greater than zero and no more than the balance due.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase
        .from("payments")
        .insert({ invoice_id: id, amount: value, method, paid_on: paidOn });
      if (error) throw error;
      await refresh();
      setShowPayment(false);
      toast.success("Payment recorded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not record payment.");
    } finally {
      setBusy(false);
    }
  }

  async function download(payment?: (typeof payments)[number]) {
    try {
      await downloadDocument(invoice, profile ?? { business_name: business }, payment);
    } catch {
      toast.error("Could not download document. Please try again.");
    }
  }

  return (
    <AppShell>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-2">
          <Button asChild variant="ghost" size="sm">
            <Link to="/invoices">
              <ArrowLeft />
              Invoices
            </Link>
          </Button>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-extrabold">{invoice.number}</h1>
            <StatusPill status={displayStatus(invoice.status, invoice.due_date, due)} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => download()}>
            <Download />
            Download PDF
          </Button>
          {invoice.status === "draft" ? (
            <Button disabled={busy} onClick={finalize}>
              <Check />
              Finalize
            </Button>
          ) : (
            due > 0 && (
              <Button
                disabled={busy}
                onClick={() => {
                  setAmount(String(due));
                  setPaidOn(new Date().toLocaleDateString("en-CA"));
                  setShowPayment(!showPayment);
                }}
              >
                <Wallet />
                Record Payment
              </Button>
            )
          )}
        </div>
      </div>
      {showPayment && (
        <form onSubmit={recordPayment} className="grid gap-4 border-y py-5 sm:grid-cols-4">
          <label className="text-sm">
            Amount ({invoice.currency})
            <input
              required
              aria-label="Payment amount"
              type="number"
              min="0.01"
              max={due}
              step="0.01"
              className={field}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </label>
          <label className="text-sm">
            Payment date
            <input
              required
              type="date"
              className={field}
              value={paidOn}
              onChange={(e) => setPaidOn(e.target.value)}
            />
          </label>
          <label className="text-sm">
            Payment method
            <select className={field} value={method} onChange={(e) => setMethod(e.target.value)}>
              {["Bank Transfer", "Mobile Money", "Cash", "Card", "Other"].map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </label>
          <div className="flex items-end gap-2">
            <Button disabled={busy} type="submit">
              {busy ? "Saving…" : "Save Payment"}
            </Button>
            <Button variant="ghost" type="button" onClick={() => setShowPayment(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}
      <InvoiceSharing
        id={invoice.id}
        number={invoice.number ?? invoice.id}
        customerEmail={invoice.customers?.email ?? ""}
      />
      <DocumentStylePicker />
      <DocumentPreview document={invoiceDesign(invoice, profile ?? { business_name: business })} />
      <section className="space-y-4 pt-3">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <Receipt className="h-5 w-5" />
          Payments & Receipts
        </h2>
        {payments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No payments recorded.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead className="border-y text-xs text-muted-foreground">
                <tr>
                  <th className="py-3">Date</th>
                  <th>Method</th>
                  <th>Amount</th>
                  <th className="text-right">Receipt</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr className="border-b" key={p.id}>
                    <td className="py-3">{p.paid_on}</td>
                    <td>{p.method}</td>
                    <td className="font-semibold">{money(p.amount, invoice.currency)}</td>
                    <td className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => download(p)}
                        aria-label={`Download receipt for ${money(p.amount, invoice.currency)}`}
                      >
                        <Download />
                        PDF
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AppShell>
  );
}
