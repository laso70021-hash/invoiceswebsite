import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  LayoutDashboard,
  Users,
  Building2,
  FileText,
  Wallet,
  Search,
  ArrowLeft,
  RefreshCw,
  Shield,
  ShieldOff,
  UserX,
  UserCheck,
  Trash2,
  X,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Avatar, Logo, StatusPill } from "@/components/swahivo/ui";
import { supabase } from "@/integrations/supabase/client";
import { adminQuery, currencyTotals, type AdminUser } from "@/lib/admin-data";
import { balance, displayStatus, money } from "@/lib/invoice-math";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin")({
  validateSearch: (search: Record<string, unknown>): { view?: View } =>
    views.some((v) => v.name === search["view"]) ? { view: search["view"] as View } : {},
  beforeLoad: async () => {
    const { data: u } = await supabase.auth.getUser();
    const { data: ok } = u.user
      ? await supabase.rpc("has_role", { _user_id: u.user.id, _role: "admin" })
      : { data: false };
    if (!ok) throw redirect({ to: "/dashboard" });
  },
  loader: ({ context }) => context.queryClient.ensureQueryData(adminQuery),
  head: () => ({
    meta: [
      { title: "Admin Panel — Swahivo" },
      {
        name: "description",
        content: "Swahivo platform administration: users, businesses, invoices and payments.",
      },
      { property: "og:title", content: "Admin Panel — Swahivo" },
      {
        property: "og:description",
        content: "Manage Swahivo users, businesses, invoices and payments.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Admin,
});

const views = [
  { name: "Overview", icon: LayoutDashboard },
  { name: "Users", icon: Users },
  { name: "Businesses", icon: Building2 },
  { name: "Invoices", icon: FileText },
  { name: "Payments", icon: Wallet },
] as const;
type View = (typeof views)[number]["name"];
type Action =
  | { kind: "suspend" | "role"; user: AdminUser; value: boolean }
  | { kind: "delete"; id: string; number: string | null };
const date = (value: string) =>
  new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

function Admin() {
  const { data } = useSuspenseQuery(adminQuery);
  const qc = useQueryClient();
  const view = Route.useSearch().view ?? "Overview";
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [action, setAction] = useState<Action | null>(null);
  const [busy, setBusy] = useState(false);
  const [page, setPage] = useState(1);
  const userMap = useMemo(() => new Map(data.users.map((u) => [u.id, u])), [data.users]);
  const business = (id: string) =>
    userMap.get(id)?.business_name || userMap.get(id)?.full_name || "—";
  const matches = (...values: unknown[]) =>
    values.join(" ").toLowerCase().includes(search.toLowerCase().trim());
  const users = data.users.filter((u) => matches(u.full_name, u.email, u.business_name));
  const businesses = users.filter((u) => u.business_name);
  const invoices = data.invoices.filter((i) =>
    matches(i.number, i.customers?.name, business(i.user_id), i.status),
  );
  const payments = data.payments.filter((p) =>
    matches(p.invoices?.number, business(p.user_id), p.method),
  );
  const count =
    view === "Users"
      ? users.length
      : view === "Businesses"
        ? businesses.length
        : view === "Invoices"
          ? invoices.length
          : payments.length;
  const slice = <T,>(rows: T[]) => rows.slice((page - 1) * 20, page * 20);
  const invoiced = currencyTotals(
    data.invoices.map((i) => ({ currency: i.currency, amount: i.total })),
  );
  const collected = currencyTotals(
    data.payments.map((p) => ({ currency: p.invoices?.currency ?? "Unknown", amount: p.amount })),
  );
  const outstanding = currencyTotals(
    data.invoices
      .filter((i) => i.status !== "draft")
      .map((i) => ({ currency: i.currency, amount: balance(i.total, i.amount_paid) })),
  );
  const growth = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, index) => {
      const start = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1);
      const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
      return {
        month: start.toLocaleDateString("en-GB", { month: "short" }),
        users: data.users.filter(
          (u) => new Date(u.created_at) >= start && new Date(u.created_at) < end,
        ).length,
        invoices: data.invoices.filter(
          (i) => new Date(i.created_at) >= start && new Date(i.created_at) < end,
        ).length,
      };
    });
  }, [data]);
  const totals = (values: Record<string, number>) =>
    Object.entries(values).map(([currency, amount]) => (
      <p key={currency} className="break-words text-lg font-bold">
        {money(amount, currency === "Unknown" ? "TZS" : currency)}
      </p>
    ));
  function selectView(next: View) {
    navigate({ to: "/admin", search: { view: next } });
    setSearch("");
    setPage(1);
  }

  async function confirmAction() {
    if (!action || busy) return;
    setBusy(true);
    try {
      const result =
        action.kind === "delete"
          ? await supabase.from("invoices").delete().eq("id", action.id).select("id").single()
          : action.kind === "suspend"
            ? await supabase.rpc("admin_set_suspended", {
                _user: action.user.id,
                _value: action.value,
              })
            : await supabase.rpc("admin_set_admin", {
                _user: action.user.id,
                _value: action.value,
              });
      if (result.error) throw result.error;
      await qc.invalidateQueries({ queryKey: ["admin"] });
      await qc.invalidateQueries({ queryKey: ["invoices"] });
      await qc.invalidateQueries({ queryKey: ["invoice"] });
      await qc.invalidateQueries({ queryKey: ["payments"] });
      toast.success(action.kind === "delete" ? "Invoice deleted" : "User updated");
      setAction(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "This change could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 bg-navy p-4 text-navy-foreground lg:flex lg:flex-col">
        <Logo dark sub="Admin Panel" />
        <nav className="mt-8 space-y-2" aria-label="Administration">
          {views.map((v) => (
            <Button
              key={v.name}
              variant="ghost"
              onClick={() => selectView(v.name)}
              className={cn(
                "w-full justify-start",
                view === v.name
                  ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
                  : "text-navy-muted hover:bg-navy-muted/10 hover:text-navy-foreground",
              )}
            >
              <v.icon />
              {v.name}
            </Button>
          ))}
        </nav>
        <Button
          asChild
          variant="ghost"
          className="mt-auto justify-start text-navy-muted hover:bg-navy-muted/10 hover:text-navy-foreground"
        >
          <Link to="/dashboard">
            <ArrowLeft />
            My workspace
          </Link>
        </Button>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b bg-card px-4 py-4 sm:px-6">
          <div className="lg:hidden">
            <Logo />
          </div>
          <span className="hidden text-sm font-semibold lg:block">Platform administration</span>
          <div className="flex items-center gap-2">
            <Avatar name={userMap.get(data.viewerId)?.full_name || "Admin"} />
            <span className="text-sm font-semibold">Admin</span>
            <Button
              variant="outline"
              size="icon"
              aria-label="Refresh admin data"
              title="Refresh admin data"
              onClick={() => qc.invalidateQueries({ queryKey: ["admin"] })}
            >
              <RefreshCw />
            </Button>
            <Button asChild variant="ghost" size="icon" className="lg:hidden" title="My workspace">
              <Link to="/dashboard" aria-label="My workspace">
                <ArrowLeft />
              </Link>
            </Button>
          </div>
        </header>
        <nav
          className="flex gap-1 overflow-x-auto border-b bg-card p-2 lg:hidden"
          aria-label="Administration"
        >
          {views.map((v) => (
            <Button
              key={v.name}
              size="sm"
              variant={view === v.name ? "default" : "ghost"}
              onClick={() => selectView(v.name)}
            >
              <v.icon />
              {v.name}
            </Button>
          ))}
        </nav>
        <main className="space-y-6 p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                Swahivo / Administration
              </p>
              <h1 className="text-2xl font-extrabold">
                {view === "Overview" ? "Platform overview" : view}
              </h1>
            </div>
            {view !== "Overview" && (
              <label className="flex w-full items-center gap-2 rounded-md border bg-card px-3 sm:w-80">
                <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                <input
                  aria-label={`Search ${view.toLowerCase()}`}
                  placeholder={`Search ${view.toLowerCase()}`}
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="h-10 min-w-0 flex-1 bg-transparent text-sm outline-none"
                />
              </label>
            )}
          </div>
          {view === "Overview" ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  { label: "Total users", value: data.users.length, icon: Users },
                  {
                    label: "Businesses",
                    value: data.users.filter((u) => u.business_name).length,
                    icon: Building2,
                  },
                  { label: "Invoices", value: data.invoices.length, icon: FileText },
                  { label: "Recorded payments", value: data.payments.length, icon: Wallet },
                ].map((s) => (
                  <div key={s.label} className="rounded-lg border bg-card p-4">
                    <div className="flex justify-between text-muted-foreground">
                      <p className="text-sm">{s.label}</p>
                      <s.icon className="h-5 w-5 text-primary" />
                    </div>
                    <p className="mt-3 text-3xl font-bold">{s.value.toLocaleString()}</p>
                  </div>
                ))}
              </div>
              <section className="grid gap-6 xl:grid-cols-[2fr_1fr]">
                <div>
                  <h2 className="mb-4 font-bold">Monthly activity</h2>
                  <div className="h-72">
                    <ResponsiveContainer>
                      <AreaChart data={growth}>
                        <CartesianGrid vertical={false} stroke="var(--border)" />
                        <XAxis dataKey="month" tickLine={false} axisLine={false} />
                        <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                        <Tooltip />
                        <Area
                          name="New users"
                          dataKey="users"
                          stroke="var(--chart-1)"
                          fill="var(--chart-1)"
                          fillOpacity={0.1}
                        />
                        <Area
                          name="Invoices"
                          dataKey="invoices"
                          stroke="var(--chart-2)"
                          fill="var(--chart-2)"
                          fillOpacity={0.1}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex gap-4 text-xs">
                    <span className="text-primary">New users</span>
                    <span className="text-success">Invoices</span>
                  </div>
                </div>
                <div className="space-y-5 border-t pt-4 xl:border-l xl:border-t-0 xl:pl-6 xl:pt-0">
                  <div>
                    <h2 className="mb-2 text-sm text-muted-foreground">Total invoiced</h2>
                    {Object.keys(invoiced).length ? totals(invoiced) : <p>—</p>}
                  </div>
                  <div>
                    <h2 className="mb-2 text-sm text-muted-foreground">
                      Customer payments recorded
                    </h2>
                    {Object.keys(collected).length ? totals(collected) : <p>—</p>}
                  </div>
                  <div>
                    <h2 className="mb-2 text-sm text-muted-foreground">
                      Outstanding finalized invoices
                    </h2>
                    {Object.keys(outstanding).length ? totals(outstanding) : <p>—</p>}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {data.users.filter((u) => u.suspended).length} suspended users ·{" "}
                    {data.users.filter((u) => u.is_admin).length} admins
                  </p>
                </div>
              </section>
              <section className="border-t pt-5">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="font-bold">Recent users</h2>
                  <Button variant="link" onClick={() => selectView("Users")}>
                    View all
                  </Button>
                </div>
                {data.users.slice(0, 5).map((u) => (
                  <div key={u.id} className="flex flex-wrap items-center gap-3 border-b py-3">
                    <Avatar name={u.full_name || u.email} />
                    <div className="min-w-0 flex-1">
                      <p className="break-words text-sm font-semibold">{u.full_name || u.email}</p>
                      <p className="break-all text-xs text-muted-foreground">
                        {u.business_name || u.email}
                      </p>
                    </div>
                    <StatusPill status={u.suspended ? "Suspended" : "Active"} />
                    <span className="text-xs text-muted-foreground">{date(u.created_at)}</span>
                  </div>
                ))}
              </section>
            </>
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg border bg-card">
                <table className="w-full min-w-[780px] text-left text-sm">
                  <thead className="bg-muted text-xs text-muted-foreground">
                    <tr>
                      {(view === "Users"
                        ? ["User", "Business", "Role", "Status", "Joined", "Actions"]
                        : view === "Businesses"
                          ? ["Business", "Owner", "Invoices", "Invoiced", "Status"]
                          : view === "Invoices"
                            ? [
                                "Invoice #",
                                "Business",
                                "Customer",
                                "Total",
                                "Balance",
                                "Status",
                                "Created",
                                "Actions",
                              ]
                            : ["Invoice #", "Business", "Amount", "Method", "Paid on"]
                      ).map((h) => (
                        <th key={h} className="whitespace-nowrap px-4 py-3">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="[&_td]:px-4 [&_td]:py-3 [&_tr]:border-b">
                    {view === "Users" &&
                      slice(users).map((u) => (
                        <tr key={u.id}>
                          <td>
                            <p className="font-semibold">{u.full_name || "—"}</p>
                            <p className="text-xs text-muted-foreground">{u.email}</p>
                          </td>
                          <td>{u.business_name || "—"}</td>
                          <td>{u.is_admin ? "Admin" : "User"}</td>
                          <td>
                            <StatusPill status={u.suspended ? "Suspended" : "Active"} />
                          </td>
                          <td className="whitespace-nowrap">{date(u.created_at)}</td>
                          <td>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                disabled={u.id === data.viewerId}
                                title={u.suspended ? "Restore user" : "Suspend user"}
                                aria-label={`${u.suspended ? "Restore" : "Suspend"} ${u.email}`}
                                onClick={() =>
                                  setAction({ kind: "suspend", user: u, value: !u.suspended })
                                }
                              >
                                {u.suspended ? <UserCheck /> : <UserX />}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                disabled={u.id === data.viewerId}
                                title={u.is_admin ? "Remove admin role" : "Make admin"}
                                aria-label={`${u.is_admin ? "Remove admin role from" : "Make admin"} ${u.email}`}
                                onClick={() =>
                                  setAction({ kind: "role", user: u, value: !u.is_admin })
                                }
                              >
                                {u.is_admin ? <ShieldOff /> : <Shield />}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    {view === "Businesses" &&
                      slice(businesses).map((u) => {
                        const owned = data.invoices.filter((i) => i.user_id === u.id);
                        return (
                          <tr key={u.id}>
                            <td className="font-semibold">{u.business_name}</td>
                            <td>
                              <p>{u.full_name || "—"}</p>
                              <p className="text-xs text-muted-foreground">{u.email}</p>
                            </td>
                            <td>{owned.length}</td>
                            <td>
                              {totals(
                                currencyTotals(
                                  owned.map((i) => ({ currency: i.currency, amount: i.total })),
                                ),
                              )}
                            </td>
                            <td>
                              <StatusPill status={u.suspended ? "Suspended" : "Active"} />
                            </td>
                          </tr>
                        );
                      })}
                    {view === "Invoices" &&
                      slice(invoices).map((i) => (
                        <tr key={i.id}>
                          <td className="font-semibold text-primary">{i.number || "Draft"}</td>
                          <td>{business(i.user_id)}</td>
                          <td>{i.customers?.name || "—"}</td>
                          <td className="whitespace-nowrap">{money(i.total, i.currency)}</td>
                          <td className="whitespace-nowrap">
                            {money(balance(i.total, i.amount_paid), i.currency)}
                          </td>
                          <td>
                            <StatusPill
                              status={displayStatus(
                                i.status,
                                i.due_date,
                                balance(i.total, i.amount_paid),
                              )}
                            />
                          </td>
                          <td className="whitespace-nowrap">{date(i.created_at)}</td>
                          <td>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive"
                              title="Delete invoice"
                              aria-label={`Delete ${i.number || "draft"}`}
                              onClick={() =>
                                setAction({ kind: "delete", id: i.id, number: i.number })
                              }
                            >
                              <Trash2 />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    {view === "Payments" &&
                      slice(payments).map((p) => (
                        <tr key={p.id}>
                          <td className="font-semibold">{p.invoices?.number || "—"}</td>
                          <td>{business(p.user_id)}</td>
                          <td>{p.invoices ? money(p.amount, p.invoices.currency) : p.amount}</td>
                          <td>{p.method}</td>
                          <td>{date(p.paid_on)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
                {count === 0 && (
                  <p className="p-6 text-sm text-muted-foreground">
                    No {view.toLowerCase()} found.
                  </p>
                )}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                <p className="text-muted-foreground">
                  {count} records · Page {page} of {Math.max(1, Math.ceil(count / 20))}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page * 20 >= count}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
      {action && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-navy/50 p-4"
          onClick={() => !busy && setAction(null)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-confirm-title"
            className="w-full max-w-md rounded-lg border bg-card p-6 shadow-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between gap-3">
              <h2 id="admin-confirm-title" className="text-lg font-bold">
                {action.kind === "delete"
                  ? "Delete invoice?"
                  : action.kind === "suspend"
                    ? action.value
                      ? "Suspend user?"
                      : "Restore user?"
                    : action.value
                      ? "Make user an admin?"
                      : "Remove admin role?"}
              </h2>
              <Button
                variant="ghost"
                size="icon"
                disabled={busy}
                aria-label="Close confirmation"
                onClick={() => setAction(null)}
              >
                <X />
              </Button>
            </div>
            <p className="mt-3 break-words text-sm text-muted-foreground">
              {action.kind === "delete"
                ? `${action.number || "This draft"} and all its payments will be permanently deleted.`
                : `${action.user.full_name || action.user.email}: ${action.kind === "suspend" ? (action.value ? "They will no longer be able to create or change business records." : "They will be able to create and change business records again.") : action.value ? "They will have access to all businesses and admin controls." : "They will lose access to platform administration."}`}
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" disabled={busy} onClick={() => setAction(null)}>
                Cancel
              </Button>
              <Button
                variant={
                  action.kind === "delete" || (action.kind === "suspend" && action.value)
                    ? "destructive"
                    : "default"
                }
                disabled={busy}
                onClick={confirmAction}
              >
                {busy ? "Saving…" : "Confirm"}
              </Button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
