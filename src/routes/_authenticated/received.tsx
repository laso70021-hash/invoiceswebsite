import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { AppShell } from "@/components/swahivo/app-shell";
import { supabase } from "@/integrations/supabase/client";
import { money } from "@/lib/invoice-math";
import { isMissingBackendFunction } from "@/lib/backend-errors";
import { Button } from "@/components/ui/button";
export const Route = createFileRoute("/_authenticated/received")({ component: Received });
const schema = z.array(
  z.object({
    token: z.string(),
    number: z.string().nullable(),
    business_name: z.string().nullable(),
    total: z.number(),
    currency: z.string(),
    issue_date: z.string(),
  }),
);
function Received() {
  const {
    data = [],
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["received-invoices"],
    retry: (count, error) => !isMissingBackendFunction(error) && count < 2,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("received_invoices");
      if (error) throw error;
      return schema.parse(data);
    },
  });
  return (
    <AppShell>
      <h1 className="text-2xl font-extrabold">Received Invoices</h1>
      <p className="text-sm text-muted-foreground">
        Bills sent to your verified account email by another business.
      </p>
      {isMissingBackendFunction(error) ? (
        <section role="status" className="space-y-3 rounded-xl border bg-card p-5">
          <h2 className="font-semibold">Invoice inbox isn’t activated yet</h2>
          <p className="text-sm text-muted-foreground">
            The website is ready, but invoice sharing still needs to be enabled on the backend. Ask
            the platform owner to complete setup, then check again.
          </p>
          <p className="text-sm text-muted-foreground">
            We couldn’t check your received invoices. This does not mean your inbox is empty.
          </p>
          <Button variant="outline" disabled={isFetching} onClick={() => refetch()}>
            {isFetching ? "Checking…" : "Check again"}
          </Button>
        </section>
      ) : error ? (
        <p role="alert">Unable to load received invoices: {error.message}</p>
      ) : isLoading ? (
        <p>Loading…</p>
      ) : data.length === 0 ? (
        <p>No invoices received.</p>
      ) : (
        <div className="space-y-3">
          {data.map((d) => (
            <Link
              key={d.token}
              to="/bill/$token"
              params={{ token: d.token }}
              className="flex flex-wrap justify-between gap-3 rounded-xl border bg-card p-4"
            >
              <span>
                {d.business_name} · {d.number} · {d.issue_date}
              </span>
              <strong>{money(d.total, d.currency)}</strong>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}
