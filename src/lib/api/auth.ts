import { apiRequest } from "@/lib/guvihost-api";
import type { GuvihostUser } from "@/lib/guvihost-api";

export function registerClient(body: {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phone?: string;
  phoneCountryCode?: string;
  company?: string;
  referralCode?: string;
}) {
  return apiRequest<{ user: GuvihostUser; accessToken: string; expiresIn: string }>("/auth/register", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function forgotPassword(email: string) {
  return apiRequest<{ message: string }>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function resetPassword(body: {
  token: string;
  password: string;
  confirmPassword: string;
}) {
  return apiRequest<{ message: string }>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function verifyEmail(token: string) {
  return apiRequest<{ message: string }>("/auth/email/verify", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}

export function resendVerificationEmail() {
  return apiRequest<{ message: string }>("/auth/email/resend", {
    method: "POST",
    body: "{}",
  });
}

export function googleAuth(idToken: string) {
  return apiRequest<{ user: GuvihostUser; accessToken: string; expiresIn: string }>("/auth/google", {
    method: "POST",
    body: JSON.stringify({ idToken }),
  });
}

export function logoutAllDevices() {
  return apiRequest<{ message: string }>("/auth/logout-all", {
    method: "POST",
    body: "{}",
  });
}

export function request2faEnable() {
  return apiRequest<{ challengeId: string; expiresAt: string }>("/account/2fa/enable/request", {
    method: "POST",
    body: "{}",
  });
}

export function verify2faEnable(challengeId: string, code: string) {
  return apiRequest<{ message: string }>("/account/2fa/enable/verify", {
    method: "POST",
    body: JSON.stringify({ challengeId, code }),
  });
}

export function disable2fa(password: string) {
  return apiRequest<{ message: string }>("/account/2fa/disable", {
    method: "POST",
    body: JSON.stringify({ password }),
  });
}

export function addPaymentMethod(body: Record<string, unknown>) {
  return apiRequest("/account/payment-methods", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function deletePaymentMethod(id: string) {
  return apiRequest(`/account/payment-methods/${id}`, { method: "DELETE" });
}

export function setDefaultPaymentMethod(id: string) {
  return apiRequest(`/account/payment-methods/${id}/default`, { method: "PATCH", body: "{}" });
}

export function getAccountSummary() {
  return apiRequest<Record<string, unknown>>("/account/summary");
}
