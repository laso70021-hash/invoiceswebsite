import { parseCustomization } from "./branding";
import type { Customer, Invoice } from "./data";
import type { Tables } from "@/integrations/supabase/types";
import { money, balance, lineAmount } from "./invoice-math";
import {
  businessLines,
  designPalette,
  type BusinessIdentity,
  type DesignedDocument,
} from "./document-design";

type DocumentInvoice = Omit<Invoice, "customers"> & { customers: Customer | null };
const identity = (business: string | BusinessIdentity): BusinessIdentity =>
  typeof business === "string" ? { business_name: business } : business;
export function invoiceDesign(
  invoice: DocumentInvoice,
  business: string | BusinessIdentity,
): DesignedDocument {
  return {
    title: invoice.status === "draft" ? "Draft Invoice" : "Invoice",
    number: invoice.number ?? invoice.id,
    issueDate: invoice.issue_date,
    dueDate: invoice.due_date,
    party: invoice.customers?.name ?? "",
    partyDetails: [invoice.customers?.address, invoice.customers?.email].filter(Boolean).join("\n"),
    business: identity(business),
    currency: invoice.currency,
    items: invoice.items,
    subtotal: invoice.subtotal,
    tax: invoice.tax,
    taxRate: invoice.tax_rate,
    total: invoice.total,
    paid: invoice.amount_paid,
    notes: invoice.notes,
  };
}

