import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PageLoader, PageError } from "@/components/PageLoader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye } from "lucide-react";
import { useIsClient } from "@/hooks/use-role";
import { listMyOrders } from "@/lib/api/commerce";
import { formatCurrency, formatDate, formatEnumLabel } from "@/lib/format";

export default function MyOrdersPage() {
  const isClient = useIsClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["my-orders", page, statusFilter],
    queryFn: () =>
      listMyOrders({
        page,
        limit: 20,
        status: statusFilter === "all" ? undefined : statusFilter.toUpperCase(),
      }),
    enabled: isClient,
  });

  if (!isClient) {
    return <PageError message="You must be signed in as a client to view your orders." />;
  }
  if (isLoading) return <PageLoader message="Loading orders..." />;
  if (isError) {
    return (
      <PageError message={error instanceof Error ? error.message : "Failed to load orders."} />
    );
  }

  const orders = data?.items ?? [];
  const total = data?.pagination.total ?? 0;
  const totalPages = data?.pagination.totalPages ?? 1;

  return (
    <AdminLayout>
      <div className="p-6 bg-[#ffffff] min-h-full font-sans">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-xl font-bold text-slate-900">My Orders</h1>
            <p className="text-sm text-slate-500">Track your order history and payment status.</p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/cart">View Cart</Link>
          </Button>
        </div>

        <div className="mb-4">
          <select
            className="border border-slate-200 rounded-lg px-4 text-sm text-slate-600 bg-white h-10"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="PROCESSING">Processing</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>

        <Card className="rounded-2xl shadow-sm border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-bold">
                <tr>
                  <th className="p-4">Order #</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Items</th>
                  <th className="p-4">Total</th>
                  <th className="p-4">Payment</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-center">Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      No orders found.
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => {
                    const row = order as Record<string, unknown>;
                    const items = Array.isArray(row.items) ? row.items : [];
                    const invoice = row.invoice as
                      | { id?: string; invoiceNumber?: string; status?: string }
                      | null
                      | undefined;
                    const productNames = items
                      .slice(0, 2)
                      .map((i) => (i as { productName?: string }).productName)
                      .filter(Boolean)
                      .join(", ");
                    const extra = items.length > 2 ? ` +${items.length - 2} more` : "";

                    return (
                      <tr key={String(row.id)} className="hover:bg-slate-50/50">
                        <td className="p-4 font-medium text-slate-800">
                          {String(row.orderNumber ?? row.id)}
                        </td>
                        <td className="p-4 text-slate-500">
                          {formatDate(row.createdAt as string)}
                        </td>
                        <td className="p-4 text-slate-600 max-w-[200px] truncate">
                          {productNames}
                          {extra}
                          {items.length === 0 && "—"}
                        </td>
                        <td className="p-4 font-bold">{formatCurrency(Number(row.total ?? 0))}</td>
                        <td className="p-4 text-slate-500">
                          {formatEnumLabel(String(row.paymentMethod ?? "—"))}
                        </td>
                        <td className="p-4">
                          <OrderStatusBadge status={String(row.status ?? "")} />
                        </td>
                        <td className="p-4 text-center">
                          {invoice?.id ? (
                            <Button variant="ghost" size="sm" className="text-blue-600 text-xs" asChild>
                              <Link to={`/billing/invoices/${invoice.id}`}>
                                <Eye size={14} className="mr-1" />
                                {invoice.invoiceNumber ?? "View"}
                              </Link>
                            </Button>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <span className="text-sm text-slate-500 self-center">
              Page {page} of {totalPages} ({total} total)
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

function OrderStatusBadge({ status }: { status: string }) {
  const s = status.toUpperCase();
  const styles: Record<string, string> = {
    COMPLETED: "bg-emerald-50 text-emerald-600",
    PROCESSING: "bg-blue-50 text-blue-600",
    PENDING: "bg-amber-50 text-amber-600",
    CANCELLED: "bg-slate-100 text-slate-600",
    FAILED: "bg-rose-50 text-rose-600",
  };
  return (
    <Badge className={`${styles[s] ?? "bg-slate-100 text-slate-600"} border-0`}>
      {formatEnumLabel(status)}
    </Badge>
  );
}
