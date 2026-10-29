import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight, Check, ChevronDown, ChevronLeft, ChevronRight, CirclePlay, FileText, Search, Sparkles,
  LayoutDashboard, Receipt, ShoppingCart, Truck, Users, Package, Wallet, BarChart3, Settings, Calendar,
} from "lucide-react";
import { Logo, toneBg, type Tone } from "@/components/swahivo/ui";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Swahivo — Create Invoices & Business Documents in Minutes" },
      { name: "description", content: "Invoices, proforma, tax invoices, quotations, receipts and 96 business documents in one platform." },
      { property: "og:title", content: "Swahivo — Invoicing & Business Documents" },
      { property: "og:description", content: "Create professional invoices, quotations and business documents in minutes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const tools: { t: string; d: string; tone: Tone }[] = [
  { t: "Invoice Generator", d: "Create professional invoices for your business.", tone: "primary" },
  { t: "Proforma Invoice", d: "Prepare preliminary invoices before final billing.", tone: "success" },
  { t: "Tax Invoice", d: "Generate tax-compliant invoices with VAT details.", tone: "violet" },
  { t: "Quotation Generator", d: "Create detailed quotations and price estimates.", tone: "warning" },
  { t: "Receipt Generator", d: "Generate payment receipts for your customers.", tone: "pink" },
  { t: "Purchase Order", d: "Create purchase orders for your suppliers.", tone: "primary" },
];
const cats = ["All", "Invoices", "Quotations", "Receipts", "Purchase", "Delivery", "Accounting", "Business"];
const templates = ["Classic", "Modern", "Minimal", "Corporate", "Creative", "Proforma"];
const items = [
  { n: "Website Development", q: 1, p: "2,000,000" },
  { n: "Hosting (1 Year)", q: 1, p: "300,000" },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Logo />
        <nav className="hidden items-center gap-8 text-sm font-medium lg:flex">
          {["Products", "Templates", "Features"].map((n) => (
            <span key={n} className="flex items-center gap-1">{n}<ChevronDown className="h-3.5 w-3.5" /></span>
          ))}
          <span>Pricing</span>
          <span className="flex items-center gap-1">Resources<ChevronDown className="h-3.5 w-3.5" /></span>
        </nav>
        <div className="flex items-center gap-3">
          <Search className="hidden h-5 w-5 sm:block" />
          <Link to="/auth" className="rounded-lg border bg-card px-4 py-2 text-sm font-semibold">Sign in</Link>
          <Link to="/dashboard" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Get started free</Link>
        </div>
      </header>

      <section className="bg-hero">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 pb-10 pt-6 lg:grid-cols-[1fr_1.35fr]">
          <div className="pt-4">
            <span className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
              <Sparkles className="h-3.5 w-3.5" /> All-in-one invoicing & business documents platform
            </span>
            <h1 className="mt-6 text-4xl font-extrabold leading-[1.08] tracking-tight md:text-5xl">
              Create Professional Invoices, Quotations & Business Documents{" "}
              <span className="text-primary">in Minutes</span>
            </h1>
            <p className="mt-5 text-lg text-muted-foreground">
              Manage invoices, proforma invoices, tax invoices, quotations, receipts, customers, payments and your business finances from one powerful platform.
            </p>
            <div className="mt-7 flex flex-wrap gap-4">
              <Link to="/dashboard" className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3.5 font-semibold text-primary-foreground">
                Create your first invoice <ArrowRight className="h-4 w-4" />
              </Link>
              <button className="inline-flex items-center gap-2 rounded-xl border bg-card px-6 py-3.5 font-semibold">
                <CirclePlay className="h-5 w-5 text-primary" /> Watch demo
              </button>
            </div>
            <div className="mt-6 flex flex-wrap gap-5 text-sm text-muted-foreground">
              {["No credit card required", "Set up in minutes", "Cancel anytime"].map((t) => (
                <span key={t} className="flex items-center gap-2">
                  <span className="grid h-4 w-4 place-items-center rounded bg-primary text-primary-foreground"><Check className="h-3 w-3" /></span>{t}
                </span>
              ))}
            </div>
          </div>
          <HeroMock />
        </div>
      </section>

      <section className="border-y bg-card">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-6 px-6 py-6">
          <div>
            <p className="text-xs text-muted-foreground">Trusted by businesses worldwide</p>
            <div className="mt-2 flex flex-wrap gap-8 text-lg font-bold text-muted-foreground">
              {["Acme", "Orbit", "Lumen", "Capsule", "Command", "Layers"].map((b) => <span key={b}>{b}</span>)}
            </div>
          </div>
          <div className="flex divide-x">
            {[["96+", "Document Types"], ["6+", "Countries"], ["10K+", "Businesses"], ["99.9%", "Uptime"]].map(([v, l]) => (
              <div key={l} className="px-8 text-center">
                <p className="text-2xl font-extrabold">{v}</p>
                <p className="text-xs text-muted-foreground">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold">Explore our document tools</h2>
            <p className="text-muted-foreground">Create, customize and manage all your business documents in one place.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm text-muted-foreground">
              <Search className="h-4 w-4" /> Search documents...
            </div>
            {cats.map((c, i) => (
              <span key={c} className={cn("rounded-lg border px-3 py-2 text-sm", i === 0 ? "bg-primary text-primary-foreground" : "bg-card")}>{c}</span>
            ))}
          </div>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          {tools.map((t) => (
            <div key={t.t} className="rounded-2xl border bg-card p-5 shadow-card">
              <span className={cn("grid h-9 w-9 place-items-center rounded-lg", toneBg[t.tone])}><FileText className="h-4 w-4" /></span>
              <h3 className="mt-4 font-bold">{t.t}</h3>
              <div className="mt-1 flex items-end justify-between gap-2">
                <p className="text-sm text-muted-foreground">{t.d}</p>
                <ArrowRight className="h-4 w-4 shrink-0 text-primary" />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-band">
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-6 py-10 lg:grid-cols-[1fr_2.6fr]">
          <div>
            <p className="text-xs font-bold tracking-widest text-primary">PROFESSIONAL TEMPLATES</p>
            <h2 className="mt-2 text-3xl font-extrabold">Beautiful templates for every business</h2>
            <p className="mt-2 text-muted-foreground">Choose from our collection of professionally designed templates and customize them with your branding.</p>
            <Link to="/templates" className="mt-5 inline-flex items-center gap-2 rounded-lg border bg-card px-4 py-2.5 text-sm font-semibold text-primary">
              View all templates <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <ChevronLeft className="h-8 w-8 shrink-0 rounded-full bg-card p-1.5 shadow-card" />
            <div className="grid flex-1 grid-cols-3 gap-3 md:grid-cols-6">
              {templates.map((t, i) => (
                <div key={t} className={cn("rounded-xl border bg-card p-2 text-center shadow-card", i === 0 && "border-2 border-primary")}>
                  <div className="aspect-[3/4] rounded-md bg-muted p-2">
                    <div className={cn("h-3 rounded-sm", i % 2 ? "bg-navy" : "bg-primary/30")} />
                    {Array.from({ length: 6 }).map((_, k) => <div key={k} className="mt-1.5 h-1.5 rounded-sm bg-border" />)}
                  </div>
                  <p className="mt-2 text-xs font-semibold">{t}</p>
                </div>
              ))}
            </div>
            <ChevronRight className="h-8 w-8 shrink-0 rounded-full bg-card p-1.5 shadow-card" />
          </div>
        </div>
      </section>
      <footer className="py-6 text-center text-sm text-muted-foreground">© 2026 Swahivo. All rights reserved.</footer>
    </div>
  );
}

function HeroMock() {
  const nav = [
    [LayoutDashboard, "Dashboard"], [FileText, "Invoices"], [FileText, "Quotations"], [FileText, "Proforma Invoices"],
    [Receipt, "Receipts"], [ShoppingCart, "Purchase Orders"], [Truck, "Delivery Notes"], [Users, "Customers"],
    [Users, "Suppliers"], [Package, "Products & Services"], [Wallet, "Expenses"], [BarChart3, "Reports"], [Settings, "Settings"],
  ] as const;
  return (
    <div className="hidden overflow-hidden rounded-2xl border bg-card text-[10px] shadow-float lg:grid lg:grid-cols-[120px_1fr_1fr]">
      <div className="border-r p-3">
        <p className="mb-3 text-xs font-extrabold">Swahivo</p>
        {nav.map(([I, l], i) => (
          <div key={l} className={cn("mb-1 flex items-center gap-2 rounded-md px-2 py-1.5", i === 1 && "bg-accent text-accent-foreground")}>
            <I className="h-3 w-3" />{l}
          </div>
        ))}
      </div>
      <div className="border-r p-3">
        <p className="text-sm font-bold">Create Invoice</p>
        <div className="mt-2 flex gap-3 text-muted-foreground">
          {["Details", "Items", "Design", "Preview"].map((s, i) => (
            <span key={s} className={cn("flex items-center gap-1", i === 0 && "text-primary")}>
              <span className={cn("grid h-4 w-4 place-items-center rounded-full border", i === 0 && "bg-primary text-primary-foreground")}>{i + 1}</span>{s}
            </span>
          ))}
        </div>
        <p className="mt-3 font-semibold">Customer Information</p>
        {["Aisha Construction Ltd", "info@aishaconstruction.co.tz", "Kiembe Samaki, Zanzibar"].map((v) => (
          <div key={v} className="mt-1.5 rounded border px-2 py-1.5">{v}</div>
        ))}
        <div className="mt-2 grid grid-cols-2 gap-2">
          {([["Invoice #", "INV-2026-0001"], ["Currency", "TZS"], ["Issue", "Oct 14, 2026"], ["Due", "Nov 13, 2026"]] as const).map(([l, v]) => (
            <div key={l}><p className="text-muted-foreground">{l}</p><div className="mt-0.5 flex justify-between rounded border px-2 py-1.5">{v}{l.length < 6 && <Calendar className="h-3 w-3" />}</div></div>
          ))}
        </div>
        <p className="mt-3 font-semibold">Items</p>
        <div className="mt-1 rounded border">
          {items.map((it) => (
            <div key={it.n} className="flex justify-between border-b px-2 py-1.5 last:border-0"><span>{it.n}</span><span>{it.p}</span></div>
          ))}
        </div>
        <div className="mt-2 flex justify-between rounded bg-accent px-2 py-1.5 font-bold"><span>Total</span><span className="text-primary">TZS 2,714,000</span></div>
      </div>
      <div className="bg-muted p-3">
        <div className="flex justify-between">
          <span className="font-semibold text-primary">Preview</span>
          <span className="rounded bg-primary px-2 py-1 text-primary-foreground">Download PDF</span>
        </div>
        <div className="mt-2 rounded-lg bg-card p-3 shadow-card">
          <div className="flex justify-between">
            <span className="text-sm font-extrabold">Swahivo</span>
            <span className="text-right"><b className="text-sm">INVOICE</b><br />INV-2026-0001</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-muted-foreground">
            <p><b className="text-foreground">From</b><br />Your Business Name<br />Zanzibar, Tanzania</p>
            <p><b className="text-foreground">Bill To</b><br />Aisha Construction Ltd<br />Zanzibar, Tanzania</p>
          </div>
          <div className="mt-3 rounded bg-muted px-2 py-1 font-semibold">Description · Amount</div>
          {items.map((it) => <div key={it.n} className="flex justify-between px-2 py-1"><span>{it.n}</span><span>{it.p}</span></div>)}
          <div className="mt-2 space-y-0.5 text-right">
            <p>Subtotal 2,300,000</p><p>Tax (18%) 414,000</p>
            <p className="font-bold text-primary">Total TZS 2,714,000</p>
          </div>
          <p className="mt-3 text-center text-muted-foreground">Thank you for your business!</p>
        </div>
      </div>
    </div>
  );
}