/** Selectable text, repeated table headers, and page breaks within long descriptions. */
export async function createDocumentPdf(d: DesignedDocument) {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF();
  const s = designPalette(d.business);
  const custom = parseCustomization(d.business.document_customization);
  const font = custom.font === "serif" ? "times" : custom.font === "mono" ? "courier" : "helvetica";
  let logo: Uint8Array | undefined;
  if (d.business.logo_url) {
    const response = await fetch(d.business.logo_url, { signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error("Could not load business logo for export.");
    logo = new Uint8Array(await response.arrayBuffer());
  }
  let y = 20;
  const text = (
    value: string,
    x: number,
    top: number,
    width: number,
    size = 9,
    color: string = s.ink,
    bold = false,
  ) => {
    pdf.setFont(font, bold ? "bold" : "normal");
    pdf.setFontSize(size);
    pdf.setTextColor(color);
    const lines = pdf.splitTextToSize(value, width) as string[];
    pdf.text(lines, x, top);
    return Math.max(1, lines.length) * size * 0.42;
  };
  const page = () => {
    pdf.setFillColor(s.header);
    pdf.rect(0, 0, 210, 35, "F");
    if (logo) {
      const size = pdf.getImageProperties(logo);
      const ratio = Math.min(22 / size.width, 22 / size.height);
      pdf.addImage(logo, 16, 6, size.width * ratio, size.height * ratio);
    }
    text(
      d.business.business_name || "Your business",
      logo ? 43 : 16,
      14,
      logo ? 62 : 90,
      17,
      s.headerText,
      true,
    );
    text((custom.heading || d.title).toUpperCase(), 111, 14, 83, 15, s.headerText, true);
    pdf.setFillColor(s.accent);
    pdf.rect(0, 35, 210, 2, "F");
    y = 47;
  };
  page();
  y +=
    Math.max(
      text(d.number || "Draft", 16, y, 90, 10, s.ink, true),
      text(
        `Issued: ${d.issueDate}${d.dueDate ? `\n${d.dueLabel || "Due date"}: ${d.dueDate}` : ""}`,
        120,
        y,
        74,
      ),
    ) + 10;
  text("FROM", 16, y, 80, 9, s.accent, true);
  text(d.partyLabel || "BILL TO", 113, y, 81, 9, s.accent, true);
  y += 7;
  pdf.setFontSize(9);
  const a = pdf.splitTextToSize(
    [d.business.business_name || "Your business", ...businessLines(d.business)].join("\n"),
    83,
  ) as string[];
  const b = pdf.splitTextToSize(
    [d.party, d.partyDetails].filter(Boolean).join("\n"),
    81,
  ) as string[];
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (y > 265) {
      pdf.addPage();
      page();
    }
    if (a[i]) text(a[i]!, 16, y, 83);
    if (b[i]) text(b[i]!, 113, y, 81);
    y += 4.5;
  }
  y += 10;
  const priced = d.priced !== false;
  const xs = priced ? [18, 28, 94, 109, 141, 158] : [18, 28, 174];
  const widths = priced ? [7, 61, 13, 28, 13, 35] : [7, 140, 19];
  const header = () => {
    if (y > 255) {
      pdf.addPage();
      page();
    }
    pdf.setFillColor(s.ink);
    pdf.rect(16, y - 5, 178, 10, "F");
    const labels = priced
      ? ["#", "Description", "Qty", "Unit price", "Disc.", "Amount"]
      : ["#", "Description", "Qty"];
    labels.forEach((label, i) => text(label, xs[i]!, y + 1, widths[i]!, 8, "#FFFFFF", true));
    y += 12;
  };
  header();
  d.items.forEach((item, index) => {
    const cells = priced
      ? [
          String(index + 1),
          item.description,
          String(item.qty),
          money(item.price, d.currency),
          `${item.discount}%`,
          money(lineAmount(item), d.currency),
        ]
      : [String(index + 1), item.description, String(item.qty)];
    pdf.setFont(font, "normal");
    pdf.setFontSize(8);
    const lines = cells.map((cell, i) => pdf.splitTextToSize(cell, widths[i]!) as string[]);
    const count = Math.max(...lines.map((value) => value.length));
    if (y + Math.min(count * 4 + 5, 30) > 265) {
      pdf.addPage();
      page();
      header();
    }
    for (let line = 0; line < count; line++) {
      if (y > 265) {
        pdf.addPage();
        page();
        header();
      }
      if (index % 2 === 1) {
        pdf.setFillColor(s.pale);
        pdf.rect(16, y - 3, 178, 4.2, "F");
      }
      lines.forEach((cell, i) => {
        if (cell[line]) text(cell[line]!, xs[i]!, y, widths[i]!, 8);
      });
      y += 4.2;
    }
    pdf.setDrawColor("#DCE3ED");
    pdf.line(16, y + 2, 194, y + 2);
    y += custom.density === "compact" ? 4 : 8;
  });
  if (y > 205) {
    pdf.addPage();
    page();
  }
  y += 8;
  if (priced) {
    const rows: [string, number][] = [
      ["Subtotal", d.subtotal],
      [`Tax (${d.taxRate}%)`, d.tax],
      ["Total", d.total],
    ];
    if (d.paid !== undefined)
      rows.push(["Amount paid", d.paid], ["Balance due", balance(d.total, d.paid)]);
    for (const [label, value] of rows) {
      if (label === "Total") {
        pdf.setFillColor(s.pale);
        pdf.rect(105, y - 5, 89, 10, "F");
      }
      text(label, 107, y, 40, 9, s.ink, label === "Total");
      pdf.setFontSize(9);
      pdf.text(money(value, d.currency), 192, y, { align: "right" });
      y += 10;
    }
  } else {
    text("Received by: ____________________   Date: ______________", 16, y, 178);
    y += 15;
  }
  const note = (label: string, content?: string | null) => {
    if (!content) return;
    if (y > 245) {
      pdf.addPage();
      page();
    }
    text(label, 16, y, 178, 9, s.accent, true);
    y += 7;
    pdf.setFontSize(9);
    for (const line of pdf.splitTextToSize(content, 178) as string[]) {
      if (y > 265) {
        pdf.addPage();
        page();
      }
      text(line, 16, y, 178);
      y += 4.5;
    }
    y += 8;
  };
  if (priced) note("PAYMENT INFORMATION", d.business.payment_instructions);
  note("NOTES & TERMS", d.notes);
  const count = pdf.getNumberOfPages();
  for (let i = 1; i <= count; i++) {
    pdf.setPage(i);
    pdf.setDrawColor(s.accent);
    pdf.line(16, 280, 194, 280);
    text(custom.footer ?? "Thank you for your business.", 16, 284, 150, 7, s.accent);
    text(`${i} / ${count}`, 178, 287, 16, 8);
  }
  return pdf;
}

export async function downloadDocument(
  invoice: DocumentInvoice,
  business: string | BusinessIdentity,
  payment?: Tables<"payments">,
) {
  const d = invoiceDesign(invoice, business);
  if (payment) {
    d.title = "Payment Receipt";
    d.number = `Receipt-${payment.id}`;
    d.issueDate = payment.paid_on;
    d.dueDate = null;
    d.items = [
      {
        description: `Payment for ${invoice.number ?? invoice.id}\nMethod: ${payment.method}`,
        qty: 1,
        price: payment.amount,
        discount: 0,
      },
    ];
    d.subtotal = payment.amount;
    d.tax = 0;
    d.taxRate = 0;
    d.total = payment.amount;
    delete d.paid;
    d.notes = `Acknowledges funds recorded against invoice ${invoice.number ?? invoice.id}.`;
    d.business = { ...d.business, payment_instructions: null };
  }
  const pdf = await createDocumentPdf(d);
  pdf.save(`${payment ? `Receipt-${payment.id.slice(0, 8)}` : (invoice.number ?? "Invoice")}.pdf`);
}
type BizDoc = {
  number: string | null;
  party_name: string;
  party_details: string | null;
  issue_date: string;
  due_date: string | null;
  currency: string;
  items: import("./invoice-math").LineItem[];
  tax_rate: number;
  subtotal: number;
  tax: number;
  total: number;
  notes: string | null;
};
export async function downloadBusinessDocument(
  doc: BizDoc,
  cfg: { single: string; party: string; date: string; taxed: boolean; priced: boolean },
  business: string | BusinessIdentity,
) {
  const pdf = await createDocumentPdf({
    title: cfg.single,
    number: doc.number ?? "",
    issueDate: doc.issue_date,
    dueDate: doc.due_date,
    dueLabel: cfg.date,
    partyLabel: cfg.party,
    party: doc.party_name,
    partyDetails: doc.party_details,
    currency: doc.currency,
    items: doc.items,
    taxRate: cfg.taxed ? doc.tax_rate : 0,
    tax: cfg.taxed ? doc.tax : 0,
    subtotal: doc.subtotal,
    total: doc.total,
    notes: doc.notes,
    business: identity(business),
    priced: cfg.priced,
  });
  pdf.save(`${doc.number ?? cfg.single}.pdf`);
}
