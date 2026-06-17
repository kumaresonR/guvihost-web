import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { DataTable } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { PageLoader, PageError } from "@/components/PageLoader";
import { getStaffSummary, listStaff } from "@/lib/api";
import { formatDate, formatEnumLabel, initials, userDisplayName } from "@/lib/format";
import { useIsStaff } from "@/hooks/use-role";
import { Users, Shield, Headphones, UserCheck, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GuvihostApiError } from "@/lib/guvihost-api";

const PER_PAGE = 10;

type StaffRow = Record<string, unknown> & { id: string };

function SummaryCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number | string;
  icon: typeof Users;
  color: string;
}) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-500">{label}</p>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
      </div>
    </div>
  );
}

export default function StaffManagementPage() {
  const isStaff = useIsStaff();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const summaryQuery = useQuery({
    queryKey: ["staff-summary"],
    queryFn: getStaffSummary,
    enabled: isStaff,
  });

  const staffQuery = useQuery({
    queryKey: ["staff-list", page, search, roleFilter, statusFilter],
    queryFn: () =>
      listStaff({
        page,
        limit: PER_PAGE,
        search: search || undefined,
        status: statusFilter || undefined,
        ...(roleFilter ? { role: roleFilter } : {}),
      } as Parameters<typeof listStaff>[0]),
    enabled: isStaff,
  });

  if (!isStaff) {
    return <PageError message="You must be signed in as staff to manage staff accounts." />;
  }

  const loading = summaryQuery.isLoading || staffQuery.isLoading;
  const error = summaryQuery.error ?? staffQuery.error;

  if (loading) return <PageLoader message="Loading staff..." />;
  if (error) {
    return (
      <PageError
        message={error instanceof GuvihostApiError ? error.message : "Failed to load staff data."}
      />
    );
  }

  const summary = summaryQuery.data as Record<string, unknown> | undefined;
  const byRole = Array.isArray(summary?.byRole)
    ? (summary.byRole as { role: string; count: number }[])
    : [];
  const byStatus = Array.isArray(summary?.byStatus)
    ? (summary.byStatus as { status: string; count: number }[])
    : [];
  const totalStaff = Number(summary?.total ?? 0);
  const openTickets = Number(summary?.openAssignedTickets ?? 0);

  const items = (staffQuery.data?.items ?? []) as StaffRow[];
  const pagination = staffQuery.data?.pagination ?? {
    page: 1,
    limit: PER_PAGE,
    total: 0,
    totalPages: 1,
  };

  const columns = [
    {
      key: "name",
      label: "Staff Member",
      render: (row: StaffRow) => {
        const name = userDisplayName(row as { firstName?: string; lastName?: string; email?: string });
        return (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 font-bold flex items-center justify-center text-sm">
              {initials(name)}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">{name}</p>
              <p className="text-xs text-slate-500">{String(row.email ?? "—")}</p>
            </div>
          </div>
        );
      },
    },
    {
      key: "role",
      label: "Role",
      render: (row: StaffRow) => (
        <span className="text-sm font-medium text-slate-700">{formatEnumLabel(String(row.role ?? "—"))}</span>
      ),
    },
    {
      key: "department",
      label: "Department",
      render: (row: StaffRow) => {
        const profile = row.staffProfile as { department?: string; employeeCode?: string } | null;
        return (
          <div>
            <p className="text-sm text-slate-700">{profile?.department ?? "—"}</p>
            <p className="text-xs text-slate-500">{profile?.employeeCode ?? ""}</p>
          </div>
        );
      },
    },
    {
      key: "tickets",
      label: "Open Tickets",
      render: (row: StaffRow) => {
        const count = row._count as { assignedTickets?: number } | undefined;
        return <span className="text-sm font-medium text-slate-700">{count?.assignedTickets ?? 0}</span>;
      },
    },
    {
      key: "status",
      label: "Status",
      render: (row: StaffRow) => <StatusBadge status={String(row.status ?? "").toLowerCase()} />,
    },
    {
      key: "lastLoginAt",
      label: "Last Login",
      render: (row: StaffRow) => (
        <span className="text-xs text-slate-500">{formatDate(String(row.lastLoginAt ?? ""))}</span>
      ),
    },
    {
      key: "createdAt",
      label: "Joined",
      render: (row: StaffRow) => (
        <span className="text-xs text-slate-500">{formatDate(String(row.createdAt ?? ""))}</span>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="max-w-[1600px] mx-auto space-y-6 pb-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-[22px] font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Users className="h-6 w-6 text-blue-600" />
              Staff Management
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              View staff accounts, roles, and support workload.
            </p>
          </div>
          <Button asChild className="gap-2">
            <Link to="/staff/new">
              <Plus className="h-4 w-4" /> Add Staff
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <SummaryCard label="Total Staff" value={totalStaff} icon={Users} color="bg-blue-600" />
          <SummaryCard label="Open Assigned Tickets" value={openTickets} icon={Headphones} color="bg-amber-500" />
          <SummaryCard
            label="Admins"
            value={byRole.find((r) => r.role === "ADMIN" || r.role === "SUPER_ADMIN")?.count ?? 0}
            icon={Shield}
            color="bg-indigo-500"
          />
          <SummaryCard
            label="Active"
            value={byStatus.find((r) => r.status === "ACTIVE")?.count ?? 0}
            icon={UserCheck}
            color="bg-emerald-500"
          />
        </div>

        <DataTable
          columns={columns}
          data={items}
          total={pagination.total}
          page={pagination.page}
          perPage={pagination.limit}
          totalPages={pagination.totalPages}
          onPageChange={setPage}
          onRowClick={(row) => navigate(`/staff/${row.id}`)}
          searchPlaceholder="Search by name, email, or employee code..."
          onSearch={(q) => {
            setSearch(q);
            setPage(1);
          }}
          showDateFilter={false}
          filters={[
            {
              key: "role",
              label: "Role",
              options: [
                { value: "SUPPORT_AGENT", label: "Support Agent" },
                { value: "ADMIN", label: "Admin" },
                { value: "SUPER_ADMIN", label: "Super Admin" },
              ],
            },
            {
              key: "status",
              label: "Status",
              options: [
                { value: "ACTIVE", label: "Active" },
                { value: "INACTIVE", label: "Inactive" },
                { value: "SUSPENDED", label: "Suspended" },
              ],
            },
          ]}
          onFilterChange={(key, val) => {
            if (key === "role") setRoleFilter(val);
            if (key === "status") setStatusFilter(val);
            setPage(1);
          }}
        />
      </div>
    </AdminLayout>
  );
}
