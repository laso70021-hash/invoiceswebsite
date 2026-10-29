import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import type { LineItem } from "./invoice-math";

export type Customer = Tables<"customers">;
export type Invoice = Omit<Tables<"invoices">, "items"> & { items: LineItem[]; customers: { name: string } | null };

async function ownerId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("Sign in to view your records.");
  return data.user.id;
}

export const customersQuery = queryOptions({
  queryKey: ["customers"],
  queryFn: async () => {
    const id = await ownerId();
    const { data, error } = await supabase.from("customers").select("*").eq("user_id", id).order("name");
    if (error) throw error;
    return data;
  },
});

export const invoicesQuery = queryOptions({
  queryKey: ["invoices"],
  queryFn: async () => {
    const id = await ownerId();
    const { data, error } = await supabase.from("invoices").select("*, customers(name)").eq("user_id", id).order("created_at", { ascending: false });
    if (error) throw error;
    return data as unknown as Invoice[];
  },
});

export const invoiceQuery = (id: string) =>
  queryOptions({
    queryKey: ["invoice", id],
    queryFn: async () => {
      const userId = await ownerId();
      const { data, error } = await supabase.from("invoices").select("*, customers(*)").eq("user_id", userId).eq("id", id).single();
      if (error) throw error;
      return data as unknown as Omit<Invoice, "customers"> & { customers: Customer | null };
    },
  });

export const paymentsQuery = (invoiceId: string) =>
  queryOptions({
    queryKey: ["payments", invoiceId],
    queryFn: async () => {
      const userId = await ownerId();
      const { data, error } = await supabase.from("payments").select("*").eq("user_id", userId).eq("invoice_id", invoiceId).order("paid_on");
      if (error) throw error;
      return data;
    },
  });

export const profileQuery = queryOptions({
  queryKey: ["profile"],
  queryFn: async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return null;
    const { data, error } = await supabase.from("profiles").select("*").eq("id", u.user.id).maybeSingle();
    if (error) throw error;
    return { email: u.user.email ?? "", ...data };
  },
});
