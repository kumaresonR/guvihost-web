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

// Admin clients
export function exportClientsCsv(): Promise<string> {
  const token = localStorage.getItem("guvihost_access_token");
  const base = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api/v1";
  return fetch(`${base}/admin/clients/export/csv`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: "include",
  }).then(async (res) => {
    if (!res.ok) throw new Error("Export failed");
    return res.text();
  });
}

export function addAdminKycNote(clientId: string, notes: string) {
  return apiRequest(`/admin/kyc/${clientId}/notes`, {
    method: "POST",
    body: JSON.stringify({ notes }),
  });
}

// Admin quotes
export function listAdminQuotes(params: ListParams = {}) {
  return apiRequest<PaginatedResponse<Record<string, unknown>>>(
    `/admin/quotes${buildQuery(params)}`
  );
}

export function createAdminQuote(body: Record<string, unknown>) {
  return apiRequest("/admin/quotes", { method: "POST", body: JSON.stringify(body) });
}

export function getAdminQuote(id: string) {
  return apiRequest<Record<string, unknown>>(`/admin/quotes/${id}`);
}

export function updateAdminQuote(id: string, body: Record<string, unknown>) {
  return apiRequest(`/admin/quotes/${id}`, { method: "PUT", body: JSON.stringify(body) });
}

export function sendAdminQuote(id: string) {
  return apiRequest(`/admin/quotes/${id}/send`, { method: "POST", body: "{}" });
}

export function duplicateAdminQuote(id: string) {
  return apiRequest(`/admin/quotes/${id}/duplicate`, { method: "POST", body: "{}" });
}

export function deleteAdminQuote(id: string) {
  return apiRequest(`/admin/quotes/${id}`, { method: "DELETE" });
}

// Admin KB
export function listAdminKbCategories() {
  return apiRequest<Record<string, unknown>[]>("/admin/kb/categories");
}

export function createAdminKbCategory(body: Record<string, unknown>) {
  return apiRequest("/admin/kb/categories", { method: "POST", body: JSON.stringify(body) });
}

export function updateAdminKbCategory(id: string, body: Record<string, unknown>) {
  return apiRequest(`/admin/kb/categories/${id}`, { method: "PUT", body: JSON.stringify(body) });
}

export function deleteAdminKbCategory(id: string) {
  return apiRequest(`/admin/kb/categories/${id}`, { method: "DELETE" });
}

export function listAdminKbArticles(params: ListParams = {}) {
  return apiRequest<PaginatedResponse<Record<string, unknown>>>(
    `/admin/kb/articles${buildQuery(params)}`
  );
}

export function createAdminKbArticle(body: Record<string, unknown>) {
  return apiRequest("/admin/kb/articles", { method: "POST", body: JSON.stringify(body) });
}

export function getAdminKbArticle(id: string) {
  return apiRequest<Record<string, unknown>>(`/admin/kb/articles/${id}`);
}

export function updateAdminKbArticle(id: string, body: Record<string, unknown>) {
  return apiRequest(`/admin/kb/articles/${id}`, { method: "PUT", body: JSON.stringify(body) });
}

export function deleteAdminKbArticle(id: string) {
  return apiRequest(`/admin/kb/articles/${id}`, { method: "DELETE" });
}

export function publishAdminKbArticle(id: string, publish: boolean) {
  return apiRequest(`/admin/kb/articles/${id}/publish`, {
    method: "POST",
    body: JSON.stringify({ publish }),
  });
}

// Staff extended
export function getStaffDepartments() {
  return apiRequest<string[]>("/admin/staff/departments");
}

export function getStaffMember(id: string) {
  return apiRequest<Record<string, unknown>>(`/admin/staff/${id}`);
}

export function updateStaffMember(id: string, body: Record<string, unknown>) {
  return apiRequest(`/admin/staff/${id}`, { method: "PUT", body: JSON.stringify(body) });
}

export function listStaffTickets(id: string, params: ListParams = {}) {
  return apiRequest<PaginatedResponse<Record<string, unknown>>>(
    `/admin/staff/${id}/tickets${buildQuery(params)}`
  );
}

