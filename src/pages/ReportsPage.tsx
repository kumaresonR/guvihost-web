import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PageLoader, PageError } from "@/components/PageLoader";
import {
  getReportsOverview,
  getRevenueReport,
  getTicketsReport,
  getOrdersReport,
  getDomainsReport,
  exportRevenueCsv,
  exportInvoicesCsv,
  exportClientsReportCsv,
} from "@/lib/api";
import { formatCurrency, formatDate, formatEnumLabel } from "@/lib/format";
import { downloadTextFile, rowsToCsv } from "@/lib/download";
import { useIsStaff } from "@/hooks/use-role";
import { BarChart3, IndianRupee, Users, FileText, ShoppingCart, Download, Globe } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GuvihostApiError } from "@/lib/guvihost-api";
import { toast } from "sonner";

function defaultFromDate() {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
}

function defaultToDate() {
  return new Date().toISOString().slice(0, 10);
}

function MetricCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  icon: typeof BarChart3;
  accent: string;
}) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-slate-500">{label}</p>
          <p className="text-xl font-bold text-slate-900 mt-1">{value}</p>
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accent}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const isStaff = useIsStaff();
  const [from, setFrom] = useState(defaultFromDate);
  const [to, setTo] = useState(defaultToDate);
  const [exporting, setExporting] = useState<string | null>(null);

  const overviewQuery = useQuery({
    queryKey: ["reports-overview", from, to],
    queryFn: () => getReportsOverview({ from, to }),
    enabled: isStaff,
  });

  const revenueQuery = useQuery({
    queryKey: ["reports-revenue", from, to],
    queryFn: () => getRevenueReport({ from, to, groupBy: "month" }),
    enabled: isStaff,
  });

  const ticketsQuery = useQuery({
    queryKey: ["reports-tickets", from, to],
    queryFn: () => getTicketsReport({ from, to, groupBy: "month" }),
    enabled: isStaff,
  });

  const ordersQuery = useQuery({
    queryKey: ["reports-orders", from, to],
    queryFn: () => getOrdersReport({ from, to, groupBy: "month" }),
    enabled: isStaff,
  });

  const domainsQuery = useQuery({
    queryKey: ["reports-domains", from, to],
    queryFn: () => getDomainsReport({ from, to }),
    enabled: isStaff,
  });

  const handleExport = async (type: "revenue" | "invoices" | "clients" | "tickets" | "orders" | "domains") => {
    setExporting(type);
    try {
      if (type === "revenue") {
        const csv = await exportRevenueCsv({ from, to });
        downloadTextFile(csv, `revenue-${from}-${to}.csv`);
      } else if (type === "invoices") {
        const csv = await exportInvoicesCsv({ from, to });
        downloadTextFile(csv, `invoices-${from}-${to}.csv`);
      } else if (type === "clients") {
        const csv = await exportClientsReportCsv({ from, to });
        downloadTextFile(csv, `clients-report-${from}-${to}.csv`);
      } else if (type === "tickets") {
        const data = ticketsQuery.data as Record<string, unknown> | undefined;
        const byStatus = Array.isArray(data?.byStatus) ? (data.byStatus as Record<string, unknown>[]) : [];
        downloadTextFile(rowsToCsv(byStatus), `tickets-${from}-${to}.csv`);
      } else if (type === "orders") {
        const data = ordersQuery.data as Record<string, unknown> | undefined;
        const byStatus = Array.isArray(data?.byStatus) ? (data.byStatus as Record<string, unknown>[]) : [];
        downloadTextFile(rowsToCsv(byStatus), `orders-${from}-${to}.csv`);
      } else {
        const data = domainsQuery.data as Record<string, unknown> | undefined;
        const byStatus = Array.isArray(data?.byStatus) ? (data.byStatus as Record<string, unknown>[]) : [];
        downloadTextFile(rowsToCsv(byStatus), `domains-${from}-${to}.csv`);
      }
      toast.success("Report exported");
    } catch (e) {
      toast.error(e instanceof GuvihostApiError ? e.message : "Export failed");
    } finally {
      setExporting(null);
    }
  };

  const metrics = overviewQuery.data?.metrics ?? {};
  const revenue = revenueQuery.data as Record<string, unknown> | undefined;
  const summary = (revenue?.summary ?? {}) as Record<string, number>;
  const series = useMemo(() => {
    const raw = revenue?.series;
    return Array.isArray(raw) ? (raw as { period: string; value: number }[]) : [];
  }, [revenue?.series]);
  const byMethod = useMemo(() => {
    const raw = revenue?.byPaymentMethod;
    return Array.isArray(raw) ? (raw as { method: string; amount: number }[]) : [];
  }, [revenue?.byPaymentMethod]);

  if (!isStaff) {
    return <PageError message="You must be signed in as staff to view reports." />;
  }

  const loading = overviewQuery.isLoading || revenueQuery.isLoading;
  const error = overviewQuery.error ?? revenueQuery.error;

  if (loading) return <PageLoader message="Loading reports..." />;
  if (error) {
    return (
      <PageError
        message={error instanceof GuvihostApiError ? error.message : "Failed to load reports."}
      />
    );
  }

  const period = overviewQuery.data?.period;
  const tickets = ticketsQuery.data as Record<string, unknown> | undefined;
  const orders = ordersQuery.data as Record<string, unknown> | undefined;
  const domains = domainsQuery.data as Record<string, unknown> | undefined;

  const DateRange = () => (
    <div className="flex flex-wrap items-end gap-3">
      <div>
        <Label className="text-xs text-slate-500">From</Label>
        <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-9 w-40" />
      </div>
      <div>
        <Label className="text-xs text-slate-500">To</Label>
        <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-9 w-40" />
      </div>
    </div>
  );

  const ExportBtn = ({ type, label }: { type: Parameters<typeof handleExport>[0]; label?: string }) => (
    <Button
      variant="outline"
      size="sm"
      className="gap-2"
      disabled={exporting === type}
      onClick={() => handleExport(type)}
    >
      <Download className="h-4 w-4" />
      {exporting === type ? "Exporting..." : label ?? "Export CSV"}
    </Button>
  );

  return (
    <AdminLayout>
      <div className="max-w-[1600px] mx-auto space-y-6 pb-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div>
              <h1 className="text-[22px] font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <BarChart3 className="h-6 w-6 text-blue-600" />
                Business Reports
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Revenue and operational metrics
                {period ? ` for ${formatDate(String(period.from))} – ${formatDate(String(period.to))}` : ""}.
              </p>
            </div>
            <DateRange />
          </div>
        </div>

        <Tabs defaultValue="overview">
          <TabsList className="bg-white border border-slate-100 rounded-xl p-1 flex-wrap h-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tickets">Tickets</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="domains">Domains</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="flex flex-wrap gap-2">
              <ExportBtn type="revenue" label="Export Revenue" />
              <ExportBtn type="invoices" label="Export Invoices" />
              <ExportBtn type="clients" label="Export Clients" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <MetricCard label="Revenue" value={formatCurrency(Number(metrics.revenue ?? 0))} icon={IndianRupee} accent="bg-emerald-500" />
              <MetricCard label="Outstanding" value={formatCurrency(Number(metrics.outstanding ?? 0))} icon={FileText} accent="bg-rose-500" />
              <MetricCard label="New Clients" value={Number(metrics.newClients ?? 0).toLocaleString()} icon={Users} accent="bg-blue-600" />
              <MetricCard label="Completed Orders" value={Number(metrics.completedOrders ?? 0).toLocaleString()} icon={ShoppingCart} accent="bg-indigo-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100">
                  <h2 className="text-base font-bold text-slate-800">Revenue by Period</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Total {formatCurrency(Number(summary.total ?? 0))} across {Number(summary.invoiceCount ?? 0)} invoices
                  </p>
                </div>
                <ReportTable
                  headers={["Period", "Revenue"]}
                  rows={series.map((row) => [row.period, formatCurrency(row.value)])}
                  empty="No revenue data for this period"
                />
              </div>
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100">
                  <h2 className="text-base font-bold text-slate-800">By Payment Method</h2>
                </div>
                <ReportTable
                  headers={["Method", "Amount"]}
                  rows={byMethod.map((row) => [row.method, formatCurrency(row.amount)])}
                  empty="No payment breakdown"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="tickets" className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-600">
                Total tickets: {Number((tickets?.summary as { total?: number })?.total ?? 0)}
              </p>
              <ExportBtn type="tickets" />
            </div>
            {ticketsQuery.isLoading ? (
              <PageLoader message="Loading ticket report..." />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ReportPanel
                  title="By Status"
                  rows={(Array.isArray(tickets?.byStatus) ? tickets.byStatus : []) as { status: string; count: number }[]}
                  mapRow={(r) => [formatEnumLabel(r.status), String(r.count)]}
                />
                <ReportPanel
                  title="By Priority"
                  rows={(Array.isArray(tickets?.byPriority) ? tickets.byPriority : []) as { priority: string; count: number }[]}
                  mapRow={(r) => [formatEnumLabel(r.priority), String(r.count)]}
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="orders" className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-600">
                {Number((orders?.summary as { totalOrders?: number })?.totalOrders ?? 0)} orders ·{" "}
                {formatCurrency(Number((orders?.summary as { totalValue?: number })?.totalValue ?? 0))} total value
              </p>
              <ExportBtn type="orders" />
            </div>
            {ordersQuery.isLoading ? (
              <PageLoader message="Loading orders report..." />
            ) : (
              <ReportPanel
                title="Orders by Status"
                rows={(Array.isArray(orders?.byStatus) ? orders.byStatus : []) as { status: string; count: number; amount: number }[]}
                mapRow={(r) => [formatEnumLabel(r.status), String(r.count), formatCurrency(r.amount)]}
                headers={["Status", "Count", "Amount"]}
              />
            )}
          </TabsContent>

          <TabsContent value="domains" className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-600 flex items-center gap-2">
                <Globe className="h-4 w-4" />
                New domains in period: {Number((domains?.summary as { newDomains?: number })?.newDomains ?? 0)}
              </p>
              <ExportBtn type="domains" />
            </div>
            {domainsQuery.isLoading ? (
              <PageLoader message="Loading domains report..." />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ReportPanel
                  title="Domains by Status"
                  rows={(Array.isArray(domains?.byStatus) ? domains.byStatus : []) as { status: string; count: number }[]}
                  mapRow={(r) => [formatEnumLabel(r.status), String(r.count)]}
                />
                <ReportPanel
                  title="Transfers in Period"
                  rows={(Array.isArray(domains?.transfersInPeriod) ? domains.transfersInPeriod : []) as { status: string; count: number }[]}
                  mapRow={(r) => [formatEnumLabel(r.status), String(r.count)]}
                />
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

function ReportTable({
  headers,
  rows,
  empty,
}: {
  headers: string[];
  rows: string[][];
  empty: string;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 text-left">
            {headers.map((h) => (
              <th key={h} className="px-5 py-3 text-xs font-bold text-slate-500 uppercase">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={headers.length} className="px-5 py-10 text-center text-slate-500">
                {empty}
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr key={i} className="hover:bg-slate-50/50">
                {row.map((cell, j) => (
                  <td
                    key={j}
                    className={`px-5 py-3 ${j === row.length - 1 && headers.length > 1 ? "text-right font-semibold" : "font-medium text-slate-700"}`}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function ReportPanel<T>({
  title,
  rows,
  mapRow,
  headers = ["Label", "Count"],
}: {
  title: string;
  rows: T[];
  mapRow: (row: T) => string[];
  headers?: string[];
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-100">
        <h2 className="text-base font-bold text-slate-800">{title}</h2>
      </div>
      <ReportTable headers={headers} rows={rows.map(mapRow)} empty="No data for this period" />
    </div>
  );
}
