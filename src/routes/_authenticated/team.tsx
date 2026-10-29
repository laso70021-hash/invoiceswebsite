import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { AppShell } from "@/components/swahivo/app-shell";
import { Button } from "@/components/ui/button";
import { profileQuery } from "@/lib/data";
import { supabase } from "@/integrations/supabase/client";
import { isMissingBackendFunction } from "@/lib/backend-errors";
import { teamOverviewSchema, teamRecordsSchema, teamInviteUrl } from "@/lib/team";
import { balance, money } from "@/lib/invoice-math";
export const Route = createFileRoute("/_authenticated/team")({
  validateSearch: (s: Record<string, unknown>): { invite?: string } =>
    typeof s["invite"] === "string" && z.string().uuid().safeParse(s["invite"]).success
      ? { invite: s["invite"] }
      : {},
  head: () => ({ meta: [{ title: "Team Members — Swahivo" }] }),
  component: Team,
});
function Team() {
  const { invite } = Route.useSearch();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: profile } = useQuery(profileQuery);
  const { data, isLoading, error, isFetching, refetch } = useQuery({
    queryKey: ["team"],
    retry: (count, e) => !isMissingBackendFunction(e) && count < 2,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("team_overview");
      if (error) throw error;
      return teamOverviewSchema.parse(data);
    },
  });
  const [email, setEmail] = useState(""),
    [role, setRole] = useState<"viewer" | "accountant">("viewer"),
    [busy, setBusy] = useState(false),
    [link, setLink] = useState(""),
    [business, setBusiness] = useState("");
  const [confirmation, setConfirmation] = useState<{
    action: string;
    target: string;
    label: string;
    role?: string;
  } | null>(null);
  const teamRecords = useQuery({
    queryKey: ["team-records", business],
    enabled: Boolean(business) && Boolean(data?.businesses.some((b) => b.id === business)),
    queryFn: async () => {
      const { data, error } = await supabase.rpc("team_financial_records", { _owner: business });
      if (error) throw error;
      return teamRecordsSchema.parse(data);
    },
  });
  async function mutate(action: string, target?: string, nextRole?: string) {
    setBusy(true);
    try {
      const { data: result, error } = await supabase.rpc("manage_team", {
        _action: action,
        ...(target ? { _target: target } : {}),
        ...(action === "invite" ? { _email: email.trim() } : {}),
        _role: nextRole ?? role,
      });
      if (error) throw error;
      if (action === "invite") {
        const token = z.object({ token: z.string().uuid() }).parse(result).token;
        setLink(teamInviteUrl(window.location.origin, token));
        setEmail("");
        toast.success("Invitation created. Copy the link and send it to the invited person.");
      } else {
        toast.success(action === "accept" ? "Invitation accepted" : "Team updated");
        if (action === "accept") await navigate({ to: "/team", search: {}, replace: true });
        if (action === "revoke") setLink("");
        if (action === "leave") setBusiness("");
      }
      setConfirmation(null);
      await qc.invalidateQueries({ queryKey: ["team"] });
      await qc.invalidateQueries({ queryKey: ["team-records"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Team operation failed.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <AppShell>
      <div className="flex flex-wrap justify-between gap-3">
        <h1 className="text-2xl font-extrabold">Team Members</h1>
        <Button disabled={isFetching} variant="outline" onClick={() => refetch()}>
          Refresh
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Manage access to {profile?.business_name || "your business"}. Invitations require the
        recipient to sign in with the matching verified email.
      </p>
      {invite && (
        <section className="space-y-3 rounded-xl border bg-card p-5">
          <h2 className="font-semibold">You have a team invitation</h2>
          <p className="text-sm">
            Accept only if you recognize the business that sent this link. Team roles provide
            read-only financial access; they do not grant ownership or platform administration.
          </p>
          <Button disabled={busy || Boolean(error)} onClick={() => mutate("accept", invite)}>
            Accept invitation
          </Button>
        </section>
      )}
      <section className="rounded-xl border bg-card p-5">
        <h2 className="font-semibold">Business owner</h2>
        <p className="mt-2">
          {profile?.full_name || "You"} · {profile?.email}
        </p>
        <span className="text-sm text-muted-foreground">
          Owner · Full access to your own business
        </span>
      </section>
      {isLoading ? (
        <p>Loading team…</p>
      ) : error ? (
        <section
          role="status"
          className="space-y-2 rounded-xl border border-amber-300 bg-amber-50 p-5 text-amber-950"
        >
          <h2 className="font-semibold">
            {isMissingBackendFunction(error)
              ? "Team database setup required"
              : "Unable to load team"}
          </h2>
          <p className="text-sm">
            {isMissingBackendFunction(error)
              ? "Your owner account is active. Invitations, member roles and shared business views require the team database update before they can be used."
              : error.message}
          </p>
          <p className="text-sm">
            Membership has not been checked; this is not an empty-team result.
          </p>
        </section>
      ) : null}
      <form
        className="space-y-3 rounded-xl border bg-card p-5"
        onSubmit={(e) => {
          e.preventDefault();
          setConfirmation({
            action: "invite",
            target: "",
            label: `Invite ${email.trim()} as ${role}`,
          });
        }}
      >
        <h2 className="font-semibold">Invite a team member</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            Email
            <input
              required
              type="email"
              value={email}
              disabled={!data || busy}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border bg-background p-2"
            />
          </label>
          <label className="text-sm">
            Role
            <select
              value={role}
              disabled={!data || busy}
              onChange={(e) => setRole(e.target.value as typeof role)}
              className="mt-1 w-full rounded-lg border bg-background p-2"
            >
              <option value="viewer">Viewer — invoice summaries</option>
              <option value="accountant">Accountant — invoice and payment summaries</option>
            </select>
          </label>
        </div>
        <p className="text-xs text-muted-foreground">
          Read-only access to issued invoice summaries. Accountants can additionally view payment
          amounts and methods. No customer contact details, document line items, record editing or
          admin access. Links expire in seven days. No email is sent automatically.
        </p>
        <Button disabled={!data || busy}>Create invitation</Button>
      </form>
      {link && (
        <section className="space-y-2 rounded-xl border p-4">
          <p className="text-sm">Send this link privately to the invited email:</p>
          <p className="break-all text-sm">{link}</p>
          <Button
            variant="outline"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(link);
                toast.success("Invitation link copied");
              } catch {
                toast.error("Copy the displayed link manually.");
              }
            }}
          >
            Copy invitation link
          </Button>
          {["localhost", "127.0.0.1"].includes(window.location.hostname) && (
            <p className="text-sm text-amber-700">
              This link uses a local address. Invite recipients through your deployed website
              address.
            </p>
          )}
        </section>
      )}
      {confirmation && (
        <section
          role="alertdialog"
          aria-modal="false"
          aria-label="Confirm team change"
          className="space-y-3 rounded-xl border border-primary bg-card p-5"
        >
          <h2 className="font-semibold">{confirmation.label}?</h2>
          <p className="text-sm">
            {confirmation.action === "invite" || confirmation.action === "role"
              ? "This changes access to business financial summaries. Confirm the email and role before continuing."
              : "This removes access or revokes an unused invitation. Existing copies of information already viewed cannot be recalled."}
          </p>
          <div className="flex gap-2">
            <Button
              disabled={busy}
              onClick={() =>
                mutate(confirmation.action, confirmation.target || undefined, confirmation.role)
              }
            >
              Confirm
            </Button>
            <Button variant="outline" onClick={() => setConfirmation(null)}>
              Cancel
            </Button>
          </div>
        </section>
      )}
      {data && (
        <>
          <section className="space-y-3">
            <h2 className="font-semibold">Members ({data.members.length})</h2>
            {data.members.length === 0 ? (
              <p className="text-sm text-muted-foreground">No additional members.</p>
            ) : (
              data.members.map((m) => (
                <div
                  key={m.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4"
                >
                  <div>
                    <strong>{m.name || m.email}</strong>
                    <p className="text-sm">
                      {m.email} · Joined {m.joined_at.slice(0, 10)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <select
                      aria-label={`Role for ${m.email}`}
                      value={m.role}
                      disabled={busy}
                      onChange={(e) =>
                        setConfirmation({
                          action: "role",
                          target: m.id,
                          role: e.target.value,
                          label: `Change ${m.email} to ${e.target.value}`,
                        })
                      }
                      className="rounded border p-2 text-sm"
                    >
                      <option value="viewer">Viewer</option>
                      <option value="accountant">Accountant</option>
                    </select>
                    <Button
                      variant="outline"
                      disabled={busy}
                      onClick={() =>
                        setConfirmation({
                          action: "remove",
                          target: m.id,
                          label: `Remove ${m.email}`,
                        })
                      }
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))
            )}
          </section>
          <section className="space-y-3">
            <h2 className="font-semibold">Pending invitations</h2>
            {data.invites.length === 0 ? (
              <p className="text-sm text-muted-foreground">No pending invitations.</p>
            ) : (
              data.invites.map((i) => (
                <div
                  key={i.id}
                  className="flex flex-wrap justify-between gap-3 rounded-xl border bg-card p-4"
                >
                  <div>
                    {i.email} · {i.role}
                    <p className="text-sm text-muted-foreground">
                      {new Date(i.expires_at) < new Date() ? "Expired" : "Expires"}{" "}
                      {i.expires_at.slice(0, 10)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      disabled={new Date(i.expires_at) < new Date()}
                      onClick={() => setLink(teamInviteUrl(window.location.origin, i.id))}
                    >
                      Show link
                    </Button>
                    <Button
                      variant="outline"
                      disabled={busy}
                      onClick={() =>
                        setConfirmation({
                          action: "revoke",
                          target: i.id,
                          label: `Revoke invitation for ${i.email}`,
                        })
                      }
                    >
                      Revoke
                    </Button>
                  </div>
                </div>
              ))
            )}
          </section>
          <section className="space-y-3">
            <h2 className="font-semibold">Businesses you have joined</h2>
            {data.businesses.length === 0 ? (
              <p className="text-sm text-muted-foreground">You have not joined another business.</p>
            ) : (
              data.businesses.map((b) => (
                <div
                  className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-4"
                  key={b.id}
                >
                  <span className="flex-1">
                    {b.name || "Business"} · {b.role}
                  </span>
                  <Button onClick={() => setBusiness(b.id)}>View shared records</Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      setConfirmation({
                        action: "leave",
                        target: b.id,
                        label: `Leave ${b.name || "this business"}`,
                      })
                    }
                  >
                    Leave
                  </Button>
                </div>
              ))
            )}
          </section>
          {business && data.businesses.some((b) => b.id === business) && (
            <section className="space-y-3 rounded-xl border p-5">
              <h2 className="font-semibold">
                {teamRecords.data?.business_name || "Shared business records"}
              </h2>
              {teamRecords.error ? (
                <p role="alert">{teamRecords.error.message}</p>
              ) : teamRecords.isLoading ? (
                <p>Loading shared records…</p>
              ) : (
                <>
                  <h3 className="font-medium">Issued invoices</h3>
                  {teamRecords.data?.invoices.map((i) => (
                    <p className="border-t py-2 text-sm" key={i.id}>
                      {i.number} · {i.issue_date} · {i.status} · {money(i.total, i.currency)} ·
                      Balance {money(balance(i.total, i.amount_paid), i.currency)}
                    </p>
                  ))}
                  {teamRecords.data?.invoices.length === 0 && <p>No issued invoices.</p>}
                  {teamRecords.data?.payments.length !== 0 && (
                    <>
                      <h3 className="font-medium">Payments</h3>
                      {teamRecords.data?.payments.map((p) => (
                        <p key={p.id} className="border-t py-2 text-sm">
                          {p.number} · {p.paid_on} · {p.method} · {money(p.amount, p.currency)}
                        </p>
                      ))}
                    </>
                  )}
                </>
              )}
            </section>
          )}
          <section className="space-y-2">
            <h2 className="font-semibold">Recent team activity</h2>
            {data.events.map((e, i) => (
              <p key={i} className="text-sm">
                {e.created_at.slice(0, 19).replace("T", " ")} · {e.action}
              </p>
            ))}
            {data.events.length === 0 && (
              <p className="text-sm text-muted-foreground">No team changes recorded.</p>
            )}
          </section>
        </>
      )}
    </AppShell>
  );
}
