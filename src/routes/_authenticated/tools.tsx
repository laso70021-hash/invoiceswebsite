import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText, Receipt } from "lucide-react";
import { AppShell } from "@/components/swahivo/app-shell";
import { Card } from "@/components/swahivo/ui";
import { docKinds, type DocKind } from "@/lib/doc-kinds";

export const Route = createFileRoute("/_authenticated/tools")({
  head: () => ({ meta: [{ title: "All Tools — Swahivo" }, { name: "description", content: "Every business document tool in Swahivo." }, { property: "og:title", content: "All Tools — Swahivo" }, { property: "og:description", content: "Invoices, quotations, receipts, purchase orders and more." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: Tools,
});

const tile = "flex items-center gap-3 rounded-xl border bg-card p-4 font-semibold hover:border-primary";

function Tools() {
  return (
    <AppShell>
      <h1 className="text-2xl font-extrabold">All Tools</h1>
      <Card className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Link to="/invoices" className={tile}><FileText className="h-5 w-5 text-primary" />Invoices</Link>
        {(Object.keys(docKinds) as DocKind[]).map((k) => (
          <Link key={k} to="/documents/$kind" params={{ kind: k }} className={tile}><FileText className="h-5 w-5 text-primary" />{docKinds[k].label}</Link>
        ))}
        <Link to="/receipts" className={tile}><Receipt className="h-5 w-5 text-primary" />Receipts</Link>
      </Card>
    </AppShell>
  );
}
