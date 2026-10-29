import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { DocumentPreview } from "@/components/swahivo/document-preview";
import { documentStyles, type DocumentStyle, type DesignedDocument } from "@/lib/document-design";
import { createDocumentPdf } from "@/lib/document-pdf";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/templates")({
  head: () => ({ meta: [{ title: "Document Templates — Swahivo" }] }),
  component: Templates,
});

const example: DesignedDocument = {
  title: "Invoice",
  number: "SAMPLE-001",
  issueDate: "2026-10-28",
  dueDate: "2026-11-11",
  party: "Sample Customer",
  partyDetails: "Customer address\ncustomer@example.com",
  business: {
    business_name: "Your Business",
    address: "Business address",
    email: "hello@example.com",
    payment_instructions: "Add your bank or mobile money payment instructions.",
  },
  currency: "TZS",
  items: [
    { description: "Professional services", qty: 2, price: 50000, discount: 0 },
    { description: "Materials and supplies", qty: 3, price: 20000, discount: 0 },
  ],
  subtotal: 160000,
  taxRate: 10,
  tax: 16000,
  total: 176000,
  paid: 0,
  notes: "Sample document for design preview only. Tax is illustrative and configurable.",
};

function Templates() {
  const [style, setStyle] = useState<DocumentStyle>("classic");
  const [busy, setBusy] = useState(false);
  const document = { ...example, business: { ...example.business, template_style: style } };
  async function download() {
    setBusy(true);
    try {
      (await createDocumentPdf(document)).save(`Swahivo-${style}-sample.pdf`);
    } catch {
      toast.error("Could not create the sample PDF.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link to="/" className="text-sm text-blue-700">
              ← Swahivo
            </Link>
            <h1 className="mt-3 text-3xl font-extrabold">Documents that mean business.</h1>
            <p className="mt-2 text-slate-600">
              Explore your document styles. This preview contains sample data.
            </p>
          </div>
          <Button asChild>
            <Link to="/invoices/new">Create an invoice</Link>
          </Button>
        </div>
        <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
          <aside className="space-y-3">
            <h2 className="font-semibold">Choose a style</h2>
            {Object.entries(documentStyles).map(([id, palette]) => (
              <button
                key={id}
                aria-pressed={style === id}
                onClick={() => setStyle(id as DocumentStyle)}
                className={`flex w-full items-center gap-3 rounded-xl border bg-white p-4 text-left text-sm font-medium ${style === id ? "border-blue-600 ring-1 ring-blue-600" : "border-slate-200"}`}
              >
                <span
                  className="h-8 w-8 shrink-0 rounded"
                  style={{
                    background: palette.header,
                    borderBottom: `5px solid ${palette.accent}`,
                  }}
                />
                {palette.label}
              </button>
            ))}
            <Button variant="outline" className="w-full" disabled={busy} onClick={download}>
              {busy ? "Generating…" : "Download sample PDF"}
            </Button>
          </aside>
          <DocumentPreview document={document} />
        </div>
      </div>
    </main>
  );
}
