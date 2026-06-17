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

// Tickets (client extended)
export function getTicketDepartments() {
  return apiRequest<Record<string, unknown>[]>("/tickets/departments");
}

export function getTicketServices() {
  return apiRequest<Record<string, unknown>[]>("/tickets/services");
}

export function closeTicket(id: string) {
  return apiRequest(`/tickets/${id}/close`, { method: "POST", body: "{}" });
}

// KYC (client)
export function submitKycPersonal(body: Record<string, unknown>) {
  return apiRequest("/kyc/personal", { method: "POST", body: JSON.stringify(body) });
}

export async function uploadKycDocument(docType: string, file: File) {
  const token = localStorage.getItem("guvihost_access_token");
  const base = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api/v1";
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${base}/kyc/documents/${docType}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: "include",
    body: form,
  });
  const body = await res.json();
  if (!res.ok || !body.success) throw new Error(body.error?.message ?? "Upload failed");
  return body.data;
}

export function submitKyc() {
  return apiRequest("/kyc/submit", { method: "POST", body: "{}" });
}

// Notifications
export function getNotificationCount() {
  return apiRequest<{ count: number }>("/notifications/count");
}

export function listNotifications(params: ListParams = {}) {
  return apiRequest<PaginatedResponse<Record<string, unknown>>>(
    `/notifications${buildQuery(params)}`
  );
}

export function markAllNotificationsRead() {
  return apiRequest("/notifications/read-all", { method: "POST", body: "{}" });
}

export function markNotificationRead(id: string) {
  return apiRequest(`/notifications/${id}/read`, { method: "PATCH", body: "{}" });
}

// Search
export function globalSearch(q: string) {
  return apiRequest<{
    services: Record<string, unknown>[];
    domains: Record<string, unknown>[];
    tickets: Record<string, unknown>[];
  }>(`/search${buildQuery({ q })}`);
}

// KB (client)
export function listKbCategories() {
  return apiRequest<Record<string, unknown>[]>("/kb/categories");
}

export function listKbArticles(params: ListParams = {}) {
  return apiRequest<PaginatedResponse<Record<string, unknown>>>(
    `/kb/articles${buildQuery(params)}`
  );
}

export function getKbArticleBySlug(slug: string) {
  return apiRequest<Record<string, unknown>>(`/kb/articles/slug/${slug}`);
}

export function getKbArticle(id: string) {
  return apiRequest<Record<string, unknown>>(`/kb/articles/${id}`);
}

// Notes extended
export function listNoteCategories() {
  return apiRequest<Record<string, unknown>[]>("/notes/categories");
}

export function createNoteCategory(body: Record<string, unknown>) {
  return apiRequest("/notes/categories", { method: "POST", body: JSON.stringify(body) });
}

export function listNoteTags() {
  return apiRequest<string[]>("/notes/tags");
}

export function updateNote(id: string, body: Record<string, unknown>) {
  return apiRequest(`/notes/${id}`, { method: "PUT", body: JSON.stringify(body) });
}

export function pinNote(id: string, pinned: boolean) {
  return apiRequest(`/notes/${id}/pin`, {
    method: "PATCH",
    body: JSON.stringify({ pinned }),
  });
}

// Email admin
export function getEmailStatus() {
  return apiRequest<Record<string, unknown>>("/email/status");
}

export function sendTestEmail(to: string) {
  return apiRequest("/email/test", { method: "POST", body: JSON.stringify({ to }) });
}

// Public settings
export function getPublicSettings() {
  return apiRequest<Record<string, unknown>>("/settings");
}
