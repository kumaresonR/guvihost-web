import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { DataTable } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { PageLoader, PageError } from "@/components/PageLoader";
import { listProvisioningJobs } from "@/lib/api";
import { formatDateTime, formatEnumLabel } from "@/lib/format";
import { useIsStaff } from "@/hooks/use-role";
import { Zap, Clock, Play, CheckCircle, AlertTriangle } from "lucide-react";
import { GuvihostApiError } from "@/lib/guvihost-api";

const PER_PAGE = 10;

type JobRow = Record<string, unknown> & { id: string };

export default function AutomationPage() {
  const isStaff = useIsStaff();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["automation-jobs", page, statusFilter, typeFilter],
    queryFn: () =>
      listProvisioningJobs({
        page,
        limit: PER_PAGE,
        status: statusFilter || undefined,
        type: typeFilter || undefined,
      }),
    enabled: isStaff,
  });

  if (!isStaff) {
    return <PageError message="You must be signed in as staff to view automation jobs." />;
  }
  if (isLoading) return <PageLoader message="Loading automation jobs..." />;
  if (isError) {
    return (
      <PageError
        message={error instanceof GuvihostApiError ? error.message : "Failed to load automation jobs."}
      />
    );
  }

  const items = (data?.items ?? []) as JobRow[];
  const pagination = data?.pagination ?? { page: 1, limit: PER_PAGE, total: 0, totalPages: 1 };

  const queued = items.filter((j) => String(j.status) === "QUEUED").length;
  const running = items.filter((j) => String(j.status) === "RUNNING").length;
  const success = items.filter((j) => String(j.status) === "SUCCESS").length;
  const failed = items.filter((j) => String(j.status) === "FAILED").length;

  const columns = [
    {
      key: "type",
      label: "Automation Job",
      render: (row: JobRow) => (
        <div>
          <p className="font-semibold text-slate-800">{formatEnumLabel(String(row.type ?? "—"))}</p>
          <p className="text-xs text-slate-500 font-mono">{String(row.id).slice(0, 10)}</p>
        </div>
      ),
    },
    {
      key: "server",
      label: "Target Server",
      render: (row: JobRow) => {
        const server = row.server as { name?: string; provider?: string } | undefined;
        return (
          <div>
            <p className="text-sm text-slate-700">{server?.name ?? "—"}</p>
            <p className="text-xs text-slate-500">
              {server?.provider ? formatEnumLabel(server.provider) : ""}
            </p>
          </div>
        );
      },
    },
    {
      key: "service",
      label: "Service",
      render: (row: JobRow) => {
        const service = row.service as { accountCode?: string; name?: string; type?: string } | undefined;
        return (
          <div>
            <p className="text-sm text-slate-700">{service?.accountCode ?? service?.name ?? "—"}</p>
            <p className="text-xs text-slate-500">
              {service?.type ? formatEnumLabel(service.type) : ""}
            </p>
          </div>
        );
      },
    },
    {
      key: "order",
      label: "Order",
      render: (row: JobRow) => {
        const order = row.order as { orderNumber?: string } | undefined;
        return (
          <span className="text-xs font-mono text-slate-600">{order?.orderNumber ?? "—"}</span>
        );
      },
    },
    {
      key: "status",
      label: "Status",
      render: (row: JobRow) => <StatusBadge status={String(row.status ?? "").toLowerCase()} />,
    },
    {
      key: "startedAt",
      label: "Started",
      render: (row: JobRow) => (
        <span className="text-xs text-slate-500">{formatDateTime(String(row.startedAt ?? ""))}</span>
      ),
    },
    {
      key: "finishedAt",
      label: "Finished",
      render: (row: JobRow) => (
        <span className="text-xs text-slate-500">{formatDateTime(String(row.finishedAt ?? ""))}</span>
      ),
    },
    {
      key: "errorMessage",
      label: "Details",
      render: (row: JobRow) => (
        <span className="text-xs text-slate-600 truncate max-w-[200px] block">
          {String(row.errorMessage ?? row.providerRef ?? "—")}
        </span>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="max-w-[1600px] mx-auto space-y-6 pb-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h1 className="text-[22px] font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Zap className="h-6 w-6 text-blue-600" />
            Automation Jobs
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Provisioning and lifecycle automation queue — provision, suspend, rebuild, and sync jobs.
          </p>
        </div>

        <DataTable
          columns={columns}
          data={items}
          total={pagination.total}
          page={pagination.page}
          perPage={pagination.limit}
          totalPages={pagination.totalPages}
          onPageChange={setPage}
          searchPlaceholder="Search jobs..."
          showDateFilter={false}
          filters={[
            {
              key: "status",
              label: "Status",
              options: [
                { value: "QUEUED", label: "Queued" },
                { value: "RUNNING", label: "Running" },
                { value: "SUCCESS", label: "Success" },
                { value: "FAILED", label: "Failed" },
                { value: "CANCELLED", label: "Cancelled" },
              ],
            },
            {
              key: "type",
              label: "Type",
              options: [
                { value: "PROVISION", label: "Provision" },
                { value: "SUSPEND", label: "Suspend" },
                { value: "UNSUSPEND", label: "Unsuspend" },
                { value: "TERMINATE", label: "Terminate" },
                { value: "REBOOT", label: "Reboot" },
                { value: "REBUILD", label: "Rebuild" },
                { value: "SYNC", label: "Sync" },
              ],
            },
          ]}
          onFilterChange={(key, val) => {
            if (key === "status") setStatusFilter(val);
            if (key === "type") setTypeFilter(val);
            setPage(1);
          }}
          summaryWidgets={[
            {
              label: "Total Jobs",
              value: pagination.total,
              icon: <Zap className="h-4 w-4 text-blue-600" />,
              color: "bg-blue-50",
            },
            {
              label: "Queued (page)",
              value: queued,
              icon: <Clock className="h-4 w-4 text-amber-600" />,
              color: "bg-amber-50",
            },
            {
              label: "Running (page)",
              value: running,
              icon: <Play className="h-4 w-4 text-indigo-600" />,
              color: "bg-indigo-50",
            },
            {
              label: "Success (page)",
              value: success,
              icon: <CheckCircle className="h-4 w-4 text-emerald-600" />,
              color: "bg-emerald-50",
            },
            {
              label: "Failed (page)",
              value: failed,
              icon: <AlertTriangle className="h-4 w-4 text-rose-600" />,
              color: "bg-rose-50",
            },
          ]}
        />
      </div>
    </AdminLayout>
  );
}
