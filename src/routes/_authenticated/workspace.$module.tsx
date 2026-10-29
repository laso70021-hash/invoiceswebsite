import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/swahivo/app-shell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { profileQuery, invoicesQuery } from "@/lib/data";
import { money, balance } from "@/lib/invoice-math";

const modules = [
  "products",
  "services",
  "inventory",
  "suppliers",
  "expenses",
  "payments",
  "reports",
  "recurring",
] as const;
type Module = (typeof modules)[number];
const isModule = (s: string): s is Module => modules.some((m) => m === s);
export const Route = createFileRoute("/_authenticated/workspace/$module")({
  beforeLoad: ({ params }) => {
    if (!isModule(params.module)) throw notFound();
  },
  component: Workspace,
});
type Row = {
  id: string;
  name: string;
  details: string;
  amount?: number;
  currency?: string;
  date?: string;
  stock?: number;
  unit?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  active?: boolean;
};
async function userId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("Sign in required.");
  return data.user.id;
}
async function load(module: Module): Promise<Row[]> {
  const id = await userId();
  if (["products", "services", "inventory"].includes(module)) {
    let q = supabase.from("catalog_items").select("*").eq("user_id", id).order("name");
    q = q.eq("kind", module === "services" ? "service" : "product");
    const { data, error } = await q;
    if (error) throw error;
    return data.map((r) => ({
      id: r.id,
      name: r.name,
      details: r.kind,
      amount: r.price,
      stock: r.stock,
      unit: r.unit,
    }));
  }
  if (module === "suppliers") {
    const { data, error } = await supabase
      .from("suppliers")
      .select("*")
      .eq("user_id", id)
      .order("name");
    if (error) throw error;
    return data.map((r) => ({
      ...r,
      details: [r.email, r.phone, r.address].filter(Boolean).join(" · "),
    }));
  }
  if (module === "expenses") {
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .eq("user_id", id)
      .order("spent_on", { ascending: false });
    if (error) throw error;
    return data.map((r) => ({
      id: r.id,
      name: r.category,
      details: r.description ?? "",
      amount: r.amount,
      date: r.spent_on,
    }));
  }
  if (module === "payments") {
    const { data, error } = await supabase
      .from("payments")
      .select("*, invoices(number,currency)")
      .eq("user_id", id)
      .order("paid_on", { ascending: false });
    if (error) throw error;
    return data.map((r) => ({
      id: r.id,
      name: r.invoices?.number ?? r.invoice_id,
      details: r.method,
      amount: r.amount,
      currency: r.invoices?.currency ?? "Unknown",
      date: r.paid_on,
    }));
  }
  if (module === "recurring") {
    const { data, error } = await supabase
      .from("recurring_invoices")
      .select("*, customers(name)")
      .eq("user_id", id)
      .order("next_date");
    if (error) throw error;
    return data.map((r) => ({
      id: r.id,
      name: r.customers?.name ?? r.customer_id,
      details: r.every,
      amount: r.total,
      currency: r.currency,
      date: r.next_date,
      active: r.active,
    }));
  }
  return [];
}
const field = "mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm";
function Workspace() {
  const module = Route.useParams().module as Module;
  return <WorkspaceModule key={module} module={module} />;
}
function WorkspaceModule({ module }: { module: Module }) {
  const qc = useQueryClient();
  const { data: profile } = useQuery(profileQuery);
  const {
    data: rows = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["workspace", module],
    queryFn: () => load(module),
    enabled: module !== "reports",
  });
  const {
    data: invoices = [],
    error: reportError,
    isLoading: reportLoading,
  } = useQuery({ ...invoicesQuery, enabled: module === "reports" });
  const [search, setSearch] = useState("");
  const [edit, setEdit] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("0");
  const [stock, setStock] = useState("0");
  const [details, setDetails] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [date, setDate] = useState(new Date().toLocaleDateString("en-CA"));
  const [busy, setBusy] = useState(false);
  const catalog = ["products", "services", "inventory"].includes(module);
  const editable = catalog || module === "suppliers" || module === "expenses";
  function begin(r?: Row) {
    setEdit(r?.id ?? "new");
    setName(r?.name ?? "");
    setAmount(String(r?.amount ?? 0));
    setStock(String(r?.stock ?? 0));
    setDetails(r?.details ?? "");
    setEmail(r?.email ?? "");
    setPhone(r?.phone ?? "");
    setAddress(r?.address ?? "");
    setDate(r?.date ?? new Date().toLocaleDateString("en-CA"));
  }
  const refresh = () => qc.invalidateQueries({ queryKey: ["workspace"] });
  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const value = Number(amount),
      qty = Number(stock);
    if (!Number.isFinite(value) || value < 0 || !Number.isFinite(qty) || qty < 0) {
      toast.error("Amounts and stock must be nonnegative numbers.");
      return;
    }
    setBusy(true);
    try {
      const id = await userId();
      if (catalog) {
        const payload = {
          user_id: id,
          name: name.trim(),
          price: value,
          stock: qty,
          kind: module === "services" ? "service" : "product",
        };
        const q =
          edit === "new"
            ? supabase.from("catalog_items").insert(payload)
            : supabase.from("catalog_items").update(payload).eq("user_id", id).eq("id", edit!);
        const { error } = await q.select("id").single();
        if (error) throw error;
      } else if (module === "suppliers") {
        const payload = {
          user_id: id,
          name: name.trim(),
          email: email || null,
          phone: phone || null,
          address: address || null,
        };
        const q =
          edit === "new"
            ? supabase.from("suppliers").insert(payload)
            : supabase.from("suppliers").update(payload).eq("user_id", id).eq("id", edit!);
        const { error } = await q.select("id").single();
        if (error) throw error;
      } else {
        const payload = {
          user_id: id,
          category: name.trim(),
          amount: value,
          description: details || null,
          spent_on: date,
        };
        const q =
          edit === "new"
            ? supabase.from("expenses").insert(payload)
            : supabase.from("expenses").update(payload).eq("user_id", id).eq("id", edit!);
        const { error } = await q.select("id").single();
        if (error) throw error;
      }
      await refresh();
      setEdit(null);
      toast.success("Record saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setBusy(false);
    }
  }
  async function remove(r: Row) {
    if (!window.confirm(`Delete ${r.name}?`)) return;
    setBusy(true);
    try {
      const id = await userId();
      const table = catalog ? "catalog_items" : module === "suppliers" ? "suppliers" : "expenses";
      const { error } = await supabase
        .from(table)
        .delete()
        .eq("user_id", id)
        .eq("id", r.id)
        .select("id")
        .single();
      if (error) throw error;
      await refresh();
      toast.success("Record deleted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed.");
    } finally {
      setBusy(false);
    }
  }
  async function recurring(r?: Row) {
    setBusy(true);
    try {
      if (r) {
        const id = await userId();
        const { error } = await supabase
          .from("recurring_invoices")
          .update({ active: !r.active })
          .eq("user_id", id)
          .eq("id", r.id)
          .select("id")
          .single();
        if (error) throw error;
      } else {
        const { data, error } = await supabase.rpc("run_recurring_invoices", { _only_me: true });
        if (error) throw error;
        toast.success(`${data} due invoices generated`);
      }
      await refresh();
      await qc.invalidateQueries({ queryKey: ["invoices"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Recurring billing failed.");
    } finally {
      setBusy(false);
    }
  }
  const heading =
    module === "reports"
      ? "Invoice Reports"
      : module === "recurring"
        ? "Recurring Billing"
        : module[0]!.toUpperCase() + module.slice(1);
  const report = Object.entries(
    invoices
      .filter((i) => i.status !== "draft")
      .reduce<Record<string, { sales: number; paid: number; due: number; count: number }>>(
        (acc, i) => {
          const x = acc[i.currency] ?? { sales: 0, paid: 0, due: 0, count: 0 };
          x.sales += i.total;
          x.paid += i.amount_paid;
          x.due += balance(i.total, i.amount_paid);
          x.count++;
          acc[i.currency] = x;
          return acc;
        },
        {},
      ),
  );
  return (
    <AppShell>
      <div className="flex flex-wrap justify-between gap-3">
        <h1 className="text-2xl font-extrabold">{heading}</h1>
        {editable && (
          <Button onClick={() => begin()}>
            Add {module === "suppliers" ? "supplier" : module === "expenses" ? "expense" : "item"}
          </Button>
        )}
        {module === "recurring" && (
          <Button disabled={busy} onClick={() => recurring()}>
            Generate due invoices
          </Button>
        )}
      </div>
      {module === "payments" && (
        <p className="text-sm text-muted-foreground">
          Actual recorded payments. Open an{" "}
          <Link to="/invoices" className="text-primary underline">
            invoice
          </Link>{" "}
          to record a payment and generate a receipt.
        </p>
      )}
      {module === "expenses" && (
        <p className="text-sm text-muted-foreground">
          Expense amounts are recorded in your business currency ({profile?.currency ?? "TZS"}).
          These records do not have per-expense currency.
        </p>
      )}
      {module === "recurring" && (
        <p className="text-sm text-muted-foreground">
          Manage existing schedules. Generate due invoices on demand; no background scheduler is
          configured here.
        </p>
      )}
      {edit && (
        <form onSubmit={save} className="space-y-3 rounded-xl border bg-card p-4">
          <h2 className="font-semibold">{edit === "new" ? "New record" : "Edit record"}</h2>
          <label className="block text-sm">
            {module === "expenses" ? "Category" : "Name"}
            <input
              required
              className={field}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          {(catalog || module === "expenses") && (
            <label className="block text-sm">
              {catalog ? "Unit price" : "Amount"} ({profile?.currency ?? "TZS"})
              <input
                required
                type="number"
                min="0"
                step="0.01"
                className={field}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </label>
          )}
          {catalog && module !== "services" && (
            <label className="block text-sm">
              Stock quantity
              <input
                type="number"
                min="0"
                step="any"
                className={field}
                value={stock}
                onChange={(e) => setStock(e.target.value)}
              />
            </label>
          )}
          {module === "suppliers" && (
            <>
              {(
                [
                  ["Email", email, setEmail],
                  ["Phone", phone, setPhone],
                  ["Address", address, setAddress],
                ] as const
              ).map(([label, value, set]) => (
                <label key={label} className="block text-sm">
                  {label}
                  <input
                    type={label === "Email" ? "email" : "text"}
                    className={field}
                    value={value}
                    onChange={(e) => set(e.target.value)}
                  />
                </label>
              ))}
            </>
          )}
          {module === "expenses" && (
            <>
              <label className="block text-sm">
                Date
                <input
                  required
                  type="date"
                  className={field}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </label>
              <label className="block text-sm">
                Description
                <textarea
                  className={field}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                />
              </label>
            </>
          )}
          <div className="flex gap-2">
            <Button disabled={busy}>{busy ? "Saving…" : "Save"}</Button>
            <Button type="button" variant="outline" onClick={() => setEdit(null)}>
              Cancel
            </Button>
          </div>
        </form>
      )}
      {module === "reports" ? (
        reportError ? (
          <p role="alert">{reportError.message}</p>
        ) : reportLoading ? (
          <p>Loading…</p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Issued invoices only, separated by currency. Amount paid is allocated collections, not
              accounting revenue recognition.
            </p>
            {report.length === 0 ? (
              <p>No issued invoices.</p>
            ) : (
              report.map(([currency, r]) => (
                <section key={currency} className="rounded-xl border bg-card p-5">
                  <h2 className="font-bold">
                    {currency} · {r.count} invoices
                  </h2>
                  <dl className="mt-3 grid gap-3 sm:grid-cols-3">
                    {[
                      ["Invoiced", r.sales],
                      ["Payments allocated", r.paid],
                      ["Outstanding", r.due],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <dt>{label}</dt>
                        <dd className="text-lg font-bold">{money(Number(value), currency)}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
              ))
            )}
          </>
        )
      ) : (
        <>
          <input
            aria-label={`Search ${module}`}
            placeholder={`Search ${module}…`}
            className={field}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {error ? (
            <p role="alert">Unable to load records: {error.message}</p>
          ) : isLoading ? (
            <p>Loading…</p>
          ) : (
            <div className="space-y-3">
              {rows
                .filter((r) =>
                  `${r.name} ${r.details}`.toLowerCase().includes(search.toLowerCase()),
                )
                .map((r) => (
                  <section
                    key={r.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4"
                  >
                    <div>
                      <h2 className="font-semibold">{r.name}</h2>
                      <p className="text-sm text-muted-foreground">
                        {r.details} {r.date}{" "}
                        {catalog && module !== "services" && `· Stock: ${r.stock}`}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {r.amount !== undefined && (
                        <strong>{money(r.amount, r.currency ?? profile?.currency ?? "TZS")}</strong>
                      )}
                      {editable && (
                        <>
                          <Button variant="outline" onClick={() => begin(r)}>
                            Edit
                          </Button>
                          <Button disabled={busy} variant="ghost" onClick={() => remove(r)}>
                            Delete
                          </Button>
                        </>
                      )}
                      {module === "recurring" && (
                        <Button disabled={busy} variant="outline" onClick={() => recurring(r)}>
                          {r.active ? "Pause" : "Resume"}
                        </Button>
                      )}
                    </div>
                  </section>
                ))}
              {rows.length === 0 && <p>No records yet.</p>}
            </div>
          )}
        </>
      )}
    </AppShell>
  );
}
