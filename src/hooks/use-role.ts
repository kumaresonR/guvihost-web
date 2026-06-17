import { useAuth } from "@/lib/auth";

/** True when logged in as staff (admin / support) */
export function useIsStaff(): boolean {
  const { user } = useAuth();
  return Boolean(user);
}

/** True when logged in as hosting client */
export function useIsClient(): boolean {
  const { customerUser } = useAuth();
  return Boolean(customerUser);
}

/** Staff landing path after login */
export function getStaffHomePath(role?: string): string {
  return role === "support" ? "/support/all" : "/dashboard";
}

export function useDisplayUser(): { name: string; email: string } | null {
  const { user, customerUser } = useAuth();
  if (user) return { name: user.name, email: user.email };
  if (customerUser) return { name: customerUser.name, email: customerUser.email };
  return null;
}
