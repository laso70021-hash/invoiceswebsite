import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { routeTree } from "@/routeTree.gen";

// Match routes without running loaders or rendering: loaders may need a server or
// network the test run lacks, and jsdom never loads the stylesheets React waits on.
describe("App routing", () => {
  it("matches a page for / instead of falling back to not found", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });

    const matches = router.matchRoutes("/");

    expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
  });
  it.each([
    ["/invoices", "/_authenticated/invoices/"],
    ["/invoices/new", "/_authenticated/invoices/new"],
    ["/invoices/123", "/_authenticated/invoices/$id"],
    ["/customers", "/_authenticated/customers"],
    ["/settings", "/_authenticated/settings"],
    ["/workspace/products", "/_authenticated/workspace/$module"],
    ["/received", "/_authenticated/received"],
    ["/accounting", "/_authenticated/accounting"],
    ["/team", "/_authenticated/team"],
    ["/bill/example", "/bill/$token"],
  ])("matches %s to its intended page", (path, routeId) => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
    expect(router.matchRoutes(path).at(-1)?.routeId).toBe(routeId);
  });
});
