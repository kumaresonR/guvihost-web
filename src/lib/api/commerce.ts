import { apiRequest } from "@/lib/guvihost-api";
import type { ListParams, PaginatedResponse } from "./types";

function buildQuery(params: Record<string, string | number | boolean | undefined | null>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") q.set(k, String(v));
  }
  const s = q.toString();
  return s ? `?${s}` : "";
}

// Cart
export function getCart() {
  return apiRequest<{ items: Record<string, unknown>[]; count: number; subtotal: number }>("/cart");
}

export function getCartCount() {
  return apiRequest<{ count: number }>("/cart/count");
}

export function addToCart(body: Record<string, unknown>) {
  return apiRequest("/cart", { method: "POST", body: JSON.stringify(body) });
}

export function updateCartItem(id: string, body: Record<string, unknown>) {
  return apiRequest(`/cart/${id}`, { method: "PATCH", body: JSON.stringify(body) });
}

export function removeCartItem(id: string) {
  return apiRequest(`/cart/${id}`, { method: "DELETE" });
}

export function clearCart() {
  return apiRequest("/cart", { method: "DELETE" });
}

// Orders (client)
export function checkout(body: { paymentMethod: string; notes?: string }) {
  return apiRequest<Record<string, unknown>>("/orders/checkout", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function listMyOrders(params: ListParams = {}) {
  return apiRequest<PaginatedResponse<Record<string, unknown>>>(`/orders${buildQuery(params)}`);
}

export function getMyOrder(id: string) {
  return apiRequest<Record<string, unknown>>(`/orders/${id}`);
}

// Billing payments
export function payInvoice(id: string, body: { paymentMethod: string }) {
  return apiRequest(`/billing/invoices/${id}/pay`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function createRazorpayOrder(invoiceId: string) {
  return apiRequest<{
    orderId: string;
    amount: number;
    currency: string;
    keyId: string;
  }>(`/billing/invoices/${invoiceId}/razorpay-order`, { method: "POST", body: "{}" });
}

export function verifyRazorpayPayment(body: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}) {
  return apiRequest("/billing/razorpay/verify", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function addFunds(amount: number) {
  return apiRequest("/billing/add-funds", {
    method: "POST",
    body: JSON.stringify({ amount }),
  });
}

export async function downloadInvoicePdf(id: string): Promise<Blob> {
  const token = localStorage.getItem("guvihost_access_token");
  const base = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api/v1";
  const res = await fetch(`${base}/billing/invoices/${id}/pdf`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to download PDF");
  return res.blob();
}

export function updateBillingProfile(body: Record<string, unknown>) {
  return apiRequest("/billing/profile", { method: "PUT", body: JSON.stringify(body) });
}

// Client quotes
export function getQuotesSummary() {
  return apiRequest<Record<string, unknown>>("/billing/quotes/summary");
}

export function listQuotes(params: ListParams = {}) {
  return apiRequest<PaginatedResponse<Record<string, unknown>>>(
    `/billing/quotes${buildQuery(params)}`
  );
}

export function getQuote(id: string) {
  return apiRequest<Record<string, unknown>>(`/billing/quotes/${id}`);
}

export function acceptQuote(id: string) {
  return apiRequest(`/billing/quotes/${id}/accept`, { method: "POST", body: "{}" });
}

export function rejectQuote(id: string, reason?: string) {
  return apiRequest(`/billing/quotes/${id}/reject`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

// Affiliates
export function getAffiliateDashboard() {
  return apiRequest<Record<string, unknown>>("/affiliates/dashboard");
}

export function listReferrals(params: ListParams = {}) {
  return apiRequest<PaginatedResponse<Record<string, unknown>>>(
    `/affiliates/referrals${buildQuery(params)}`
  );
}
