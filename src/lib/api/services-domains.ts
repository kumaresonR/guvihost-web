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

export function getService(id: string) {
  return apiRequest<Record<string, unknown>>(`/services/${id}`);
}

export function renewService(id: string) {
  return apiRequest(`/services/${id}/renew`, { method: "POST", body: "{}" });
}

export function cancelService(id: string, reason?: string) {
  return apiRequest(`/services/${id}/cancel`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export function setServiceAutoRenew(id: string, autoRenew: boolean) {
  return apiRequest(`/services/${id}/auto-renew`, {
    method: "PATCH",
    body: JSON.stringify({ autoRenew }),
  });
}

export function getCpanelLoginUrl(id: string) {
  return apiRequest<{ url: string }>(`/services/${id}/cpanel-login`);
}

export function getEmailServicesSummary() {
  return apiRequest<Record<string, unknown>>("/services/email/summary");
}

export function getVpsOsTemplates() {
  return apiRequest<Record<string, unknown>[]>("/services/vps/os-templates");
}

export function getVpsOverview(serviceId: string) {
  return apiRequest<Record<string, unknown>>(`/services/${serviceId}/vps/overview`);
}

export function vpsPowerAction(serviceId: string, action: "start" | "stop" | "reboot") {
  return apiRequest(`/services/${serviceId}/vps/power/${action}`, { method: "POST", body: "{}" });
}

export function vpsReinstall(serviceId: string, osTemplate: string) {
  return apiRequest(`/services/${serviceId}/vps/reinstall`, {
    method: "POST",
    body: JSON.stringify({ osTemplate, confirm: true }),
  });
}

export function listVpsSnapshots(serviceId: string) {
  return apiRequest<Record<string, unknown>[]>(`/services/${serviceId}/vps/snapshots`);
}

export function createVpsSnapshot(serviceId: string, name: string) {
  return apiRequest(`/services/${serviceId}/vps/snapshots`, {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export function restoreVpsSnapshot(serviceId: string, snapshotId: string) {
  return apiRequest(`/services/${serviceId}/vps/snapshots/${snapshotId}/restore`, {
    method: "POST",
    body: "{}",
  });
}

export function deleteVpsSnapshot(serviceId: string, snapshotId: string) {
  return apiRequest(`/services/${serviceId}/vps/snapshots/${snapshotId}`, { method: "DELETE" });
}

export function listVpsBackups(serviceId: string) {
  return apiRequest<Record<string, unknown>[]>(`/services/${serviceId}/vps/backups`);
}

export function createVpsBackup(serviceId: string) {
  return apiRequest(`/services/${serviceId}/vps/backups`, { method: "POST", body: "{}" });
}

export function restoreVpsBackup(serviceId: string, backupId: string) {
  return apiRequest(`/services/${serviceId}/vps/backups/${backupId}/restore`, {
    method: "POST",
    body: "{}",
  });
}

export function getVpsNetwork(serviceId: string) {
  return apiRequest<Record<string, unknown>>(`/services/${serviceId}/vps/network`);
}

export function updateVpsNetwork(serviceId: string, body: Record<string, unknown>) {
  return apiRequest(`/services/${serviceId}/vps/network`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function listVpsJobs(serviceId: string) {
  return apiRequest<Record<string, unknown>[]>(`/services/${serviceId}/vps/jobs`);
}

// Domains
export function getDomainPricing() {
  return apiRequest<Record<string, unknown>[]>("/domains/pricing");
}

export function checkDomainAvailability(query: string, extensions?: string[]) {
  return apiRequest<Record<string, unknown>>("/domains/check", {
    method: "POST",
    body: JSON.stringify({ query, extensions }),
  });
}

export function registerDomain(body: Record<string, unknown>) {
  return apiRequest("/domains/register", { method: "POST", body: JSON.stringify(body) });
}

export function transferDomain(body: Record<string, unknown>) {
  return apiRequest("/domains/transfer", { method: "POST", body: JSON.stringify(body) });
}

export function listDomainTransfers(params: ListParams = {}) {
  return apiRequest<PaginatedResponse<Record<string, unknown>>>(
    `/domains/transfers${buildQuery(params)}`
  );
}

export function getDomain(id: string) {
  return apiRequest<Record<string, unknown>>(`/domains/${id}`);
}

export function renewDomain(id: string) {
  return apiRequest(`/domains/${id}/renew`, { method: "POST", body: "{}" });
}

export function updateDomainNameservers(id: string, nameserver1: string, nameserver2: string) {
  return apiRequest(`/domains/${id}/nameservers`, {
    method: "PATCH",
    body: JSON.stringify({ nameserver1, nameserver2 }),
  });
}

export function setDomainAutoRenew(id: string, autoRenew: boolean) {
  return apiRequest(`/domains/${id}/auto-renew`, {
    method: "PATCH",
    body: JSON.stringify({ autoRenew }),
  });
}
