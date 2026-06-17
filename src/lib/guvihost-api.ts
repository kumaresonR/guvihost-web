const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api/v1";

const ACCESS_TOKEN_KEY = "guvihost_access_token";

export type GuvihostUser = {
  id: string;
  clientCode: string | null;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: "CLIENT" | "SUPPORT_AGENT" | "ADMIN" | "SUPER_ADMIN";
  status: string;
  kycStatus: string;
  avatarUrl: string | null;
  emailVerifiedAt?: string | null;
  twoFactorEnabled?: boolean;
};

export type TwoFactorChallenge = {
  challengeId: string;
  expiresAt: string;
  method: "EMAIL";
};

type ApiSuccess<T> = { success: true; data: T };
type ApiError = { success: false; error: { code: string; message: string; details?: unknown } };

export class GuvihostApiError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = "GuvihostApiError";
  }
}

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token: string | null): void {
  if (token) localStorage.setItem(ACCESS_TOKEN_KEY, token);
  else localStorage.removeItem(ACCESS_TOKEN_KEY);
}

async function parseResponse<T>(res: Response): Promise<T> {
  const body = (await res.json()) as ApiSuccess<T> | ApiError;
  if (!res.ok || !body.success) {
    const err = body as ApiError;
    throw new GuvihostApiError(
      err.error?.code ?? "REQUEST_FAILED",
      err.error?.message ?? "Request failed"
    );
  }
  return (body as ApiSuccess<T>).data;
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAccessToken();
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers,
  });

  return parseResponse<T>(res);
}

export type LoginResult =
  | { kind: "authenticated"; user: GuvihostUser; accessToken: string; expiresIn: string }
  | { kind: "two_factor"; user: GuvihostUser; challenge: TwoFactorChallenge };

export async function loginRequest(
  email: string,
  password: string,
  rememberMe = false
): Promise<LoginResult> {
  const data = await apiRequest<{
    user: GuvihostUser;
    accessToken?: string;
    expiresIn?: string;
    twoFactorRequired?: boolean;
    challenge?: TwoFactorChallenge;
  }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password, rememberMe }),
  });

  if (data.twoFactorRequired && data.challenge) {
    return { kind: "two_factor", user: data.user, challenge: data.challenge };
  }

  if (!data.accessToken) {
    throw new GuvihostApiError("AUTH_ERROR", "Login did not return an access token");
  }

  return {
    kind: "authenticated",
    user: data.user,
    accessToken: data.accessToken,
    expiresIn: data.expiresIn ?? "15m",
  };
}

export async function verifyTwoFactorRequest(
  challengeId: string,
  code: string
): Promise<{ user: GuvihostUser; accessToken: string; expiresIn: string }> {
  return apiRequest("/auth/2fa/verify", {
    method: "POST",
    body: JSON.stringify({ challengeId, code }),
  });
}

export async function refreshSessionRequest(): Promise<{
  user: GuvihostUser;
  accessToken: string;
  expiresIn: string;
} | null> {
  try {
    return await apiRequest("/auth/refresh", { method: "POST", body: "{}" });
  } catch {
    return null;
  }
}

export async function fetchMeRequest(): Promise<{ user: GuvihostUser }> {
  return apiRequest("/auth/me");
}

export async function logoutRequest(): Promise<void> {
  try {
    await apiRequest("/auth/logout", { method: "POST", body: "{}" });
  } catch {
    // ignore — clear local session regardless
  }
}

export function isStaffRole(role: GuvihostUser["role"]): boolean {
  return role === "ADMIN" || role === "SUPER_ADMIN" || role === "SUPPORT_AGENT";
}
