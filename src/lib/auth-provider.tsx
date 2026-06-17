import { useEffect, useState, ReactNode, useCallback } from "react";
import { AuthContext } from "@/lib/auth-context";
import {
  fetchMeRequest,
  getAccessToken,
  GuvihostApiError,
  isStaffRole,
  loginRequest,
  logoutRequest,
  refreshSessionRequest,
  setAccessToken,
  type GuvihostUser,
  verifyTwoFactorRequest,
} from "@/lib/guvihost-api";
import { googleAuth } from "@/lib/api";
import type {
  AuthUser,
  CustomerUser,
  LoginPortal,
  TwoFactorPending,
  UserRole,
  VendorUser,
} from "@/lib/auth-types";

const ADMIN_USER_KEY = "guvihost_admin_user";
const CLIENT_USER_KEY = "guvihost_client_user";

function displayName(u: GuvihostUser): string {
  return [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email;
}

function mapStaffUser(u: GuvihostUser): AuthUser {
  const role: UserRole =
    u.role === "SUPER_ADMIN" || u.role === "ADMIN"
      ? "admin"
      : u.role === "SUPPORT_AGENT"
        ? "sales"
        : "admin";

  return {
    id: u.id,
    name: displayName(u),
    email: u.email,
    role,
    portal: "admin",
  };
}

function mapClientUser(u: GuvihostUser): CustomerUser {
  return {
    id: u.id,
    name: displayName(u),
    email: u.email,
    mobile: "",
    customer_id: u.clientCode ?? u.id,
    password_set: true,
  };
}

function persistSession(staff: AuthUser | null, client: CustomerUser | null) {
  if (staff) localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(staff));
  else localStorage.removeItem(ADMIN_USER_KEY);
  if (client) localStorage.setItem(CLIENT_USER_KEY, JSON.stringify(client));
  else localStorage.removeItem(CLIENT_USER_KEY);
}

function applyAuthenticatedUser(
  backendUser: GuvihostUser,
  accessToken: string,
  setUser: (u: AuthUser | null) => void,
  setCustomerUser: (u: CustomerUser | null) => void
): LoginPortal {
  setAccessToken(accessToken);

  if (isStaffRole(backendUser.role)) {
    const staff = mapStaffUser(backendUser);
    setUser(staff);
    setCustomerUser(null);
    persistSession(staff, null);
    return "admin";
  }

  const client = mapClientUser(backendUser);
  setCustomerUser(client);
  setUser(null);
  persistSession(null, client);
  return "client";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [customerUser, setCustomerUser] = useState<CustomerUser | null>(null);
  const [vendorUser, setVendorUser] = useState<VendorUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [twoFactorPending, setTwoFactorPending] = useState<TwoFactorPending | null>(null);

  const isAuthenticated = !!(user || customerUser || vendorUser);

  const restoreSession = useCallback(async () => {
    try {
      const savedStaff = localStorage.getItem(ADMIN_USER_KEY);
      const savedClient = localStorage.getItem(CLIENT_USER_KEY);
      if (savedStaff) setUser(JSON.parse(savedStaff));
      if (savedClient) setCustomerUser(JSON.parse(savedClient));

      if (!getAccessToken()) {
        const refreshed = await refreshSessionRequest();
        if (refreshed) {
          applyAuthenticatedUser(refreshed.user, refreshed.accessToken, setUser, setCustomerUser);
          return;
        }
        setUser(null);
        setCustomerUser(null);
        persistSession(null, null);
        return;
      }

      const me = await fetchMeRequest();
      applyAuthenticatedUser(me.user, getAccessToken()!, setUser, setCustomerUser);
    } catch {
      setAccessToken(null);
      setUser(null);
      setCustomerUser(null);
      persistSession(null, null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const login = async (
    email: string,
    password: string,
    rememberMe = false
  ): Promise<LoginPortal | "two_factor"> => {
    setIsLoading(true);
    try {
      const result = await loginRequest(email, password, rememberMe);

      if (result.kind === "two_factor") {
        setTwoFactorPending({
          challengeId: result.challenge.challengeId,
          expiresAt: result.challenge.expiresAt,
          email: result.user.email,
        });
        return "two_factor";
      }

      setTwoFactorPending(null);
      return applyAuthenticatedUser(result.user, result.accessToken, setUser, setCustomerUser);
    } finally {
      setIsLoading(false);
    }
  };

  const verifyTwoFactor = async (code: string): Promise<LoginPortal> => {
    if (!twoFactorPending) {
      throw new GuvihostApiError("VALIDATION_ERROR", "No two-factor challenge in progress");
    }

    setIsLoading(true);
    try {
      const data = await verifyTwoFactorRequest(twoFactorPending.challengeId, code);
      setTwoFactorPending(null);
      return applyAuthenticatedUser(data.user, data.accessToken, setUser, setCustomerUser);
    } finally {
      setIsLoading(false);
    }
  };

  const cancelTwoFactor = () => setTwoFactorPending(null);

  const googleLogin = async (idToken: string): Promise<LoginPortal> => {
    setIsLoading(true);
    try {
      const data = await googleAuth(idToken);
      setTwoFactorPending(null);
      return applyAuthenticatedUser(data.user, data.accessToken, setUser, setCustomerUser);
    } finally {
      setIsLoading(false);
    }
  };

  const customerLogin = async (email: string, password: string) => {
    const portal = await login(email, password);
    if (portal === "two_factor") {
      throw new GuvihostApiError("TWO_FACTOR_REQUIRED", "Complete two-factor verification");
    }
    if (portal !== "client") {
      throw new GuvihostApiError("FORBIDDEN", "This account is not a client portal user");
    }
  };

  const vendorLogin = async (_email: string, _password: string) => {
    throw new GuvihostApiError("NOT_IMPLEMENTED", "Vendor login is not connected to GUVIHOST API");
  };

  const logout = async () => {
    await logoutRequest();
    setAccessToken(null);
    setUser(null);
    setCustomerUser(null);
    setTwoFactorPending(null);
    persistSession(null, null);
  };

  const customerLogout = async () => {
    await logout();
  };

  const vendorLogout = () => {
    setVendorUser(null);
  };

  const hasAccess = (allowedRoles: UserRole[]) => {
    if (!user) return false;
    if (user.role === "admin") return true;
    return allowedRoles.includes(user.role);
  };

  const seedDemoUsers = async () => {
    console.info("Use server seed: npm run db:seed in server/");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        customerUser,
        vendorUser,
        isAuthenticated,
        isLoading,
        twoFactorPending,
        login,
        googleLogin,
        verifyTwoFactor,
        cancelTwoFactor,
        customerLogin,
        vendorLogin,
        logout,
        customerLogout,
        vendorLogout,
        hasAccess,
        seedDemoUsers,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export { useAuth } from "@/lib/use-auth";
