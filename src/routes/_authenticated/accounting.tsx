import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/swahivo/app-shell";
import { Button } from "@/components/ui/button";
import { accountingQuery } from "@/lib/accounting-data";
import { minorMoney, trialBalance, accounts } from "@/lib/accounting";
export const Route = createFileRoute("/_authenticated/accounting")({
  head: () => ({ meta: [{ title: "Accounting — Swahivo" }] }),
  component: Accounting,
});
function Accounting() {
  const { data, error, isLoading, refetch, isFetching } = useQuery(accountingQuery);
  const [view, setView] = useState<"ledger" | "trial">("ledger"),
    [currency, setCurrency] = useState(""),
    [from, setFrom] = useState(""),
    [to, setTo] = useState(""),
    [account, setAccount] = useState("");
  const entries = data?.entries ?? [],
    currencies = [...new Set(entries.map((e) => e.currency))];
  const selected = currency || currencies[0] || data?.expenseCurrency || "TZS";
  const filtered = entries.filter(
    (e) => e.currency === selected && (!from || e.date >= from) && (!to || e.date <= to),
  );
  const rows = filtered.filter((e) => !account || e.account === account),
    trial = trialBalance(filtered);
  const debit = (view === "trial" ? trial : filtered).reduce((sum, e) => sum + e.debit, 0n),
    credit = (view === "trial" ? trial : filtered).reduce((sum, e) => sum + e.credit, 0n);
  function exportCsv() {
    const csv = [
      ["Date", "Reference", "Description", "Account", "Currency", "Debit", "Credit"],
      ...rows.map((e) => [
        e.date,
        e.reference,
        e.description,
        e.account,
        e.currency,
        `${e.debit / 100n}.${String(e.debit % 100n).padStart(2, "0")}`,
        `${e.credit / 100n}.${String(e.credit % 100n).padStart(2, "0")}`,
      ]),
    ]
      .map((row) =>
        row
          .map(
            (v) =>
              `"${String(v)
                .replace(/^[=+@-]/, (prefix) => "'" + prefix)
                .replaceAll('"', '""')}"`,
          )
          .join(","),
      )
      .join("\r\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `Swahivo-ledger-${selected}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <AppShell>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold">Accounting</h1>
        <div className="flex gap-2">
          <Button variant="outline" disabled={isFetching} onClick={() => refetch()}>
            Refresh
          </Button>
          <Button disabled={!data || Boolean(error) || rows.length === 0} onClick={exportCsv}>
            Export ledger CSV
          </Button>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        Source ledger and trial balance reconstructed from issued invoices, recorded payments and
        expenses. Drafts are excluded. No additional transactions are posted.
      </p>
      {error ? (
        <p role="alert" className="rounded-xl border p-5">
          Could not load complete accounting records: {error.message}
        </p>
      ) : isLoading ? (
        <p>Loading accounting records…</p>
      ) : (
        <>
          <div className="flex flex-wrap gap-3">
            {[
              [
                "Currency",
                <select
                  key="currency"
                  value={selected}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="rounded border p-2"
                >
                  {(currencies.length ? currencies : [selected]).map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>,
              ],
              [
                "From",
                <input
                  key="from"
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="rounded border p-2"
                />,
              ],
              [
                "To",
                <input
                  key="to"
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="rounded border p-2"
                />,
              ],
            ].map(([label, control]) => (
              <label key={String(label)} className="flex items-center gap-2 text-sm">
                {label}
                {control}
              </label>
            ))}
          </div>
          {from && to && from > to && (
            <p role="alert" className="text-destructive">
              From date must not be after To date.
            </p>
          )}
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ["Debits", debit],
              ["Credits", credit],
              ["Difference", debit - credit],
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-xl border bg-card p-4">
                <p className="text-sm text-muted-foreground">{String(label)}</p>
                <strong>{minorMoney(value as bigint, selected)}</strong>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Expense amounts use the current business currency ({data?.expenseCurrency}); older
            expense rows have no currency snapshot. Expense taxes are not reclassified. This ledger
            does not include opening balances, refunds or manual journals.
          </p>
          {filtered.some((e) => e.account === accounts.suspense) && (
            <p role="alert" className="rounded border border-amber-400 p-3">
              Some stored invoice totals do not match subtotal plus tax. Differences appear in the
              unclassified account; review the linked source invoices.
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={view === "ledger" ? "default" : "outline"}
              onClick={() => setView("ledger")}
            >
              General ledger
            </Button>
            <Button
              variant={view === "trial" ? "default" : "outline"}
              onClick={() => setView("trial")}
            >
              Trial balance
            </Button>
            {view === "ledger" && (
              <select
                aria-label="Filter account"
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                className="rounded border p-2 text-sm"
              >
                <option value="">All accounts</option>
                {Object.values(accounts).map((a) => (
                  <option key={a}>{a}</option>
                ))}
              </select>
            )}
          </div>
          <div className="overflow-x-auto rounded-xl border bg-card">
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead className="bg-muted">
                <tr>
                  {(view === "ledger"
                    ? ["Date", "Reference", "Account", "Description", "Debit", "Credit"]
                    : ["Account", "Debit", "Credit"]
                  ).map((h) => (
                    <th key={h} className="p-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {view === "ledger"
                  ? rows.map((e) => (
                      <tr key={e.id} className="border-t">
                        <td className="p-3">{e.date}</td>
                        <td className="p-3">
                          {e.source !== "expense" ? (
                            <Link
                              to="/invoices/$id"
                              params={{ id: e.sourceId }}
                              className="text-primary underline"
                            >
                              {e.reference}
                            </Link>
                          ) : (
                            <Link
                              to="/workspace/$module"
                              params={{ module: "expenses" }}
                              className="text-primary underline"
                            >
                              {e.reference}
                            </Link>
                          )}
                        </td>
                        <td className="p-3">{e.account}</td>
                        <td className="p-3">{e.description}</td>
                        <td className="p-3 whitespace-nowrap">{minorMoney(e.debit, selected)}</td>
                        <td className="p-3 whitespace-nowrap">{minorMoney(e.credit, selected)}</td>
                      </tr>
                    ))
                  : trial.map((r) => (
                      <tr key={r.account} className="border-t">
                        <td className="p-3">{r.account}</td>
                        <td className="p-3">{minorMoney(r.debit, selected)}</td>
                        <td className="p-3">{minorMoney(r.credit, selected)}</td>
                      </tr>
                    ))}
              </tbody>
            </table>
            {(view === "ledger" ? rows : trial).length === 0 && (
              <p className="p-5 text-sm">No accounting entries for these filters.</p>
            )}
          </div>
        </>
      )}
    </AppShell>
  );
}
