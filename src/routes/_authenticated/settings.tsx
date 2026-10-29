import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/swahivo/app-shell";
import { DocumentPreview } from "@/components/swahivo/document-preview";
import { Button } from "@/components/ui/button";
import { profileQuery } from "@/lib/data";
import { customizationSchema, parseCustomization, whatsappUrl } from "@/lib/branding";
import { documentStyles } from "@/lib/document-design";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/settings")({ component: Settings });
const field = "mt-1 w-full rounded-lg border bg-card px-3 py-2 text-sm";
type Form = {
  business_name: string;
  address: string;
  email: string;
  phone: string;
  tax_id: string;
  currency: string;
  payment_instructions: string;
  template_style: string;
  brand_color: string;
  whatsapp_number: string;
  logo_url: string;
};
function Settings() {
  const { data: profile, isLoading, error } = useQuery(profileQuery);
  const qc = useQueryClient();
  const brandingReady = Boolean(profile && Object.hasOwn(profile, "document_customization"));
  const [form, setForm] = useState<Form | null>(null);
  const [code, setCode] = useState("{}");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dirty, setDirty] = useState(false);
  useEffect(() => {
    if (profile && !form) {
      setForm({
        business_name: profile.business_name ?? "",
        address: profile.address ?? "",
        email: profile.email ?? "",
        phone: profile.phone ?? "",
        tax_id: profile.tax_id ?? "",
        currency: profile.currency ?? "TZS",
        payment_instructions: profile.payment_instructions ?? "",
        template_style: profile.template_style ?? "classic",
        brand_color: profile.brand_color ?? "#1260F5",
        whatsapp_number: profile.whatsapp_number ?? "",
        logo_url: profile.logo_url ?? "",
      });
      setCode(JSON.stringify(parseCustomization(profile.document_customization), null, 2));
    }
  }, [profile, form]);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  let customization = parseCustomization({});
  let codeError = "";
  try {
    customization = customizationSchema.parse(JSON.parse(code));
  } catch (e) {
    codeError = e instanceof Error ? e.message : "Invalid JSON";
  }
  function update(key: keyof Form, value: string) {
    setForm((f) => (f ? { ...f, [key]: value } : f));
    setDirty(true);
  }
  function updateDesign(key: string, value: string) {
    setCode(JSON.stringify({ ...customization, [key]: value }, null, 2));
    setDirty(true);
  }
  async function upload(file?: File) {
    if (!file || !profile?.id) return;
    if (!["image/png", "image/jpeg"].includes(file.type) || file.size > 2 * 1024 * 1024) {
      toast.error("Choose a PNG or JPEG logo under 2 MB.");
      return;
    }
    setUploading(true);
    const path = `${profile.id}/${crypto.randomUUID()}.${file.type === "image/png" ? "png" : "jpg"}`;
    try {
      const { error } = await supabase.storage
        .from("business-logos")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from("business-logos").getPublicUrl(path);
      const { error: saveError } = await supabase
        .from("profiles")
        .update({ logo_url: data.publicUrl })
        .eq("id", profile.id)
        .select("id")
        .single();
      if (saveError) {
        await supabase.storage.from("business-logos").remove([path]);
        throw saveError;
      }
      update("logo_url", data.publicUrl);
      await qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Logo uploaded and saved");
    } catch (e) {
      toast.error(
        `Logo upload failed: ${e instanceof Error ? e.message : "Check storage configuration."}`,
      );
    } finally {
      setUploading(false);
    }
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form || !profile?.id || codeError) return;
    if (!form.business_name.trim()) {
      toast.error("Enter a business name.");
      return;
    }
    try {
      if (form.whatsapp_number) whatsappUrl(form.whatsapp_number, "");
      if (!/^[A-Z]{3}$/.test(form.currency)) throw new Error("Use a three-letter currency code.");
      setBusy(true);
      const { error } = await supabase
        .from("profiles")
        .update(
          brandingReady
            ? {
                ...form,
                brand_color: customization.accent ?? form.brand_color,
                document_customization: customization,
              }
            : {
                business_name: form.business_name,
                address: form.address,
                email: form.email,
                phone: form.phone,
                tax_id: form.tax_id,
                currency: form.currency,
                payment_instructions: form.payment_instructions,
                template_style: form.template_style,
                brand_color: customization.accent ?? form.brand_color,
              },
        )
        .eq("id", profile.id)
        .select("id")
        .single();
      if (error) throw error;
      setDirty(false);
      await qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success(
        brandingReady
          ? "Business settings saved"
          : "Business identity and accent colour saved. Advanced design changes remain preview-only until backend setup is complete.",
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save settings.");
    } finally {
      setBusy(false);
    }
  }
  if (isLoading)
    return (
      <AppShell>
        <p>Loading settings…</p>
      </AppShell>
    );
  if (error || !form)
    return (
      <AppShell>
        <p role="alert">Could not load your business settings. {error?.message}</p>
      </AppShell>
    );
  return (
    <AppShell>
      <h1 className="text-2xl font-extrabold">Business Settings</h1>
      {!brandingReady && (
        <p
          role="status"
          className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"
        >
          Business identity, template and accent colour can be saved now. Logo upload, WhatsApp
          contact and advanced design persistence need the pending backend update. Advanced controls
          currently preview changes only.
        </p>
      )}
      <div className="grid items-start gap-6 xl:grid-cols-2">
        <form className="space-y-5 rounded-xl border bg-card p-5" onSubmit={save}>
          <h2 className="font-semibold">Business identity</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                "business_name",
                "address",
                "email",
                "phone",
                "tax_id",
                "currency",
                "whatsapp_number",
              ] as const
            ).map((key) => (
              <label key={key} className="text-sm capitalize">
                {key.replaceAll("_", " ")}
                <input
                  required={key === "business_name"}
                  type={key === "email" ? "email" : "text"}
                  className={field}
                  value={form[key]}
                  onChange={(e) => update(key, e.target.value)}
                />
              </label>
            ))}
          </div>
          <label className="block text-sm">
            Payment instructions
            <textarea
              className={field}
              value={form.payment_instructions}
              onChange={(e) => update("payment_instructions", e.target.value)}
            />
          </label>
          <label className="block text-sm">
            Upload business logo
            <input
              type="file"
              accept="image/png,image/jpeg"
              disabled={uploading || !brandingReady}
              className={field}
              onChange={(e) => upload(e.target.files?.[0])}
            />
            <span className="text-xs text-muted-foreground">
              PNG/JPEG, up to 2 MB. Logos are public branding assets. {uploading && "Uploading…"}
            </span>
          </label>
          {form.logo_url && (
            <Button type="button" variant="outline" onClick={() => update("logo_url", "")}>
              Remove logo from documents
            </Button>
          )}
          <h2 className="font-semibold">Visual document editor</h2>
          <label className="block text-sm">
            Template
            <select
              className={field}
              value={form.template_style}
              onChange={(e) => update("template_style", e.target.value)}
            >
              {Object.entries(documentStyles).map(([id, s]) => (
                <option key={id} value={id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            {(["accent", "header"] as const).map((key) => (
              <label key={key} className="text-sm capitalize">
                {key} colour
                <div className="mt-1 flex gap-2">
                  <input
                    aria-label={`${key} colour picker`}
                    type="color"
                    value={customization[key] ?? (key === "accent" ? form.brand_color : "#071B49")}
                    onChange={(e) => updateDesign(key, e.target.value)}
                  />
                  <HexColor
                    label={`${key} hex code`}
                    value={customization[key] ?? (key === "accent" ? form.brand_color : "#071B49")}
                    onChange={(value) => updateDesign(key, value)}
                  />
                </div>
              </label>
            ))}
          </div>
          <label className="block text-sm">
            Footer text
            <input
              className={field}
              value={customization.footer ?? "Thank you for your business."}
              onChange={(e) => updateDesign("footer", e.target.value)}
            />
          </label>
          <label className="block text-sm">
            Font
            <select
              className={field}
              value={customization.font}
              onChange={(e) => updateDesign("font", e.target.value)}
            >
              <option value="sans">Sans serif</option>
              <option value="serif">Serif</option>
              <option value="mono">Monospace</option>
            </select>
          </label>
          <label className="block text-sm">
            Spacing
            <select
              className={field}
              value={customization.density}
              onChange={(e) => updateDesign("density", e.target.value)}
            >
              <option value="comfortable">Comfortable</option>
              <option value="compact">Compact</option>
            </select>
          </label>
          <details>
            <summary className="cursor-pointer text-sm font-semibold">
              Advanced: simple JSON editor
            </summary>
            <p className="my-2 text-xs text-muted-foreground">
              Allowed keys: accent, header, heading, footer, font, density. Text and layout settings
              only; no executable JavaScript.
            </p>
            <textarea
              aria-label="Document customization JSON"
              rows={12}
              spellCheck={false}
              className={`${field} font-mono`}
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setDirty(true);
              }}
            />
            {codeError && (
              <p role="alert" className="text-sm text-destructive">
                {codeError}
              </p>
            )}
          </details>
          <Button disabled={busy || uploading || Boolean(codeError)}>
            {busy ? "Saving…" : brandingReady ? "Save business settings" : "Save business identity"}
          </Button>
          {dirty && <span className="ml-3 text-xs">Unsaved changes</span>}
        </form>
        <div className="xl:sticky xl:top-24">
          <p className="mb-2 text-sm text-muted-foreground">Live preview — sample data</p>
          <DocumentPreview
            document={{
              title: "Invoice",
              number: "SAMPLE-001",
              issueDate: new Date().toLocaleDateString("en-CA"),
              party: "Sample customer",
              business: { ...form, document_customization: customization },
              currency: form.currency,
              items: [{ description: "Professional services", qty: 2, price: 50000, discount: 0 }],
              subtotal: 100000,
              taxRate: 0,
              tax: 0,
              total: 100000,
            }}
          />
        </div>
      </div>
    </AppShell>
  );
}

function HexColor({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  const valid = /^#[0-9a-f]{6}$/i.test(draft);
  return (
    <div className="min-w-0 flex-1">
      <input
        aria-label={label}
        aria-invalid={!valid}
        className={field}
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value);
          if (/^#[0-9a-f]{6}$/i.test(e.target.value)) onChange(e.target.value);
        }}
        onBlur={() => {
          if (!valid) setDraft(value);
        }}
      />
      {!valid && <p className="text-xs text-destructive">Use # followed by six hex digits.</p>}
    </div>
  );
}
