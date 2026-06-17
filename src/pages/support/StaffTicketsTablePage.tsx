import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PageLoader, PageError } from "@/components/PageLoader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Eye } from "lucide-react";
import { getStaffTicketSummary, listStaffTickets } from "@/lib/api/index";
import { formatEnumLabel } from "@/lib/format";
import {
  mapFilterStatus,
  priorityBadgeClass,
  ticketServiceLabel,
  ticketStatusBadgeClass,
  ticketStatusLabel,
  ticketUpdatedAt,
  type StaffTicket,
} from "@/pages/support/ticket-utils";

type TicketsTableProps = {
  title: string;
  description: string;
  fixedStatus?: string;
  showNewTicket?: boolean;
};

export function StaffTicketsTablePage({
  title,
  description,
  fixedStatus,
  showNewTicket = false,
}: TicketsTableProps) {
  const [page] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const effectiveStatus = fixedStatus ?? mapFilterStatus(statusFilter);

  const summaryQuery = useQuery({
    queryKey: ["staffTicketSummary"],
    queryFn: getStaffTicketSummary,
  });

  const ticketsQuery = useQuery({
    queryKey: ["staffTickets", page, search, effectiveStatus, fixedStatus],
    queryFn: () =>
      listStaffTickets({
        page,
        limit: 50,
        search: search || undefined,
        status: effectiveStatus,
      }),
  });

  if (ticketsQuery.isLoading && !ticketsQuery.data) return <PageLoader message="Loading tickets..." />;
  if (ticketsQuery.isError) {
    return (
      <PageError message={ticketsQuery.error instanceof Error ? ticketsQuery.error.message : "Failed to load tickets"} />
    );
  }

  const tickets = (ticketsQuery.data?.items ?? []) as StaffTicket[];
  const stats = summaryQuery.data;

  return (
    <AdminLayout>
      <div className="p-6 bg-[#ffffff] min-h-full font-sans">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-xl font-bold text-[#0a1b3f]">{title}</h1>
            <p className="text-sm text-slate-500">{description}</p>
          </div>
          {showNewTicket && (
            <Button className="bg-blue-600 hover:bg-blue-700 h-10 px-6 gap-2">
              <Plus size={16} /> Open New Ticket
            </Button>
          )}
        </div>

        {!fixedStatus && stats && (
          <div className="grid grid-cols-5 gap-4 mb-6">
            <KPICard label="Total Tickets" val={String(stats.total)} color="text-slate-700" />
            <KPICard label="Open Tickets" val={String(stats.open)} color="text-emerald-600" />
            <KPICard label="In Progress" val={String(stats.inProgress)} color="text-amber-500" />
            <KPICard label="Resolved" val={String(stats.resolved)} color="text-purple-600" />
            <KPICard label="Closed" val={String(stats.closed)} color="text-rose-500" />
          </div>
        )}

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-6 flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-3 text-slate-400" size={16} />
            <Input
              placeholder="Search by Ticket ID, Subject or Customer..."
              className="pl-10 h-10 border-slate-200"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {!fixedStatus && (
            <select
              className="border border-slate-200 rounded-lg px-4 text-sm text-slate-600 bg-white h-10"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          )}
          <Button variant="outline" onClick={() => { setSearch(""); setStatusFilter("all"); }}>
            Reset
          </Button>
        </div>

        <Card className="rounded-2xl shadow-sm border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-bold">
                <tr>
                  <th className="p-4">Ticket ID</th>
                  <th className="p-4">Subject</th>
                  <th className="p-4">Service</th>
                  <th className="p-4">Department</th>
                  <th className="p-4">Priority</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Last Updated</th>
                  <th className="p-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tickets.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500">
                      No tickets found.
                    </td>
                  </tr>
                ) : (
                  tickets.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/50">
                      <td className="p-4 font-medium text-slate-800">{t.ticketNumber}</td>
                      <td className="p-4 text-blue-600 font-semibold">{t.subject}</td>
                      <td className="p-4 text-slate-600">{ticketServiceLabel(t)}</td>
                      <td className="p-4 text-slate-600">{t.department?.name ?? "—"}</td>
                      <td className="p-4">
                        <Badge className={`${priorityBadgeClass(t.priority)} border-0 text-[10px] font-bold px-2 py-0.5`}>
                          {formatEnumLabel(t.priority)}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Badge className={`${ticketStatusBadgeClass(t.status)} border-0 text-[10px] font-bold px-2 py-0.5`}>
                          {ticketStatusLabel(t.status)}
                        </Badge>
                      </td>
                      <td className="p-4 text-slate-500">{ticketUpdatedAt(t)}</td>
                      <td className="p-4 text-center">
                        <Button variant="ghost" size="sm" className="text-blue-600 text-xs" asChild>
                          <Link to={`/support/tickets/${t.id}`}>
                            <Eye size={14} className="mr-1" /> View
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}

function KPICard({ label, val, color }: { label: string; val: string; color: string }) {
  return (
    <Card className="p-4 rounded-2xl shadow-sm border-slate-100">
      <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{val}</p>
    </Card>
  );
}
