import { describe, expect, it } from "vitest";
import { customizationSchema, parseCustomization, whatsappUrl, contrastingText } from "./branding";
import { designPalette } from "./document-design";
describe("document branding", () => {
  it("validates colours and rejects executable/custom CSS fields", () => {
    expect(customizationSchema.safeParse({ accent: "#12abEF", font: "serif" }).success).toBe(true);
    expect(customizationSchema.safeParse({ accent: "red; background:url(x)" }).success).toBe(false);
    expect(customizationSchema.safeParse({ script: "alert(1)" }).success).toBe(false);
    expect(parseCustomization(null)).toEqual({ font: "sans", density: "comfortable" });
  });
  it("applies business colours and contrasting heading text", () => {
    expect(designPalette({ brand_color: "#112233" }).accent).toBe("#112233");
    expect(
      designPalette({ document_customization: { header: "#FFFFFF", accent: "#654321" } })
        .headerText,
    ).toBe("#071B49");
    expect(contrastingText("#000000")).toBe("#FFFFFF");
  });
  it("normalizes WhatsApp country codes and encodes invoice links", () => {
    expect(whatsappUrl("+255 712-345-678", "Invoice: https://example.com/bill/a?x=1&y=2")).toBe(
      "https://wa.me/255712345678?text=Invoice%3A%20https%3A%2F%2Fexample.com%2Fbill%2Fa%3Fx%3D1%26y%3D2",
    );
    expect(() => whatsappUrl("0712", "test")).toThrow();
    expect(() => whatsappUrl("javascript:alert(1)", "test")).toThrow();
  });
});
