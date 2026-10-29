import { describe, expect, it } from "vitest";
import { createDocumentPdf } from "./document-pdf";
import { documentStyles, type DesignedDocument } from "./document-design";

const fixture: DesignedDocument = {
  title: "Invoice",
  number: "TEST-001",
  issueDate: "2026-10-28",
  party: "Test Customer",
  business: { business_name: "Test Business" },
  currency: "TZS",
  items: [{ description: "Consulting", qty: 2, price: 50000, discount: 0 }],
  subtotal: 100000,
  tax: 10000,
  taxRate: 10,
  total: 110000,
  paid: 70000,
};
describe("document PDF exports", () => {
  it.each(Object.keys(documentStyles))("exports selectable text for %s", async (style) => {
    const pdf = await createDocumentPdf({
      ...fixture,
      business: { ...fixture.business, template_style: style },
    });
    const output = pdf.output();
    expect(output.startsWith("%PDF-")).toBe(true);
    expect(output).toContain("Consulting");
    expect(output).toContain("TZS 110,000");
    expect(output).toContain("TZS 40,000");
    expect(pdf.getNumberOfPages()).toBe(1);
  });
  it("paginates long documents, repeats table headings, and retains the final item", async () => {
    const pdf = await createDocumentPdf({
      ...fixture,
      items: Array.from({ length: 50 }, (_, i) => ({
        description: `Row ${i + 1}: ${"Long description ".repeat(15)}`,
        qty: 1,
        price: 100,
        discount: 0,
      })),
    });
    expect(pdf.getNumberOfPages()).toBeGreaterThan(2);
    expect(pdf.output()).toContain("Row 50:");
    expect(pdf.output().match(/\(Description\)/g)?.length).toBeGreaterThan(2);
  });
  it("hides financial values on delivery notes", async () => {
    const pdf = await createDocumentPdf({ ...fixture, title: "Delivery Note", priced: false });
    expect(pdf.output()).not.toContain("TZS");
    expect(pdf.output()).toContain("Received by:");
  });
});
