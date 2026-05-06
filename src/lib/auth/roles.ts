import { UserRole } from "@/domain/enums";

export type RouteAccessResult =
  | { allowed: true; redirectTo?: never }
  | { allowed: false; redirectTo: string };

export function parseUserRole(value: string | null | undefined): UserRole | null {
  if (value === UserRole.Parent) return UserRole.Parent;
  if (value === UserRole.Child) return UserRole.Child;
  return null;
}

export function getDefaultRouteForRole(role: UserRole): "/parent/dashboard" | "/child/today" {
  switch (role) {
    case UserRole.Parent:
      return "/parent/dashboard";
    case UserRole.Child:
      return "/child/today";
  }
}

export function assertCanAccessRoute(role: UserRole, pathname: string): RouteAccessResult {
  if (isRouteInSection(pathname, "/parent") && role !== UserRole.Parent) {
    return { allowed: false, redirectTo: getDefaultRouteForRole(role) };
  }

  if (isRouteInSection(pathname, "/child") && role !== UserRole.Child) {
    return { allowed: false, redirectTo: getDefaultRouteForRole(role) };
  }

  return { allowed: true };
}

function isRouteInSection(pathname: string, sectionRoot: "/parent" | "/child"): boolean {
  return pathname === sectionRoot || pathname.startsWith(`${sectionRoot}/`);
}
