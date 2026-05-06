import { describe, expect, it } from "vitest";
import { UserRole } from "@/domain/enums";
import {
  assertCanAccessRoute,
  getDefaultRouteForRole,
  parseUserRole,
} from "./roles";

describe("role routing", () => {
  it("parses supported roles", () => {
    expect(parseUserRole("parent")).toBe(UserRole.Parent);
    expect(parseUserRole("child")).toBe(UserRole.Child);
    expect(parseUserRole("admin")).toBeNull();
  });

  it("returns default route for each role", () => {
    expect(getDefaultRouteForRole(UserRole.Parent)).toBe("/parent/dashboard");
    expect(getDefaultRouteForRole(UserRole.Child)).toBe("/child/today");
  });

  it("blocks parent-only routes for child users", () => {
    expect(assertCanAccessRoute(UserRole.Child, "/parent/dashboard")).toEqual({
      allowed: false,
      redirectTo: "/child/today",
    });
  });

  it("blocks child-only routes for parent users", () => {
    expect(assertCanAccessRoute(UserRole.Parent, "/child/today")).toEqual({
      allowed: false,
      redirectTo: "/parent/dashboard",
    });
  });

  it("allows each role to access its own nested routes", () => {
    expect(assertCanAccessRoute(UserRole.Parent, "/parent/dashboard/books")).toEqual({
      allowed: true,
    });
    expect(assertCanAccessRoute(UserRole.Child, "/child/today/review")).toEqual({
      allowed: true,
    });
  });

  it("does not treat similar public prefixes as protected role routes", () => {
    expect(assertCanAccessRoute(UserRole.Child, "/parenting")).toEqual({
      allowed: true,
    });
    expect(assertCanAccessRoute(UserRole.Parent, "/childish")).toEqual({
      allowed: true,
    });
  });
});
