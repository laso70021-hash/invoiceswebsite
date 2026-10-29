import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/swahivo/app-shell";
import { Avatar, Card, CardHead, tones } from "@/components/swahivo/ui";
import { customersQuery } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/customers")({
  head: () => ({ meta: [{ title: "Customers — Swahivo" }, { name: "description", content: "Manage your customers." }, { property: "og:title", content: "Customers — Swahivo" }, { property: "og:description", content: "Manage your business customer contacts." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: Customers,
});

const field = "w-full rounded-lg border bg-card px-3 py-2 text-sm outline-none focus:border-primary";

function Customers() {
  const { data = [] } = useQuery(customersQuery);
  const qc = useQueryClient();
  const [f, setF] = useState({ name: "", email: "", phone: "", address: "" });

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("customers").insert(f);
    if (error) { toast.error(error.message); return; }
    toast.success("Customer added");
    setF({ name: "", email: "", phone: "", address: "" });
    qc.invalidateQueries({ queryKey: ["customers"] });
  }

  return (
    <AppShell>
      <h1 className="text-2xl font-extrabold">Customers</h1>
      <div className="grid gap-5 lg:grid-cols-[1fr_2fr]">
        <Card>
          <CardHead title="Add Customer" />
          <form onSubmit={add} className="space-y-3">
            <input required className={field} placeholder="Name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
            <input type="email" className={field} placeholder="Email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
            <input className={field} placeholder="Phone" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
            <input className={field} placeholder="Address" value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} />
            <button className="w-full rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground">Save</button>
          </form>
        </Card>
        <Card>
          <CardHead title={`All Customers (${data.length})`} />
          <table className="w-full text-sm">
            <thead className="bg-muted text-left text-xs text-muted-foreground"><tr><th className="p-2">Name</th><th>Email</th><th>Phone</th><th>Address</th></tr></thead>
            <tbody>{data.map((c, i) => (
              <tr key={c.id} className="border-b last:border-0"><td className="p-2"><span className="flex items-center gap-2"><Avatar name={c.name} tone={tones[i % 5]} />{c.name}</span></td><td>{c.email}</td><td>{c.phone}</td><td>{c.address}</td></tr>
            ))}</tbody>
          </table>
        </Card>
      </div>
    </AppShell>
  );
}
