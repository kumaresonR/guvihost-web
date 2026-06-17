import { formatDateTime, formatEnumLabel, userDisplayName } from "@/lib/format";

export type StaffTicket = {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  priority: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  user?: { firstName?: string | null; lastName?: string | null; email?: string; phone?: string | null };
  assignedTo?: { firstName?: string | null; lastName?: string | null; email?: string } | null;
  department?: { name: string } | null;
  category?: { name: string } | null;
  service?: { name: string; domain?: string | null; type?: string } | null;
};

export function mapFilterStatus(value: string): string | undefined {
  if (!value || value === "all") return undefined;
  const map: Record<string, string> = {
    open: "OPEN",
    in_progress: "IN_PROGRESS",
    resolved: "RESOLVED",
    closed: "CLOSED",
  };
  return map[value] ?? value.toUpperCase();
}

export function ticketStatusLabel(status: string): string {
  return formatEnumLabel(status);
}

export function ticketStatusBadgeKey(status: string): string {
  return status.toLowerCase();
}

export function ticketCustomerName(ticket: StaffTicket): string {
  return userDisplayName(ticket.user);
}

export function ticketAssigneeName(ticket: StaffTicket): string {
  return ticket.assignedTo ? userDisplayName(ticket.assignedTo) : "Unassigned";
}

export function ticketServiceLabel(ticket: StaffTicket): string {
  if (!ticket.service) return "—";
  return ticket.service.domain ? `${ticket.service.name} — ${ticket.service.domain}` : ticket.service.name;
}

export function ticketUpdatedAt(ticket: StaffTicket): string {
  return formatDateTime(ticket.updatedAt);
}

export function priorityBadgeClass(priority: string): string {
  const p = priority.toUpperCase();
  if (p === "EMERGENCY" || p === "HIGH") return "bg-destructive/10 text-destructive";
  if (p === "MEDIUM") return "bg-warning/10 text-warning";
  return "bg-muted text-muted-foreground";
}

export function ticketStatusBadgeClass(status: string): string {
  const s = status.toUpperCase();
  if (s === "OPEN") return "bg-emerald-50 text-emerald-600";
  if (s === "IN_PROGRESS") return "bg-blue-50 text-blue-600";
  if (s === "RESOLVED") return "bg-purple-50 text-purple-600";
  if (s === "CLOSED") return "bg-slate-100 text-slate-600";
  return "bg-muted text-muted-foreground";
}
