import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { DollarSign, CreditCard, Wallet, Clock, Users, FileText, Plus } from "lucide-react";
import { AppShell } from "@/components/swahivo/app-shell";
import { Card, CardHead, Stat, StatusPill } from "@/components/swahivo/ui";
import { customersQuery, invoicesQuery, profileQuery } from "@/lib/data";
import { balance, displayStatus, money } from "@/lib/invoice-math";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Swahivo" }, { name: "description", content: "Your Swahivo business overview." }, { property: "og:title", content: "Dashboard — Swahivo" }, { property: "og:description", content: "Your business invoices, payments and outstanding balances." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { data: inv = [] } = useQuery(invoicesQuery);
  const { data: cust = [] } = useQuery(customersQuery);
  const { data: profile } = useQuery(profileQuery);
  const invoiced = inv.reduce((s, i) => s + Number(i.total), 0);
  const collected = inv.reduce((s, i) => s + Number(i.amount_paid), 0);
  const overdue = inv.filter((i) => displayStatus(i.status, i.due_date, balance(i.total, i.amount_paid)) === "Overdue")
    .reduce((s, i) => s + balance(i.total, i.amount_paid), 0);
  return (
    <AppShell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><h1 className="text-3xl font-extrabold">Welcome back{profile?.full_name ? `, ${profile.full_name}` : ""}! 👋</h1><p className="text-muted-foreground">Here's what's happening with your business today.</p></div>
        <Link to="/invoices/new" className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"><Plus className="h-4 w-4" />Create Invoice</Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <Stat icon={DollarSign} tone="primary" label="Total Invoiced" value={money(invoiced)} delta="—" note="all time" />
        <Stat icon={CreditCard} tone="success" label="Total Collected" value={money(collected)} delta="—" note="all time" />
        <Stat icon={Wallet} tone="violet" label="Outstanding Balance" value={money(Math.max(0, invoiced - collected))} delta="—" note="all time" />
        <Stat icon={Clock} tone="warning" label="Overdue Amount" value={money(overdue)} delta="—" up={false} note="past due date" />
        <Stat icon={Users} tone="primary" label="Total Customers" value={String(cust.length)} delta="—" note="all time" />
        <Stat icon={FileText} tone="pink" label="Total Invoices" value={String(inv.length)} delta="—" note="all time" />
      </div>
      <Card className="overflow-x-auto">
        <CardHead title="Recent Invoices" />
        {inv.length === 0 ? <p className="text-sm text-muted-foreground">No invoices yet — create your first one.</p> : (
          <table className="w-full min-w-[580px] text-sm">
            <thead className="bg-muted text-left text-xs text-muted-foreground"><tr><th className="p-2">Invoice #</th><th>Customer</th><th>Total</th><th>Status</th><th>Date</th></tr></thead>
            <tbody>{inv.slice(0, 8).map((i) => (
              <tr key={i.id} className="border-b last:border-0"><td className="p-2 font-medium text-primary"><Link to="/invoices/$id" params={{ id: i.id }}>{i.number}</Link></td><td>{i.customers?.name ?? "—"}</td><td>{money(i.total, i.currency)}</td><td><StatusPill status={displayStatus(i.status, i.due_date, balance(i.total, i.amount_paid))} /></td><td>{i.issue_date}</td></tr>
            ))}</tbody>
          </table>
        )}
      </Card>
    </AppShell>
  );
}
