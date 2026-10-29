import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { whatsappUrl } from "@/lib/branding";

export function InvoiceSharing({
  id,
  number,
  customerEmail,
}: {
  id: string;
  number: string;
  customerEmail: string;
}) {
  const [email, setEmail] = useState(customerEmail);
  const [publicLink, setPublicLink] = useState(false);
  const [recipientPhone, setRecipientPhone] = useState("");
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  let whatsapp = "";
  try {
    if (url && recipientPhone) whatsapp = whatsappUrl(recipientPhone, `Invoice ${number}: ${url}`);
  } catch {
    /* Show validation on the input below. */
  }
  async function share(e: React.FormEvent) {
    e.preventDefault();
    if (!publicLink && !email.trim()) {
      toast.error("Enter a business account email or enable the public link.");
      return;
    }
    setBusy(true);
    try {
      const { data, error } = await supabase.rpc("create_invoice_share", {
        _invoice: id,
        _recipient_email: email.trim(),
        _public: publicLink,
      });
      if (error) throw error;
      if (!data) throw new Error("The backend did not create a share link.");
      setUrl(`${window.location.origin}/bill/${data}`);
      toast.success("Sharing settings saved. Previous links have been replaced.");
    } catch (e) {
      toast.error(
        `Could not share invoice: ${e instanceof Error ? e.message : "Backend configuration required."}`,
      );
    } finally {
      setBusy(false);
    }
  }
  async function revoke() {
    setBusy(true);
    try {
      const { error } = await supabase.rpc("revoke_invoice_share", { _invoice: id });
      if (error) throw error;
      setUrl("");
      toast.success("Invoice sharing revoked");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not revoke sharing.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="space-y-3 rounded-xl border bg-card p-5">
      <h2 className="font-semibold">Send invoice</h2>
      <form onSubmit={share} className="space-y-3">
        <label className="block text-sm">
          Recipient business account email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border bg-background p-2"
          />
        </label>
        <p className="text-xs text-muted-foreground">
          A matching verified account receives this bill in its Received Invoices page. A business
          account can also use the public link.
        </p>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={publicLink}
            onChange={(e) => setPublicLink(e.target.checked)}
          />
          Allow anyone with the link to view without signing in
        </label>
        <p className="text-xs text-muted-foreground">
          Public links reveal this invoice, customer details and your business contact information
          to anyone who receives or forwards the link.
        </p>
        <div className="flex gap-2">
          <Button disabled={busy}>{busy ? "Saving…" : "Create / replace sharing link"}</Button>
          <Button type="button" disabled={busy} variant="outline" onClick={revoke}>
            Revoke sharing
          </Button>
        </div>
      </form>
      {url && (
        <div className="space-y-3 border-t pt-3">
          <a
            className="block break-all text-sm text-primary underline"
            href={url}
            target="_blank"
            rel="noreferrer"
          >
            {url}
          </a>
          <Button
            variant="outline"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(url);
                toast.success("Link copied");
              } catch {
                toast.error("Copy the link displayed above.");
              }
            }}
          >
            Copy link
          </Button>
          {["localhost", "127.0.0.1"].includes(window.location.hostname) && (
            <p className="text-sm text-amber-700">
              This local address works on this computer. Use a deployed website address when sharing
              with customers.
            </p>
          )}
          <label className="block text-sm">
            Recipient WhatsApp number (with country code)
            <input
              type="tel"
              value={recipientPhone}
              onChange={(e) => setRecipientPhone(e.target.value)}
              placeholder="+255712345678"
              className="mt-1 w-full rounded-lg border bg-background p-2"
            />
          </label>
          {recipientPhone && !whatsapp && (
            <p className="text-sm text-destructive">Enter a valid number with country code.</p>
          )}
          {whatsapp && (
            <Button asChild variant="outline">
              <a href={whatsapp} target="_blank" rel="noreferrer">
                Share via WhatsApp
              </a>
            </Button>
          )}
        </div>
      )}
    </section>
  );
}
