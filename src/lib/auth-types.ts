export type UserRole = 'admin' | 'finance' | 'sales' | 'support';
export type AppRole = 'admin' | 'finance' | 'sales' | 'vendor' | 'customer';
export type PortalType = 'admin' | 'vendor' | 'customer';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  portal: PortalType;
  supabase_uid?: string;
}

export interface CustomerUser {
  id: string;
  name: string;
  email: string;
  mobile: string;
  customer_id?: string;
  supabase_uid?: string;
  password_set?: boolean;
  just_logged_in?: boolean;
}

export interface VendorUser {
  id: string;
  name: string;
  email: string;
  business_name: string;
  vendor_id?: string;
  supabase_uid?: string;
  password_set?: boolean;
  just_logged_in?: boolean;
}

export type TwoFactorPending = {
  challengeId: string;
  expiresAt: string;
  email: string;
};

export type LoginPortal = "admin" | "client";

export interface AuthContextType {
  user: AuthUser | null;
  customerUser: CustomerUser | null;
  vendorUser: VendorUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  twoFactorPending: TwoFactorPending | null;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<LoginPortal | "two_factor">;
  googleLogin: (idToken: string) => Promise<LoginPortal>;
  verifyTwoFactor: (code: string) => Promise<LoginPortal>;
  cancelTwoFactor: () => void;
  customerLogin: (email: string, password: string) => Promise<void>;
  vendorLogin: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  customerLogout: () => Promise<void>;
  vendorLogout: () => void;
  hasAccess: (allowedRoles: UserRole[]) => boolean;
  seedDemoUsers: () => Promise<void>;
}