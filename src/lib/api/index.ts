import { apiRequest } from "@/lib/guvihost-api";
import type { ListParams, PaginatedResponse } from "./types";

export * from "./types";
export * from "./auth";
export * from "./commerce";
export * from "./services-domains";
export * from "./client-features";
export * from "./admin-ext";

function buildQuery(params: Record<string, string | number | boolean | undefined | null>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") q.set(k, String(v));
  }
  const s = q.toString();
  return s ? `?${s}` : "";
}

// ─── Admin ───────────────────────────────────────────────────────────────────

export function getAdminDashboard() {
  return apiRequest<{
    summary: {
      totalClients: number;
      activeClients: number;
      inactiveClients: number;
      kycVerified: number;
      kycUnverified: number;
      activeServices: number;
      pendingOrders: number;
      monthlyRevenue: number;
      openTickets: number;
      dueForRenewal: number;
    };
    servicesOverview: { type: string; count: number }[];
    recentOrders: { orderId: string; product: string; customer: string; status: string }[];
  }>("/admin/dashboard");
}

export function getClientStats() {
  return apiRequest<{
    total: number;
    active: number;
    inactive: number;
    kycVerified: number;
    kycUnverified: number;
  }>("/admin/clients/stats");
}

export function listClients(params: ListParams = {}) {
  return apiRequest<PaginatedResponse<Record<string, unknown>>>(
    `/admin/clients${buildQuery(params)}`
  );
}

export function getClient(id: string) {
  return apiRequest<Record<string, unknown>>(`/admin/clients/${id}`);
}