export function resetStaffPassword(id: string, password: string) {
  return apiRequest(`/admin/staff/${id}/reset-password`, {
    method: "POST",
    body: JSON.stringify({ password, confirmPassword: password }),
  });
}

// Provisioning extended
export function createProvisioningServer(body: Record<string, unknown>) {
  return apiRequest("/admin/provisioning/servers", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function getProvisioningServer(id: string) {
  return apiRequest<Record<string, unknown>>(`/admin/provisioning/servers/${id}`);
}

export function updateProvisioningServer(id: string, body: Record<string, unknown>) {
  return apiRequest(`/admin/provisioning/servers/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export function deleteProvisioningServer(id: string) {
  return apiRequest(`/admin/provisioning/servers/${id}`, { method: "DELETE" });
}

export function assignServiceServer(serviceId: string, serverId: string) {
  return apiRequest(`/admin/provisioning/services/${serviceId}/server`, {
    method: "PATCH",
    body: JSON.stringify({ serverId }),
  });
}

export function runServiceAction(serviceId: string, action: string) {
  return apiRequest(`/admin/provisioning/services/${serviceId}/actions`, {
    method: "POST",
    body: JSON.stringify({ action }),
  });
}

export function createProvisioningJob(body: Record<string, unknown>) {
  return apiRequest("/admin/provisioning/jobs", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function runProvisioningJob(id: string) {
  return apiRequest(`/admin/provisioning/jobs/${id}/run`, { method: "POST", body: "{}" });
}

export function updateProvisioningJobStatus(id: string, status: string) {
  return apiRequest(`/admin/provisioning/jobs/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

// Reports extended
export function getInvoicesReport(params: { from?: string; to?: string; groupBy?: string } = {}) {
  return apiRequest<Record<string, unknown>>(`/admin/reports/invoices${buildQuery(params)}`);
}

export function getTicketsReport(params: { from?: string; to?: string; groupBy?: string } = {}) {
  return apiRequest<Record<string, unknown>>(`/admin/reports/tickets${buildQuery(params)}`);
}

export function getOrdersReport(params: { from?: string; to?: string; groupBy?: string } = {}) {
  return apiRequest<Record<string, unknown>>(`/admin/reports/orders${buildQuery(params)}`);
}

export function getDomainsReport(params: { from?: string; to?: string } = {}) {
  return apiRequest<Record<string, unknown>>(`/admin/reports/domains${buildQuery(params)}`);
}

async function downloadReportCsv(path: string, params: Record<string, string> = {}): Promise<string> {
  const token = localStorage.getItem("guvihost_access_token");
  const base = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api/v1";
  const q = new URLSearchParams(params).toString();
  const url = `${base}${path}${q ? `?${q}` : ""}`;
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: "include",
  });
  if (!res.ok) throw new Error("Export failed");
  return res.text();
}

export function exportRevenueCsv(params: { from?: string; to?: string } = {}) {
  return downloadReportCsv("/admin/reports/export/revenue", params as Record<string, string>);
}

export function exportInvoicesCsv(params: { from?: string; to?: string } = {}) {
  return downloadReportCsv("/admin/reports/export/invoices", params as Record<string, string>);
}

export function exportClientsReportCsv(params: { from?: string; to?: string } = {}) {
  return downloadReportCsv("/admin/reports/export/clients", params as Record<string, string>);
}

// Staff tickets extended
export function listSupportAgents() {
  return apiRequest<Record<string, unknown>[]>("/staff/tickets/agents");
}

export function staffAssignToMe(ticketId: string) {
  return apiRequest(`/staff/tickets/${ticketId}/assign-me`, { method: "POST", body: "{}" });
}

export function staffEscalateTicket(ticketId: string, reason?: string) {
  return apiRequest(`/staff/tickets/${ticketId}/escalate`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export function staffReopenTicket(ticketId: string) {
  return apiRequest(`/staff/tickets/${ticketId}/reopen`, { method: "POST", body: "{}" });
}
