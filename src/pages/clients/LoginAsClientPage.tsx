import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { DataTable } from "@/components/admin/DataTable";
import { PageError, PageLoader } from "@/components/PageLoader";
import { Button } from "@/components/ui/button";
import { impersonateClient, listClients } from "@/lib/api";
import { formatDate, initials, userDisplayName } from "@/lib/format";
import { setAccessToken } from "@/lib/guvihost-api";
import { LogIn } from "lucide-react";

export default function LoginAsClientPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["clients-impersonate", page, search],
    queryFn: () => listClients({ page, limit: 10, search: search || undefined, status: "ACTIVE" }),
  });

  const impersonateMutation = useMutation({
    mutationFn: (clientId: string) => impersonateClient(clientId),
    onSuccess: (result) => {
      setAccessToken(result.accessToken);
      toast.success("Logged in as client");
      navigate("/client-dashboard");
      window.location.reload();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <PageLoader />;
  if (isError || !data) return <PageError message={error instanceof Error ? error.message : "Failed to load clients"} />;

  const items = data.items as Record<string, unknown>[];

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Login as Client</h1>
          <p className="text-sm text-slate-500">Impersonate a client account for support purposes.</p>
        </div>

        <DataTable
          columns={[
            {
              key: "client",
              label: "Client",
              render: (row: Record<string, unknown>) => {
                const name = userDisplayName(row as { firstName?: string; lastName?: string; email?: string });
                return (
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-600">
                      {initials(name)}
                    </div>
                    <div>
                      <p className="font-medium">{name}</p>
                      <p className="text-xs text-slate-500">{String(row.clientCode ?? "")}</p>
                    </div>
                  </div>
                );
              },
            },
            { key: "email", label: "Email", render: (r) => String(r.email ?? "") },
            { key: "company", label: "Company", render: (r) => String(r.company ?? "—") },
            {
              key: "joined",
              label: "Joined",
              render: (r) => formatDate(String(r.createdAt ?? "")),
            },
            {
              key: "action",
              label: "Action",
              render: (r) => (
                <Button
                  size="sm"
                  className="gap-1 bg-blue-600"
                  disabled={impersonateMutation.isPending}
                  onClick={(e) => {
                    e.stopPropagation();
                    impersonateMutation.mutate(String(r.id));
                  }}
                >
                  <LogIn className="h-3 w-3" /> Login
                </Button>
              ),
            },
          ]}
          data={items}
          total={data.pagination.total}
          page={page}
          perPage={10}
          totalPages={data.pagination.totalPages}
          onPageChange={setPage}
          onSearch={setSearch}
          searchPlaceholder="Search clients..."
        />
      </div>
    </AdminLayout>
  );
}
