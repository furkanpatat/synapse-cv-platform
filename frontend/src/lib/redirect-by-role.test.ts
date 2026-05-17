import { describe, expect, it } from "vitest";

import { redirectPathForRole } from "./redirect-by-role";

describe("redirectPathForRole", () => {
  it("USER → /dashboard", () => {
    expect(redirectPathForRole("USER")).toBe("/dashboard");
  });

  it("COMPANY → /company", () => {
    expect(redirectPathForRole("COMPANY")).toBe("/company");
  });

  it("ADMIN → /admin", () => {
    expect(redirectPathForRole("ADMIN")).toBe("/admin");
  });
});
