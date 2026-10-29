import { z } from "zod";
const role = z.enum(["viewer", "accountant"]);
export const teamOverviewSchema = z.object({
  members: z.array(
    z.object({
      id: z.string().uuid(),
      email: z.string(),
      name: z.string().nullable(),
      role,
      joined_at: z.string(),
    }),
  ),
  invites: z.array(
    z.object({ id: z.string().uuid(), email: z.string(), role, expires_at: z.string() }),
  ),
  businesses: z.array(z.object({ id: z.string().uuid(), name: z.string().nullable(), role })),
  events: z.array(z.object({ action: z.string(), created_at: z.string() })),
});
export const teamRecordsSchema = z.object({
  business_name: z.string().nullable(),
  invoices: z.array(
    z.object({
      id: z.string(),
      number: z.string().nullable(),
      issue_date: z.string(),
      currency: z.string(),
      status: z.string(),
      total: z.number(),
      amount_paid: z.number(),
    }),
  ),
  payments: z.array(
    z.object({
      id: z.string(),
      amount: z.number(),
      paid_on: z.string(),
      method: z.string(),
      currency: z.string(),
      number: z.string().nullable(),
    }),
  ),
});
export function teamInviteUrl(origin: string, token: string) {
  z.string().uuid().parse(token);
  const url = new URL("/team", origin);
  url.searchParams.set("invite", token);
  return url.href;
}
