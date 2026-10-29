import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/swahivo/ui";

const safe = (r: unknown) => (typeof r === "string" && r.startsWith("/") && !r.startsWith("//") ? r : "/dashboard");

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { redirect?: string } => (typeof s["redirect"] === "string" ? { redirect: s["redirect"] } : {}),
  head: () => ({
    meta: [
      { title: "Sign in — Swahivo" },
      { name: "description", content: "Sign in or create your Swahivo account." },
      { property: "og:title", content: "Sign in — Swahivo" },
      { property: "og:description", content: "Access your Swahivo invoices and documents." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

const field = "w-full rounded-lg border bg-card px-3 py-2.5 text-sm outline-none focus:border-primary";

function AuthPage() {
  const navigate = useNavigate();
  const dest = safe(Route.useSearch().redirect);
  const [mode, setMode] = useState<"in" | "up">("in");
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ name: "", business: "", email: "", password: "" });

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => data.user && navigate({ to: dest }));
  }, [navigate, dest]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email: f.email, password: f.password });
      if (error) toast.error(error.message);
      else navigate({ to: dest });
    } else {
      const { error } = await supabase.auth.signUp({
        email: f.email,
        password: f.password,
        options: { emailRedirectTo: window.location.origin + "/dashboard", data: { full_name: f.name, business_name: f.business } },
      });
      if (error) toast.error(error.message);
      else toast.success("Check your email to confirm your account.");
    }
    setBusy(false);
  }

  async function google() {
    setBusy(true);
    try {
      const redirectTo = new URL("/auth", window.location.origin);
      if (dest !== "/dashboard") redirectTo.searchParams.set("redirect", dest);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: redirectTo.toString() },
      });
      if (error) {
        toast.error(error.message);
        setBusy(false);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to start Google sign-in.");
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-hero px-4">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-float">
        <Logo />
        <h1 className="mt-6 text-2xl font-extrabold">{mode === "in" ? "Welcome back" : "Create your account"}</h1>
        <p className="text-sm text-muted-foreground">{mode === "in" ? "Sign in to manage your invoices." : "Start invoicing in minutes."}</p>
        <button
          onClick={google}
          disabled={busy}
          className="mt-6 w-full rounded-lg border bg-card py-2.5 text-sm font-semibold hover:bg-muted disabled:opacity-60"
        >
          {busy ? "Connecting..." : "Continue with Google"}
        </button>
        <div className="my-4 text-center text-xs text-muted-foreground">or</div>
        <form onSubmit={submit} className="space-y-3">
          {mode === "up" && (
            <>
              <input required className={field} placeholder="Full name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
              <input className={field} placeholder="Business name" value={f.business} onChange={(e) => setF({ ...f, business: e.target.value })} />
            </>
          )}
          <input required type="email" className={field} placeholder="Email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
          <input required type="password" minLength={6} className={field} placeholder="Password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
          <button disabled={busy} className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60">
            {mode === "in" ? "Sign in" : "Create account"}
          </button>
        </form>
        <button onClick={() => setMode(mode === "in" ? "up" : "in")} className="mt-4 w-full text-center text-sm text-primary">
          {mode === "in" ? "No account? Sign up free" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
