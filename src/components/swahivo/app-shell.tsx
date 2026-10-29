import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useState } from "react";
import {
  LayoutDashboard,
  FileText,
  Users,
  ShoppingCart,
  Wallet,
  Repeat,
  Package,
  Boxes,
  BarChart3,
  Calculator,
  Settings,
  LayoutGrid,
  ChevronUp,
  ChevronDown,
  Search,
  Plus,
  Bell,
  CircleHelp,
  Building2,
  LogOut,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { profileQuery } from "@/lib/data";
import { Avatar, Logo, toneBg } from "./ui";
import { cn } from "@/lib/utils";
import type { DocKind } from "@/lib/doc-kinds";
import { Button } from "@/components/ui/button";

type Item = [
  React.ComponentType<{ className?: string }>,
  string,
  (
    | "/invoices"
    | "/customers"
    | "/receipts"
    | "/tools"
    | "/settings"
    | "/templates"
    | "/received"
    | "/accounting"
    | "/team"
    | `work:${string}`
    | `doc:${DocKind}`
  )?,
];
const groups: { label: string; items: Item[] }[] = [
  {
    label: "Documents",
    items: [
      [FileText, "Invoices", "/invoices"],
      [FileText, "Proforma Invoices", "doc:proforma"],
      [FileText, "Tax Invoices", "doc:tax_invoice"],
      [FileText, "Quotations", "doc:quotation"],
      [FileText, "Receipts", "/receipts"],
      [FileText, "Purchase Orders", "doc:purchase_order"],
      [FileText, "Delivery Notes", "doc:delivery_note"],
      [LayoutGrid, "All Tools", "/tools"],
    ],
  },
  {
    label: "Sales",
    items: [
      [Users, "Customers", "/customers"],
      [FileText, "Received Invoices", "/received"],
      [Wallet, "Payments", "work:payments"],
      [Repeat, "Recurring Billing", "work:recurring"],
    ],
  },
  {
    label: "Purchases",
    items: [
      [Users, "Suppliers", "work:suppliers"],
      [ShoppingCart, "Purchase Orders", "doc:purchase_order"],
      [Wallet, "Expenses", "work:expenses"],
    ],
  },
  {
    label: "Catalog",
    items: [
      [Package, "Products", "work:products"],
      [Package, "Services", "work:services"],
      [Boxes, "Inventory", "work:inventory"],
    ],
  },
  {
    label: "Finance",
    items: [
      [BarChart3, "Reports", "work:reports"],
      [Calculator, "Accounting", "/accounting"],
    ],
  },
  {
    label: "Business",
    items: [
      [Users, "Team Members", "/team"],
      [FileText, "Templates", "/templates"],
      [Settings, "Business Settings", "/settings"],
    ],
  },
];

export function AppShell({ children }: { children: ReactNode }) {
  const [closed, setClosed] = useState<Record<string, boolean>>({});
  const { data: profile } = useQuery(profileQuery);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const name = profile?.full_name || profile?.email || "You";

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const linkCls =
    "mt-0.5 flex w-full items-center gap-3 rounded-lg px-3 py-1.5 text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground";
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 overflow-y-auto border-r bg-sidebar p-3 lg:block">
        <div className="px-2 py-2">
          <Logo />
        </div>
        <Link
          to="/dashboard"
          className={cn(linkCls, "mt-3 font-semibold")}
          activeProps={{ className: "!bg-primary !text-primary-foreground" }}
        >
          <LayoutDashboard className="h-4 w-4" /> Dashboard
        </Link>
        {groups.map((g) => (
          <div key={g.label} className="mt-4">
            <button
              onClick={() => setClosed({ ...closed, [g.label]: !closed[g.label] })}
              className="flex w-full items-center justify-between px-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground"
            >
              {g.label}
              {closed[g.label] ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronUp className="h-3.5 w-3.5" />
              )}
            </button>
            {!closed[g.label] &&
              g.items.map(([I, l, to]) =>
                to?.startsWith("doc:") ? (
                  <Link
                    key={l}
                    to="/documents/$kind"
                    params={{ kind: to.slice(4) }}
                    className={linkCls}
                    activeProps={{
                      className: "!bg-primary !text-primary-foreground font-semibold",
                    }}
                  >
                    <I className="h-4 w-4" />
                    {l}
                  </Link>
                ) : to?.startsWith("work:") ? (
                  <Link
                    key={l}
                    to="/workspace/$module"
                    params={{ module: to.slice(5) }}
                    className={linkCls}
                    activeProps={{
                      className: "!bg-primary !text-primary-foreground font-semibold",
                    }}
                  >
                    <I className="h-4 w-4" />
                    {l}
                  </Link>
                ) : to ? (
                  <Link
                    key={l}
                    to={to as "/invoices"}
                    className={linkCls}
                    activeProps={{
                      className: "!bg-primary !text-primary-foreground font-semibold",
                    }}
                  >
                    <I className="h-4 w-4" />
                    {l}
                  </Link>
                ) : (
                  <span
                    key={l}
                    className={cn(linkCls, "cursor-default opacity-50 hover:bg-transparent")}
                    title="Coming soon"
                  >
                    <I className="h-4 w-4" />
                    {l}
                    <span className="ml-auto text-[10px]">Soon</span>
                  </span>
                ),
              )}
          </div>
        ))}
      </aside>
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-10 flex items-center gap-4 border-b bg-card px-6 py-3">
          <div className="flex items-center gap-3">
            <span className={cn("grid h-9 w-9 place-items-center rounded-lg", toneBg.primary)}>
              <Building2 className="h-4 w-4" />
            </span>
            <div className="text-sm leading-tight">
              <p className="font-semibold">{profile?.business_name || "My Business"}</p>
              <p className="text-xs text-muted-foreground">
                {profile?.currency ?? "TZS"} - Tanzanian Shilling
              </p>
            </div>
          </div>
          <div className="hidden flex-1 items-center gap-2 rounded-lg border bg-muted px-3 py-2 text-sm text-muted-foreground md:flex">
            <Search className="h-4 w-4" /> Search invoices, customers, products, documents...
          </div>
          <div className="ml-auto flex items-center gap-4">
            <Link
              to="/invoices/new"
              className="grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground"
              title="New invoice"
            >
              <Plus className="h-4 w-4" />
            </Link>
            <Bell className="h-5 w-5" />
            <CircleHelp className="h-5 w-5" />
            <div className="flex items-center gap-2">
              <Avatar name={name} tone="pink" />
              <div className="hidden text-sm leading-tight sm:block">
                <p className="font-semibold">{name}</p>
                <p className="text-xs text-muted-foreground">Owner</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={signOut}
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </header>
        <nav
          aria-label="Business navigation"
          className="flex gap-1 overflow-x-auto border-b bg-card px-3 py-2 lg:hidden"
        >
          <Button asChild variant="ghost" size="sm">
            <Link to="/dashboard">
              <LayoutDashboard />
              Dashboard
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link to="/invoices">
              <FileText />
              Invoices
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link to="/customers">
              <Users />
              Customers
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link to="/accounting">Accounting</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link to="/team">Team</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link to="/received">Received</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link to="/settings">Settings</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link to="/workspace/$module" params={{ module: "products" }}>
              Products
            </Link>
          </Button>
        </nav>
        <main className="space-y-5 p-6">{children}</main>
      </div>
    </div>
  );
}
