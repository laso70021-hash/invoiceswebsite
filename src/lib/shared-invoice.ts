import { customizationSchema } from "./branding";
import { z } from "zod";
const optionalText = z.string().nullable();
export const sharedInvoiceSchema = z.object({
  id: z.string(),
  number: optionalText,
  issue_date: z.string(),
  due_date: optionalText,
  currency: z.string(),
  items: z.array(
    z.object({ description: z.string(), qty: z.number(), price: z.number(), discount: z.number() }),
  ),
  subtotal: z.number(),
  tax: z.number(),
  tax_rate: z.number(),
  total: z.number(),
  amount_paid: z.number(),
  status: z.string(),
  notes: optionalText,
  customer_name: optionalText,
  customer_address: optionalText,
  business: z.object({
    business_name: optionalText,
    address: optionalText,
    email: optionalText,
    phone: optionalText,
    tax_id: optionalText,
    payment_instructions: optionalText,
    template_style: z.string(),
    brand_color: z.string(),
    logo_url: optionalText,
    whatsapp_number: optionalText,
    document_customization: customizationSchema,
  }),
});
