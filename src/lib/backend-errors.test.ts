import { describe, expect, it } from "vitest";
import { isMissingBackendFunction } from "./backend-errors";
describe("missing backend RPC detection", () => {
  it("recognizes PostgREST's missing-function error", () => {
    expect(isMissingBackendFunction({ code: "PGRST202" })).toBe(true);
  });
  it("does not mask permission failures or network errors as missing setup", () => {
    expect(isMissingBackendFunction({ code: "42501" })).toBe(false);
    expect(isMissingBackendFunction(new Error("Failed to fetch"))).toBe(false);
    expect(isMissingBackendFunction(null)).toBe(false);
  });
});
