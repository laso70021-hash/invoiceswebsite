import { z } from "zod";
const color = z.string().regex(/^#[0-9a-f]{6}$/i, "Use a six-digit hex colour, such as #1260F5.");
export const customizationSchema = z
  .object({
    accent: color.optional(),
    header: color.optional(),
    heading: z.string().trim().max(70).optional(),
    footer: z.string().trim().max(300).optional(),
    font: z.enum(["sans", "serif", "mono"]).default("sans"),
    density: z.enum(["comfortable", "compact"]).default("comfortable"),
  })
  .strict();
export type Customization = z.infer<typeof customizationSchema>;
export function parseCustomization(value: unknown): Customization {
  const result = customizationSchema.safeParse(value);
  return result.success ? result.data : { font: "sans", density: "comfortable" };
}
export function whatsappUrl(number: string, message: string) {
  const digits = number.replace(/[\s()+-]/g, "");
  if (!/^[1-9]\d{6,14}$/.test(digits))
    throw new Error("Enter a WhatsApp number with country code, e.g. +255712345678.");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
export function contrastingText(hex: string) {
  const rgb = hex
    .slice(1)
    .match(/.{2}/g)
    ?.map((v) => parseInt(v, 16)) ?? [0, 0, 0];
  return ((rgb[0] ?? 0) * 299 + (rgb[1] ?? 0) * 587 + (rgb[2] ?? 0) * 114) / 1000 > 150
    ? "#071B49"
    : "#FFFFFF";
}
