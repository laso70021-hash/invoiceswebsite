export const docKinds = {
  proforma: { label: "Proforma Invoices", single: "Proforma Invoice", party: "Customer", date: "Valid until", taxed: true, priced: true },
  tax_invoice: { label: "Tax Invoices", single: "Tax Invoice", party: "Customer", date: "Due date", taxed: true, priced: true },
  quotation: { label: "Quotations", single: "Quotation", party: "Customer", date: "Valid until", taxed: true, priced: true },
  purchase_order: { label: "Purchase Orders", single: "Purchase Order", party: "Supplier", date: "Delivery by", taxed: true, priced: true },
  delivery_note: { label: "Delivery Notes", single: "Delivery Note", party: "Deliver to", date: "Delivery date", taxed: false, priced: false },
} as const;

export type DocKind = keyof typeof docKinds;
export const isDocKind = (k: string): k is DocKind => k in docKinds;
