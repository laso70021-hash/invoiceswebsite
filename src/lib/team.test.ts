import { describe, expect, it } from "vitest";
import { teamInviteUrl, teamOverviewSchema } from "./team";
describe("team invitations", () => {
  it("generates a valid sign-in-preserving invitation route", () => {
    expect(teamInviteUrl("https://example.com", "3644a703-840e-40f7-9260-12fb42ef6b14")).toBe(
      "https://example.com/team?invite=3644a703-840e-40f7-9260-12fb42ef6b14",
    );
  });
  it("rejects executable and malformed tokens", () => {
    expect(() => teamInviteUrl("https://example.com", "javascript:alert(1)")).toThrow();
  });
  it("rejects unexpected privilege roles from backend responses", () => {
    expect(
      teamOverviewSchema.safeParse({
        members: [
          {
            id: "3644a703-840e-40f7-9260-12fb42ef6b14",
            email: "test@example.com",
            name: null,
            role: "admin",
            joined_at: "2026-10-28",
          },
        ],
        invites: [],
        businesses: [],
        events: [],
      }).success,
    ).toBe(false);
  });
});
