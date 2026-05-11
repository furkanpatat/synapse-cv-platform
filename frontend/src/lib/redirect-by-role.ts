import type { Role } from "@/types/auth";

export function redirectPathForRole(role: Role): string {
  switch (role) {
    case "COMPANY":
      return "/company";
    case "ADMIN":
      return "/admin";
    case "USER":
    default:
      return "/dashboard";
  }
}
