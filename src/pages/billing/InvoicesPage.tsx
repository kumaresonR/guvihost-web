import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PageLoader, PageError } from "@/components/PageLoader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Eye } from "lucide-react";
import { useIsStaff } from "@/hooks/use-role";
import { getBillingDashboard, listAdminOrders, listInvoices } from "@/lib/api/index";
import { formatCurrency, formatDate, formatEnumLabel, userDisplayName } from "@/lib/format";

type InvoiceRow = {
  id: string;
  number: string;
  date: string;
  amount: number;
  status: string;
  customer?: string;
};

export default function InvoicesPage() {
  const isStaff = useIsStaff();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");

  const clientDashboardQuery = useQuery({
    queryKey: ["billingDashboard"],
    queryFn: getBillingDashboard,
    enabled: !isStaff,
  });

  const clientInvoicesQuery = useQuery({
    queryKey: ["invoices", page, statusFilter],
    queryFn: () =>
      listInvoices({
        page,
        limit: 20,
        status: statusFilter === "all" ? undefined : statusFilter.toUpperCase(),
      }),
    enabled: !isStaff,
  });

  const staffOrdersQuery = useQuery({
    queryKey: ["adminOrders", page],
    queryFn: () => listAdminOrders({ page, limit: 20 }),
    enabled: isStaff,
  });

  const isLoading = isStaff ? staffOrdersQuery.isLoading : clientInvoicesQuery.isLoading || clientDashboardQuery.isLoading;
  const isError = isStaff ? staffOrdersQuery.isError : clientInvoicesQuery.isError;
  const error = isStaff ? staffOrdersQuery.error : clientInvoicesQuery.error;

  if (isLoading) return <PageLoader message="Loading invoices..." />;
  if (isError) return <PageError message={error instanceof Error ? error.message : "Failed to load invoices"} />;

  let rows: InvoiceRow[] = [];
  let total = 0;
  let totalPages = 1;

  if (isStaff) {
    const orders = staffOrdersQuery.data?.items ?? [];
    rows = orders.map((order: Record<string, unknown>) => {
      const invoice = order.invoice as Record<string, unknown> | null | undefined;
      const user = order.user as { firstName?: string; lastName?: string; email?: string } | undefined;
      return {
        id: (invoice?.id as string) ?? (order.id as string),
        number: (invoice?.invoiceNumber as string) ?? (order.orderNumber as string) ?? "—",
        date: formatDate((order.createdAt as string) ?? ""),
        amount: Number(order.total ?? 0),
        status: (invoice?.status as string) ?? (order.status as string) ?? "—",
        customer: userDisplayName(user),
      };
    });
    total = staffOrdersQuery.data?.pagination.total ?? 0;
    totalPages = staffOrdersQuery.data?.pagination.totalPages ?? 1;
  } else {
    const invoices = clientInvoicesQuery.data?.items ?? [];
    rows = invoices.map((inv: Record<string, unknown>) => ({
      id: inv.id as string,
      number: inv.invoiceNumber as string,
      date: formatDate(inv.invoiceDate as string),
      amount: Number(inv.total ?? 0),
      status: inv.status as string,
    }));
    total = clientInvoicesQuery.data?.pagination.total ?? 0;
    totalPages = clientInvoicesQuery.data?.pagination.totalPages ?? 1;
  }

  const summary = !isStaff ? (clientDashboardQuery.data?.summary as Record<string, number> | undefined) : undefined;

  return (
    <AdminLayout>
      <div className="p-6 bg-[#ffffff] min-h-full font-sans">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-xl font-bold text-slate-900">{isStaff ? "Orders & Invoices" : "Invoices"}</h1>
            <p className="text-sm text-slate-500">
              {isStaff ? "All client orders with linked invoice information." : "View and download your invoice history."}
            </p>
          </div>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
        </div>

        {!isStaff && summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <SummaryCard title="Due Invoices" value={String(summary.dueInvoices ?? 0)} />
            <SummaryCard title="Due Amount" value={formatCurrency(Number(summary.dueAmount ?? 0))} highlight />
            <SummaryCard title="Total Invoices" value={String(summary.totalInvoices ?? 0)} />
            <SummaryCard title="Total Paid" value={formatCurrency(Number(summary.totalPaid ?? 0))} />
          </div>
        )}

        {!isStaff && (
          <div className="mb-4">
            <select
              className="border border-slate-200 rounded-lg px-4 text-sm text-slate-600 bg-white h-10"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            >
              <option value="all">All Status</option>
              <option value="UNPAID">Unpaid</option>
              <option value="PAID">Paid</option>
              <option value="OVERDUE">Overdue</option>
            </select>
          </div>
        )}

        <Card className="rounded-2xl shadow-sm border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-bold">
                <tr>
                  <th className="p-4">{isStaff ? "Invoice / Order" : "Invoice #"}</th>
                  {isStaff && <th className="p-4">Customer</th>}
                  <th className="p-4">Date</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={isStaff ? 6 : 5} className="p-8 text-center text-slate-500">
                      No invoices found.
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/50">
                      <td className="p-4 font-medium text-slate-800">{row.number}</td>
                      {isStaff && <td className="p-4 text-slate-600">{row.customer}</td>}
                      <td className="p-4 text-slate-500">{row.date}</td>
                      <td className="p-4 font-bold">{formatCurrency(row.amount)}</td>
                      <td className="p-4">
                        <InvoiceStatusBadge status={row.status} />
                      </td>
                      <td className="p-4 text-center">
                        <Button variant="ghost" size="sm" className="text-blue-600 text-xs" asChild>
                          <Link to={`/billing/invoices/${row.id}`}>
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

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <span className="text-sm text-slate-500 self-center">
              Page {page} of {totalPages} ({total} total)
            </span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

function SummaryCard({ title, value, highlight = false }: { title: string; value: string; highlight?: boolean }) {
  return (
    <Card className="p-4 rounded-2xl shadow-sm border-slate-100">
      <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">{title}</p>
      <p className={`text-xl font-bold ${highlight ? "text-rose-500" : ""}`}>{value}</p>
    </Card>
  );
}

function InvoiceStatusBadge({ status }: { status: string }) {
  const s = status.toUpperCase();
  const paid = s === "PAID" || s === "COMPLETED";
  return (
    <Badge className={paid ? "bg-emerald-50 text-emerald-600 border-0" : "bg-rose-50 text-rose-600 border-0"}>
      {formatEnumLabel(status)}
    </Badge>
  );
}
