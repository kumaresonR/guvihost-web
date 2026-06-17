import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { DataTable } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { PageLoader, PageError } from "@/components/PageLoader";
import {
  getProvisioningSummary,
  listProvisioningServers,
  listProvisioningJobs,
  createProvisioningServer,
  runProvisioningJob,
} from "@/lib/api";
import { formatDate, formatDateTime, formatEnumLabel } from "@/lib/format";
import { useIsStaff } from "@/hooks/use-role";
import { Server, Activity, AlertTriangle, CheckCircle, ListTodo, Plus, Play } from "lucide-react";
import { GuvihostApiError } from "@/lib/guvihost-api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const PER_PAGE = 10;

type ServerRow = Record<string, unknown> & { id: string };
type JobRow = Record<string, unknown> & { id: string };

function MetricCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: typeof Server;
  color: string;
}) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-500">{label}</p>
        <p className="text-2xl font-bold text-slate-900">{value.toLocaleString()}</p>
      </div>
    </div>
  );
}

export default function ServersPage() {
  const isStaff = useIsStaff();
  const qc = useQueryClient();
  const [serverPage, setServerPage] = useState(1);
  const [jobPage, setJobPage] = useState(1);
  const [serverSearch, setServerSearch] = useState("");
  const [jobStatus, setJobStatus] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [serverForm, setServerForm] = useState({
    name: "",
    provider: "MANUAL",
    endpoint: "",
    location: "",
    maxSlots: "100",
    isActive: true,
  });

  const summaryQuery = useQuery({
    queryKey: ["provisioning-summary"],
    queryFn: getProvisioningSummary,
    enabled: isStaff,
  });

  const serversQuery = useQuery({
    queryKey: ["provisioning-servers", serverPage, serverSearch],
    queryFn: () =>
      listProvisioningServers({ page: serverPage, limit: PER_PAGE, search: serverSearch || undefined }),
    enabled: isStaff,
  });

  const jobsQuery = useQuery({
    queryKey: ["provisioning-jobs", jobPage, jobStatus],
    queryFn: () =>
      listProvisioningJobs({ page: jobPage, limit: PER_PAGE, status: jobStatus || undefined }),
    enabled: isStaff,
  });

  const createServerMutation = useMutation({
    mutationFn: () =>
      createProvisioningServer({
        name: serverForm.name,
        provider: serverForm.provider,
        endpoint: serverForm.endpoint || undefined,
        location: serverForm.location || undefined,
        maxSlots: parseInt(serverForm.maxSlots, 10) || 100,
        isActive: serverForm.isActive,
      }),
    onSuccess: () => {
      toast.success("Server created");
      setCreateOpen(false);
      qc.invalidateQueries({ queryKey: ["provisioning-servers"] });
      qc.invalidateQueries({ queryKey: ["provisioning-summary"] });
    },
    onError: (err) => {
      toast.error(err instanceof GuvihostApiError ? err.message : "Failed to create server");
    },
  });

  const runJobMutation = useMutation({
    mutationFn: (id: string) => runProvisioningJob(id),
    onSuccess: () => {
      toast.success("Job started");
      qc.invalidateQueries({ queryKey: ["provisioning-jobs"] });
      qc.invalidateQueries({ queryKey: ["provisioning-summary"] });
    },
    onError: (err) => {
      toast.error(err instanceof GuvihostApiError ? err.message : "Failed to run job");
    },
  });

  if (!isStaff) {
    return <PageError message="You must be signed in as staff to view provisioning servers." />;
  }

  const loading = summaryQuery.isLoading || serversQuery.isLoading;
  const error = summaryQuery.error ?? serversQuery.error;

  if (loading) return <PageLoader message="Loading servers..." />;
  if (error) {
    return (
      <PageError
        message={error instanceof GuvihostApiError ? error.message : "Failed to load server data."}
      />
    );
  }

  const summary = summaryQuery.data ?? { servers: 0, activeServers: 0, pendingJobs: 0, failedJobs: 0 };
  const serverItems = (serversQuery.data?.items ?? []) as ServerRow[];
  const serverPagination = serversQuery.data?.pagination ?? {
    page: 1,
    limit: PER_PAGE,
    total: 0,
    totalPages: 1,
  };
  const jobItems = (jobsQuery.data?.items ?? []) as JobRow[];
  const jobPagination = jobsQuery.data?.pagination ?? {
    page: 1,
    limit: PER_PAGE,
    total: 0,
    totalPages: 1,
  };

  const serverColumns = [
    {
      key: "name",
      label: "Server",
      render: (row: ServerRow) => (
        <div>
          <p className="font-semibold text-slate-800">{String(row.name ?? "—")}</p>
          <p className="text-xs text-slate-500">{String(row.endpoint ?? "No endpoint")}</p>
        </div>
      ),
    },
    {
      key: "provider",
      label: "Provider",
      render: (row: ServerRow) => (
        <span className="text-sm text-slate-600">{formatEnumLabel(String(row.provider ?? "—"))}</span>
      ),
    },
    {
      key: "location",
      label: "Location",
      render: (row: ServerRow) => <span className="text-sm text-slate-600">{String(row.location ?? "—")}</span>,
    },
    {
      key: "slots",
      label: "Slots",
      render: (row: ServerRow) => (
        <span className="text-sm font-medium text-slate-700">
          {Number(row.usedSlots ?? 0)} / {Number(row.maxSlots ?? 0)}
        </span>
      ),
    },
    {
      key: "isActive",
      label: "Status",
      render: (row: ServerRow) => (
        <StatusBadge status={row.isActive ? "active" : "inactive"} />
      ),
    },
    {
      key: "createdAt",
      label: "Added",
      render: (row: ServerRow) => (
        <span className="text-xs text-slate-500">{formatDate(String(row.createdAt ?? ""))}</span>
      ),
    },
  ];

  const jobColumns = [
    {
      key: "type",
      label: "Job",
      render: (row: JobRow) => (
        <div>
          <p className="font-medium text-slate-800">{formatEnumLabel(String(row.type ?? "—"))}</p>
          <p className="text-xs text-slate-500 font-mono">{row.id.slice(0, 8)}...</p>
        </div>
      ),
    },
    {
      key: "server",
      label: "Server",
      render: (row: JobRow) => {
        const server = row.server as { name?: string } | undefined;
        return <span className="text-sm text-slate-600">{server?.name ?? "—"}</span>;
      },
    },
    {
      key: "service",
      label: "Service",
      render: (row: JobRow) => {
        const service = row.service as { accountCode?: string; name?: string } | undefined;
        return (
          <span className="text-sm text-slate-600">
            {service?.accountCode ?? service?.name ?? "—"}
          </span>
        );
      },
    },
    {
      key: "status",
      label: "Status",
      render: (row: JobRow) => <StatusBadge status={String(row.status ?? "").toLowerCase()} />,
    },
    {
      key: "createdAt",
      label: "Queued",
      render: (row: JobRow) => (
        <span className="text-xs text-slate-500">{formatDateTime(String(row.createdAt ?? ""))}</span>
      ),
    },
    {
      key: "errorMessage",
      label: "Error",
      render: (row: JobRow) => (
        <span className="text-xs text-rose-600 truncate max-w-[180px] block">
          {String(row.errorMessage ?? "—")}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (row: JobRow) => {
        const status = String(row.status ?? "");
        if (status !== "QUEUED" && status !== "FAILED") return null;
        return (
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1"
            disabled={runJobMutation.isPending}
            onClick={(e) => {
              e.stopPropagation();
              runJobMutation.mutate(row.id);
            }}
          >
            <Play className="h-3 w-3" /> Run
          </Button>
        );
      },
    },
  ];

  return (
    <AdminLayout>
      <div className="max-w-[1600px] mx-auto space-y-6 pb-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-[22px] font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Server className="h-6 w-6 text-blue-600" />
              Provisioning Servers
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Monitor provisioning infrastructure, server capacity, and job queue.
            </p>
          </div>
          <Button className="gap-2" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" /> Add Server
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <MetricCard label="Total Servers" value={summary.servers} icon={Server} color="bg-blue-600" />
          <MetricCard label="Active Servers" value={summary.activeServers} icon={CheckCircle} color="bg-emerald-500" />
          <MetricCard label="Pending Jobs" value={summary.pendingJobs} icon={Activity} color="bg-amber-500" />
          <MetricCard label="Failed Jobs" value={summary.failedJobs} icon={AlertTriangle} color="bg-rose-500" />
        </div>

        <Tabs defaultValue="servers" className="space-y-4">
          <TabsList className="bg-white border border-slate-100 rounded-xl p-1">
            <TabsTrigger value="servers" className="rounded-lg">
              Servers
            </TabsTrigger>
            <TabsTrigger value="jobs" className="rounded-lg">
              Provisioning Jobs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="servers">
            <DataTable
              columns={serverColumns}
              data={serverItems}
              total={serverPagination.total}
              page={serverPagination.page}
              perPage={serverPagination.limit}
              totalPages={serverPagination.totalPages}
              onPageChange={setServerPage}
              searchPlaceholder="Search servers..."
              onSearch={(q) => {
                setServerSearch(q);
                setServerPage(1);
              }}
              showDateFilter={false}
            />
          </TabsContent>

          <TabsContent value="jobs">
            {jobsQuery.isLoading ? (
              <PageLoader message="Loading jobs..." />
            ) : (
              <DataTable
                columns={jobColumns}
                data={jobItems}
                total={jobPagination.total}
                page={jobPagination.page}
                perPage={jobPagination.limit}
                totalPages={jobPagination.totalPages}
                onPageChange={setJobPage}
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
                ]}
                onFilterChange={(_key, val) => {
                  setJobStatus(val);
                  setJobPage(1);
                }}
                summaryWidgets={[
                  {
                    label: "Total Jobs",
                    value: jobPagination.total,
                    icon: <ListTodo className="h-4 w-4 text-blue-600" />,
                    color: "bg-blue-50",
                  },
                ]}
              />
            )}
          </TabsContent>
        </Tabs>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Provisioning Server</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Name</Label>
                <Input
                  value={serverForm.name}
                  onChange={(e) => setServerForm((f) => ({ ...f, name: e.target.value }))}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Provider</Label>
                <select
                  value={serverForm.provider}
                  onChange={(e) => setServerForm((f) => ({ ...f, provider: e.target.value }))}
                  className="mt-1.5 w-full h-10 rounded-md border border-slate-200 px-3 text-sm bg-white"
                >
                  <option value="MANUAL">Manual</option>
                  <option value="CPANEL">cPanel</option>
                  <option value="PLESK">Plesk</option>
                  <option value="CUSTOM">Custom</option>
                </select>
              </div>
              <div>
                <Label>Endpoint URL</Label>
                <Input
                  value={serverForm.endpoint}
                  onChange={(e) => setServerForm((f) => ({ ...f, endpoint: e.target.value }))}
                  placeholder="https://..."
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Location</Label>
                <Input
                  value={serverForm.location}
                  onChange={(e) => setServerForm((f) => ({ ...f, location: e.target.value }))}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Max Slots</Label>
                <Input
                  type="number"
                  value={serverForm.maxSlots}
                  onChange={(e) => setServerForm((f) => ({ ...f, maxSlots: e.target.value }))}
                  className="mt-1.5"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button
                disabled={createServerMutation.isPending || !serverForm.name}
                onClick={() => createServerMutation.mutate()}
              >
                {createServerMutation.isPending ? "Creating..." : "Create Server"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
