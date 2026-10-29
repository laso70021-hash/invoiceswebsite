import type { LineItem } from "./invoice-math";
import type { Tables } from "@/integrations/supabase/types";
import { contrastingText, parseCustomization } from "./branding";

export const documentStyles = {
  classic: {
    label: "Classic navy",
    ink: "#071B49",
    accent: "#1260F5",
    pale: "#EAF3FF",
    header: "#071B49",
    headerText: "#FFFFFF",
  },
  charcoal: {
    label: "Charcoal & coral",
    ink: "#25282F",
    accent: "#EF4166",
    pale: "#F2F3F4",
    header: "#25282F",
    headerText: "#FFFFFF",
  },
  taxi: {
    label: "Taxi yellow",
    ink: "#192A35",
    accent: "#E3AD00",
    pale: "#FFF7D0",
    header: "#FFDA35",
    headerText: "#192A35",
  },
  restaurant: {
    label: "Restaurant",
    ink: "#07543B",
    accent: "#CF252E",
    pale: "#FFF3D1",
    header: "#FFCA35",
    headerText: "#A51D26",
  },
  burgundy: {
    label: "Burgundy",
    ink: "#781D25",
    accent: "#A32A34",
    pale: "#FFF0F0",
    header: "#781D25",
    headerText: "#FFFFFF",
  },
  olive: {
    label: "Olive",
    ink: "#535936",
    accent: "#777843",
    pale: "#F3F2E5",
    header: "#777843",
    headerText: "#FFFFFF",
  },
  emerald: {
    label: "Quotation green",
    ink: "#064E3B",
    accent: "#009D72",
    pale: "#EAF9F1",
    header: "#007C58",
    headerText: "#FFFFFF",
  },
} as const;
export type DocumentStyle = keyof typeof documentStyles;
export function resolveStyle(value?: string): DocumentStyle {
  return value && Object.hasOwn(documentStyles, value) ? (value as DocumentStyle) : "classic";
}
export type BusinessIdentity = Partial<
  Pick<
    Tables<"profiles">,
    | "business_name"
    | "address"
    | "email"
    | "phone"
    | "tax_id"
    | "payment_instructions"
    | "template_style"
    | "brand_color"
    | "logo_url"
    | "whatsapp_number"
    | "document_customization"
  >
>;
export function designPalette(business: BusinessIdentity, style?: string) {
  const base = documentStyles[resolveStyle(style ?? business.template_style)];
  const c = parseCustomization(business.document_customization);
  const accent =
    c.accent ??
    (/^#[0-9a-f]{6}$/i.test(business.brand_color ?? "") ? business.brand_color! : base.accent);
  const header = c.header ?? base.header;
  return { ...base, accent, header, headerText: contrastingText(header) };
}
export type DesignedDocument = {
  title: string;
  number: string;
  issueDate: string;
  dueDate?: string | null;
  dueLabel?: string;
  partyLabel?: string;
  party: string;
  partyDetails?: string | null;
  business: BusinessIdentity;
  currency: string;
  items: LineItem[];
  subtotal: number;
  tax: number;
  taxRate: number;
  total: number;
  paid?: number;
  notes?: string | null;
  priced?: boolean;
};
export function businessLines(business: BusinessIdentity) {
  return [
    business.address,
    business.email,
    business.phone,
    business.tax_id ? `Tax ID: ${business.tax_id}` : null,
  ].filter((line): line is string => Boolean(line));
}