export function createClient(body: Record<string, unknown>) {
  return apiRequest<Record<string, unknown>>("/admin/clients", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateClient(id: string, body: Record<string, unknown>) {
  return apiRequest<Record<string, unknown>>(`/admin/clients/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export function listKycQueue(params: ListParams = {}) {
  return apiRequest<PaginatedResponse<Record<string, unknown>>>(
    `/admin/kyc/queue${buildQuery(params)}`
  );
}

export function getAdminKyc(clientId: string) {
  return apiRequest<Record<string, unknown>>(`/admin/kyc/${clientId}`);
}

export function verifyKyc(clientId: string, notes?: string) {
  return apiRequest(`/admin/kyc/${clientId}/verify`, {
    method: "POST",
    body: JSON.stringify({ notes }),
  });
}

export function rejectKyc(clientId: string, reason: string) {
  return apiRequest(`/admin/kyc/${clientId}/reject`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export function impersonateClient(clientId: string) {
  return apiRequest<{ accessToken: string; user: Record<string, unknown> }>(
    `/admin/clients/${clientId}/impersonate`,
    { method: "POST", body: "{}" }
  );
}

// ─── Client dashboard ────────────────────────────────────────────────────────

export function getClientDashboard() {
  return apiRequest<{
    summary: {
      activeServices: number;
      domains: number;
      unpaidInvoices: number;
      unpaidAmount: number;
      openTickets: number;
      walletBalance: number;
    };
    servicesOverview: {
      total: number;
      active: number;
      pending: number;
      suspended: number;
      cancelled: number;
    };
    recentInvoices: {
      id: string;
      invoiceNumber: string;
      invoiceDate: string;
      total: number;
      status: string;
    }[];
    activeServices: {
      id: string;
      name: string;
      domain: string | null;
      type: string;
      status: string;
    }[];
    recentTickets: {
      id: string;
      ticketNumber: string;
      subject: string;
      status: string;
      updatedAt: string;
    }[];
  }>("/dashboard");
}

// ─── Services ────────────────────────────────────────────────────────────────

export function getServicesHub() {
  return apiRequest<{
    categories: { type: string; active: number; pending: number; suspended: number }[];
    domains: { active: number; pending: number; expiringSoon: number };
  }>("/services/hub");
}

export function listServices(params: ListParams = {}) {
  return apiRequest<PaginatedResponse<Record<string, unknown>>>(
    `/services${buildQuery(params)}`
  );
}

export function getServiceStats(type: string) {
  return apiRequest<Record<string, unknown>>(`/services/stats/${type}`);
}

// ─── Domains ─────────────────────────────────────────────────────────────────

export function getDomainsSummary() {
  return apiRequest<Record<string, unknown>>("/domains/summary");
}

export function listDomains(params: ListParams = {}) {
  return apiRequest<PaginatedResponse<Record<string, unknown>>>(
    `/domains${buildQuery(params)}`
  );
}

// ─── Billing ─────────────────────────────────────────────────────────────────

export function getBillingDashboard() {
  return apiRequest<Record<string, unknown>>("/billing/dashboard");
}

export function listInvoices(params: ListParams = {}) {
  return apiRequest<PaginatedResponse<Record<string, unknown>>>(
    `/billing/invoices${buildQuery(params)}`
  );
}

export function getInvoice(id: string) {
  return apiRequest<Record<string, unknown>>(`/billing/invoices/${id}`);
}

export function listTransactions(params: ListParams = {}) {
  return apiRequest<PaginatedResponse<Record<string, unknown>>>(
    `/billing/transactions${buildQuery(params)}`
  );
}

export function listPaymentMethods() {
  return apiRequest<Record<string, unknown>[]>("/account/payment-methods");
}

// ─── Tickets (client) ────────────────────────────────────────────────────────

export function getTicketsSummary() {
  return apiRequest<Record<string, unknown>>("/tickets/summary");
}

export function listTickets(params: ListParams = {}) {
  return apiRequest<PaginatedResponse<Record<string, unknown>>>(
    `/tickets${buildQuery(params)}`
  );
}

export function getTicket(id: string) {
  return apiRequest<Record<string, unknown>>(`/tickets/${id}`);
}

export function createTicket(body: Record<string, unknown>) {
  return apiRequest<Record<string, unknown>>("/tickets", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function replyToTicket(id: string, content: string) {
  return apiRequest(`/tickets/${id}/reply`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });
}

export async function uploadTicketAttachments(ticketId: string, files: File[]) {
  const token = localStorage.getItem("guvihost_access_token");
  const base = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api/v1";
  const form = new FormData();
  for (const file of files) form.append("files", file);
  const res = await fetch(`${base}/tickets/${ticketId}/attachments`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: "include",
    body: form,
  });
  const body = await res.json();
  if (!res.ok || !body.success) throw new Error(body.error?.message ?? "Upload failed");
  return body.data;
}

// ─── Staff tickets ───────────────────────────────────────────────────────────

export function getStaffTicketSummary() {
  return apiRequest<{
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    closed: number;
    emergency: number;
    unassigned: number;
    overdue: number;
  }>("/staff/tickets/summary");
}

export function listStaffTickets(params: ListParams = {}) {
  return apiRequest<PaginatedResponse<Record<string, unknown>>>(
    `/staff/tickets${buildQuery(params)}`
  );
}

export function getStaffTicket(id: string) {
  return apiRequest<Record<string, unknown>>(`/staff/tickets/${id}`);
}

export function updateStaffTicket(id: string, body: Record<string, unknown>) {
  return apiRequest(`/staff/tickets/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function staffReplyTicket(id: string, content: string, setStatus?: string) {
  return apiRequest(`/staff/tickets/${id}/reply`, {
    method: "POST",
    body: JSON.stringify({ content, setStatus }),
  });
}

export function staffCloseTicket(id: string) {
  return apiRequest(`/staff/tickets/${id}/close`, { method: "POST", body: "{}" });
}

// ─── Orders ──────────────────────────────────────────────────────────────────

export function listAdminOrders(params: ListParams = {}) {
  return apiRequest<PaginatedResponse<Record<string, unknown>>>(
    `/admin/orders${buildQuery(params)}`
  );
}

export function getAdminOrder(id: string) {
  return apiRequest<Record<string, unknown>>(`/admin/orders/${id}`);
}

export function updateAdminOrderStatus(id: string, status: string) {
  return apiRequest(`/admin/orders/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

// ─── Provisioning / Servers ──────────────────────────────────────────────────

export function getProvisioningSummary() {
  return apiRequest<{
    servers: number;
    activeServers: number;
    pendingJobs: number;
    failedJobs: number;
  }>("/admin/provisioning/summary");
}

export function listProvisioningServers(params: ListParams = {}) {
  return apiRequest<PaginatedResponse<Record<string, unknown>>>(
    `/admin/provisioning/servers${buildQuery(params)}`
  );
}

export function listProvisioningJobs(params: ListParams = {}) {
  return apiRequest<PaginatedResponse<Record<string, unknown>>>(
    `/admin/provisioning/jobs${buildQuery(params)}`
  );
}

// ─── Reports ─────────────────────────────────────────────────────────────────

export function getReportsOverview(params: { from?: string; to?: string } = {}) {
  return apiRequest<{
    period: { from: string; to: string };
    metrics: Record<string, number>;
  }>(`/admin/reports/overview${buildQuery(params)}`);
}

export function getRevenueReport(params: { from?: string; to?: string; groupBy?: string } = {}) {
  return apiRequest<Record<string, unknown>>(`/admin/reports/revenue${buildQuery(params)}`);
}

export function getServicesReport(params: { from?: string; to?: string } = {}) {
  return apiRequest<Record<string, unknown>>(`/admin/reports/services${buildQuery(params)}`);
}

export function getClientsReport(params: { from?: string; to?: string } = {}) {
  return apiRequest<Record<string, unknown>>(`/admin/reports/clients${buildQuery(params)}`);
}

// ─── Staff management ────────────────────────────────────────────────────────

export function getStaffSummary() {
  return apiRequest<Record<string, unknown>>("/admin/staff/summary");
}

export function listStaff(params: ListParams = {}) {
  return apiRequest<PaginatedResponse<Record<string, unknown>>>(
    `/admin/staff${buildQuery(params)}`
  );
}

export function createStaff(body: Record<string, unknown>) {
  return apiRequest("/admin/staff", { method: "POST", body: JSON.stringify(body) });
}

export function updateStaffStatus(id: string, status: string) {
  return apiRequest(`/admin/staff/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

// ─── Settings ────────────────────────────────────────────────────────────────

export function getAdminSettings() {
  return apiRequest<Record<string, unknown>>("/admin/settings");
}

export function updateAdminSettings(body: Record<string, unknown>) {
  return apiRequest("/admin/settings", {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export function getIntegrationsStatus() {
  return apiRequest<Record<string, unknown>>("/admin/settings/integrations");
}

// ─── Account (client) ────────────────────────────────────────────────────────

export function getAccountProfile() {
  return apiRequest<Record<string, unknown>>("/account/profile");
}

export function updateAccountProfile(body: Record<string, unknown>) {
  return apiRequest("/account/profile", { method: "PUT", body: JSON.stringify(body) });
}

export function getAccountSecurity() {
  return apiRequest<Record<string, unknown>>("/account/security");
}

export function changePassword(currentPassword: string, newPassword: string, confirmPassword: string) {
  return apiRequest("/account/change-password", {
    method: "POST",
    body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
  });
}

export function getEmailPreferences() {
  return apiRequest<Record<string, unknown>>("/account/profile").then((p) => p);
}

export function updateEmailPreferences(body: Record<string, unknown>) {
  return apiRequest("/account/email-preferences", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function getSecuritySessions() {
  return apiRequest<Record<string, unknown>[]>("/security/sessions");
}

export function revokeSession(id: string) {
  return apiRequest(`/security/sessions/${id}`, { method: "DELETE" });
}

// ─── Notes ───────────────────────────────────────────────────────────────────

export function listNotes(params: ListParams = {}) {
  return apiRequest<PaginatedResponse<Record<string, unknown>>>(
    `/notes${buildQuery(params)}`
  );
}

export function getNotesSummary() {
  return apiRequest<Record<string, unknown>>("/notes/summary");
}

export function createNote(body: Record<string, unknown>) {
  return apiRequest("/notes", { method: "POST", body: JSON.stringify(body) });
}

export function deleteNote(id: string) {
  return apiRequest(`/notes/${id}`, { method: "DELETE" });
}

// ─── KYC (client) ────────────────────────────────────────────────────────────

export function getKycStatus() {
  return apiRequest<Record<string, unknown>>("/kyc");
}
