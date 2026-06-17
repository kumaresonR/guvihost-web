import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { DataTable } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { PageLoader, PageError } from "@/components/PageLoader";
import { listAdminOrders, updateAdminOrderStatus } from "@/lib/api";
import { formatCurrency, formatDate, formatEnumLabel, userDisplayName } from "@/lib/format";
import { useAuth } from "@/lib/auth";
import { useIsStaff } from "@/hooks/use-role";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShoppingCart, Clock, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { GuvihostApiError } from "@/lib/guvihost-api";

const PER_PAGE = 10;
const ORDER_STATUSES = ["PENDING", "PROCESSING", "COMPLETED", "CANCELLED", "FAILED"] as const;

type OrderRow = Record<string, unknown> & { id: string };

function asUser(value: unknown) {
  return (value ?? {}) as { firstName?: string; lastName?: string; email?: string };
}

function asItems(value: unknown) {
  return Array.isArray(value) ? (value as { productName?: string }[]) : [];
}

export default function OrdersPage() {
  const { user } = useAuth();
  const isStaff = useIsStaff();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin-orders", page, search, statusFilter],
    queryFn: () =>
      listAdminOrders({
        page,
        limit: PER_PAGE,
        search: search || undefined,
        status: statusFilter || undefined,
      }),
    enabled: isStaff,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateAdminOrderStatus(id, status),
    onSuccess: () => {
      toast.success("Order status updated");
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
    },
    onError: (err) => {
      toast.error(err instanceof GuvihostApiError ? err.message : "Failed to update order");
    },
  });

  if (!isStaff) {
    return <PageError message="You must be signed in as staff to view orders." />;
  }
  if (isLoading) return <PageLoader message="Loading orders..." />;
  if (isError) {
    return (
      <PageError
        message={error instanceof GuvihostApiError ? error.message : "Failed to load orders."}
      />
    );
  }

  const items = (data?.items ?? []) as OrderRow[];
  const pagination = data?.pagination ?? { page: 1, limit: PER_PAGE, total: 0, totalPages: 1 };
  const pending = items.filter((o) => String(o.status) === "PENDING").length;
  const processing = items.filter((o) => String(o.status) === "PROCESSING").length;
  const completed = items.filter((o) => String(o.status) === "COMPLETED").length;

  const columns = [
    {
      key: "orderNumber",
      label: "Order",
      render: (row: OrderRow) => (
        <span className="font-mono text-xs font-semibold text-slate-800">
          {String(row.orderNumber ?? row.id)}
        </span>
      ),
    },
    {
      key: "customer",
      label: "Customer",
      render: (row: OrderRow) => (
        <div>
          <p className="text-sm font-medium text-slate-800">{userDisplayName(asUser(row.user))}</p>
          <p className="text-xs text-slate-500">{asUser(row.user).email ?? "—"}</p>
        </div>
      ),
    },
    {
      key: "products",
      label: "Products",
      render: (row: OrderRow) => (
        <span className="text-sm text-slate-600">
          {asItems(row.items)
            .map((i) => i.productName)
            .filter(Boolean)
            .join(", ") || "—"}
        </span>
      ),
    },
    {
      key: "total",
      label: "Total",
      render: (row: OrderRow) => (
        <span className="font-semibold text-slate-800">{formatCurrency(Number(row.total ?? 0))}</span>
      ),
    },
    {
      key: "paymentMethod",
      label: "Payment",
      render: (row: OrderRow) => (
        <span className="text-xs text-slate-600">{formatEnumLabel(String(row.paymentMethod ?? "—"))}</span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (row: OrderRow) => <StatusBadge status={String(row.status ?? "").toLowerCase()} />,
    },
    {
      key: "createdAt",
      label: "Date",
      render: (row: OrderRow) => (
        <span className="text-xs text-slate-500">{formatDate(String(row.createdAt ?? ""))}</span>
      ),
    },
    {
      key: "actions",
      label: "Update",
      render: (row: OrderRow) => (
        <Select
          value={String(row.status ?? "PENDING")}
          onValueChange={(status) => statusMutation.mutate({ id: row.id, status })}
          disabled={statusMutation.isPending}
        >
          <SelectTrigger className="h-8 w-36 text-xs" onClick={(e) => e.stopPropagation()}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ORDER_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {formatEnumLabel(s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="max-w-[1600px] mx-auto space-y-6 pb-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h1 className="text-[22px] font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShoppingCart className="h-6 w-6 text-blue-600" />
            Orders
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage customer orders{user?.name ? ` — ${user.name}` : ""}. Update status to provision services.
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
          searchPlaceholder="Search by order number or customer..."
          onSearch={(q) => {
            setSearch(q);
            setPage(1);
          }}
          showDateFilter={false}
          filters={[
            {
              key: "status",
              label: "Status",
              options: ORDER_STATUSES.map((s) => ({ value: s, label: formatEnumLabel(s) })),
            },
          ]}
          onFilterChange={(_key, val) => {
            setStatusFilter(val);
            setPage(1);
          }}
          summaryWidgets={[
            {
              label: "Total Orders",
              value: pagination.total,
              icon: <ShoppingCart className="h-4 w-4 text-blue-600" />,
              color: "bg-blue-50",
              textColor: "text-blue-700",
            },
            {
              label: "Pending (page)",
              value: pending,
              icon: <Clock className="h-4 w-4 text-amber-600" />,
              color: "bg-amber-50",
              textColor: "text-amber-700",
            },
            {
              label: "Processing (page)",
              value: processing,
              icon: <Clock className="h-4 w-4 text-indigo-600" />,
              color: "bg-indigo-50",
              textColor: "text-indigo-700",
            },
            {
              label: "Completed (page)",
              value: completed,
              icon: <CheckCircle className="h-4 w-4 text-emerald-600" />,
              color: "bg-emerald-50",
              textColor: "text-emerald-700",
            },
          ]}
        />
      </div>
    </AdminLayout>
  );
}
