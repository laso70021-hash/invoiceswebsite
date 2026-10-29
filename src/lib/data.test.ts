import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getUser: vi.fn(), from: vi.fn(), eq: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth: { getUser: mocks.getUser }, from: mocks.from } }));
import { customersQuery, invoicesQuery, invoiceQuery, paymentsQuery } from "./data";

describe("Personal workspace owner isolation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getUser.mockResolvedValue({ data: { user: { id: "signed-in-admin" } }, error: null });
    const builder = { select: vi.fn().mockReturnThis(), eq: mocks.eq, order: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: {}, error: null }), then: (resolve: (v: unknown) => unknown) => Promise.resolve({ data: [], error: null }).then(resolve) };
    mocks.eq.mockReturnValue(builder);
    mocks.from.mockReturnValue(builder);
  });
  it.each([
    ["customers", customersQuery], ["invoices", invoicesQuery],
    ["invoice detail", invoiceQuery("other-invoice")], ["payments", paymentsQuery("other-invoice")],
  ])("filters %s to the signed-in owner's ID even for admins", async (_, options) => {
    const fn = options.queryFn;
    if (typeof fn !== "function") throw new Error("Missing query function");
    await (fn as () => Promise<unknown>)();
    expect(mocks.eq).toHaveBeenCalledWith("user_id", "signed-in-admin");
  });
  it("does not query business data while signed out", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });
    const fn = invoicesQuery.queryFn;
    if (typeof fn !== "function") throw new Error("Missing query function");
    await expect((fn as () => Promise<unknown>)()).rejects.toThrow("Sign in");
    expect(mocks.from).not.toHaveBeenCalled();
  });
});