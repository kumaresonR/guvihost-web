import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { DataTable } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { PageLoader, PageError } from "@/components/PageLoader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  getStaffTicketSummary,
  listStaffTickets,
  staffReplyTicket,
  updateStaffTicket,
} from "@/lib/api/index";
import { toast } from "sonner";
import { Headphones, MessageSquare, Clock, CheckCircle } from "lucide-react";
import {
  mapFilterStatus,
  priorityBadgeClass,
  ticketAssigneeName,
  ticketCustomerName,
  ticketStatusBadgeKey,
  type StaffTicket,
} from "@/pages/support/ticket-utils";
import { formatDateTime, formatEnumLabel } from "@/lib/format";

const STATUS_OPTIONS = [
  { label: "Open", value: "OPEN" },
  { label: "In Progress", value: "IN_PROGRESS" },
  { label: "Resolved", value: "RESOLVED" },
  { label: "Closed", value: "CLOSED" },
];

export default function SupportTicketsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<StaffTicket | null>(null);
  const [resolution, setResolution] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const listQuery = useQuery({
    queryKey: ["staffTickets", page, search, filterStatus],
    queryFn: () =>
      listStaffTickets({
        page,
        limit: 10,
        search: search || undefined,
        status: mapFilterStatus(filterStatus),
      }),
  });

  const summaryQuery = useQuery({
    queryKey: ["staffTicketSummary"],
    queryFn: getStaffTicketSummary,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      if (notes?.trim()) {
        await staffReplyTicket(id, notes.trim(), status);
      } else {
        await updateStaffTicket(id, { status });
      }
    },
    onSuccess: () => {
      toast.success("Ticket updated");
      setSelected(null);
      setResolution("");
      queryClient.invalidateQueries({ queryKey: ["staffTickets"] });
      queryClient.invalidateQueries({ queryKey: ["staffTicketSummary"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (listQuery.isLoading && !listQuery.data) return <PageLoader message="Loading tickets..." />;
  if (listQuery.isError) {
    return <PageError message={listQuery.error instanceof Error ? listQuery.error.message : "Failed to load tickets"} />;
  }

  const tickets = (listQuery.data?.items ?? []) as StaffTicket[];
  const pagination = listQuery.data?.pagination;
  const stats = summaryQuery.data;

  const columns = [
    {
      key: "ticketNumber",
      label: "Ticket ID",
      render: (row: StaffTicket) => <span className="font-mono text-xs">{row.ticketNumber}</span>,
    },
    { key: "subject", label: "Subject" },
    {
      key: "customer",
      label: "Customer",
      render: (row: StaffTicket) => ticketCustomerName(row),
    },
    {
      key: "category",
      label: "Category",
      render: (row: StaffTicket) => (
        <Badge variant="outline" className="text-xs">
          {row.category?.name ?? "—"}
        </Badge>
      ),
    },
    {
      key: "priority",
      label: "Priority",
      render: (row: StaffTicket) => (
        <Badge className={`text-[10px] border-0 ${priorityBadgeClass(row.priority)}`}>
          {formatEnumLabel(row.priority)}
        </Badge>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (row: StaffTicket) => <StatusBadge status={ticketStatusBadgeKey(row.status)} />,
    },
    {
      key: "assignedTo",
      label: "Assigned To",
      render: (row: StaffTicket) => ticketAssigneeName(row),
    },
    {
      key: "createdAt",
      label: "Created",
      render: (row: StaffTicket) => formatDateTime(row.createdAt),
    },
  ];

  return (
    <AdminLayout>
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2">
          <Headphones className="h-6 w-6" /> Support Tickets
        </h1>
        <p className="page-description">Manage customer support tickets and call center resolutions</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="stat-card bg-card">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="text-xl font-bold">{stats?.total ?? pagination?.total ?? 0}</p>
        </div>
        <div className="stat-card bg-card">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" /> Open
          </p>
          <p className="text-xl font-bold text-warning">{stats?.open ?? 0}</p>
        </div>
        <div className="stat-card bg-card">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <MessageSquare className="h-3 w-3" /> In Progress
          </p>
          <p className="text-xl font-bold text-info">{stats?.inProgress ?? 0}</p>
        </div>
        <div className="stat-card bg-card">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <CheckCircle className="h-3 w-3" /> Resolved
          </p>
          <p className="text-xl font-bold text-success">{stats?.resolved ?? 0}</p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={tickets}
        total={pagination?.total ?? 0}
        page={page}
        perPage={10}
        totalPages={pagination?.totalPages ?? 1}
        onPageChange={setPage}
        searchPlaceholder="Search tickets..."
        onSearch={setSearch}
        filters={[
          {
            key: "status",
            label: "Status",
            options: [
              { label: "All", value: "all" },
              { label: "Open", value: "open" },
              { label: "In Progress", value: "in_progress" },
              { label: "Resolved", value: "resolved" },
              { label: "Closed", value: "closed" },
            ],
          },
        ]}
        onFilterChange={(_key, val) => {
          setFilterStatus(val);
          setPage(1);
        }}
        showDateFilter={false}
        onRowClick={(ticket) => {
          setSelected(ticket);
          setNewStatus(ticket.status);
          setResolution("");
        }}
      />

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Headphones className="h-5 w-5" /> Ticket: {selected?.ticketNumber}
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <Label className="text-muted-foreground text-xs">Customer</Label>
                  <p className="font-medium">{ticketCustomerName(selected)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Priority</Label>
                  <p className="font-medium">{formatEnumLabel(selected.priority)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Category</Label>
                  <p className="font-medium">{selected.category?.name ?? "—"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Phone</Label>
                  <p className="font-medium">{selected.user?.phone ?? "—"}</p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Subject</Label>
                <p className="text-sm font-medium">{selected.subject}</p>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Description</Label>
                <p className="text-sm text-muted-foreground">{selected.description}</p>
              </div>
              <Separator />
              <div>
                <Label className="text-xs">Update Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Resolution Notes</Label>
                <Textarea
                  placeholder="Enter resolution details, actions taken, customer feedback..."
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  className="mt-1"
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>
              Cancel
            </Button>
            <Button
              disabled={updateMutation.isPending}
              onClick={() => {
                if (!selected) return;
                if (!newStatus) {
                  toast.error("Please select a status");
                  return;
                }
                updateMutation.mutate({ id: selected.id, status: newStatus, notes: resolution });
              }}
            >
              Update Ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
