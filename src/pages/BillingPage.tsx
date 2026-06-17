import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PageLoader, PageError } from "@/components/PageLoader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Plus, CreditCard, Wallet, Banknote, RefreshCw, FileText } from "lucide-react";
import { useIsStaff } from "@/hooks/use-role";
import { getBillingDashboard, getReportsOverview } from "@/lib/api/index";
import { formatCurrency, formatDate, formatEnumLabel } from "@/lib/format";

export default function BillingPage() {
  const isStaff = useIsStaff();

  const clientQuery = useQuery({
    queryKey: ["billingDashboard"],
    queryFn: getBillingDashboard,
    enabled: !isStaff,
  });

  const staffQuery = useQuery({
    queryKey: ["reportsOverview"],
    queryFn: () => getReportsOverview(),
    enabled: isStaff,
  });

  const isLoading = isStaff ? staffQuery.isLoading : clientQuery.isLoading;
  const isError = isStaff ? staffQuery.isError : clientQuery.isError;
  const error = isStaff ? staffQuery.error : clientQuery.error;

  if (isLoading) return <PageLoader message="Loading billing..." />;
  if (isError) return <PageError message={error instanceof Error ? error.message : "Failed to load billing data"} />;

  if (isStaff) {
    const metrics = staffQuery.data!.metrics;
    return (
      <AdminLayout>
        <div className="p-6 bg-[#ffffff] min-h-full font-sans">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-xl font-bold text-slate-900">Billing Overview</h1>
              <p className="text-sm text-slate-500">Revenue and invoice metrics for the current period.</p>
            </div>
            <Button variant="outline" asChild>
              <Link to="/billing/invoices">
                <FileText className="mr-2 h-4 w-4" /> View Orders & Invoices
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <StatCard title="Revenue" value={formatCurrency(metrics.revenue)} desc="Paid in period" icon="💰" />
            <StatCard title="Outstanding" value={formatCurrency(metrics.outstanding)} desc="Unpaid total" icon="📄" highlight="text-rose-500" />
            <StatCard title="Paid Invoices" value={String(metrics.paidInvoices)} desc="In period" icon="✅" />
            <StatCard title="Unpaid Invoices" value={String(metrics.unpaidInvoices)} desc="In period" icon="⏳" highlight="text-amber-500" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard title="Completed Orders" value={String(metrics.completedOrders)} desc="In period" icon="🛒" />
            <StatCard title="New Tickets" value={String(metrics.newTickets)} desc="In period" icon="🎫" />
            <StatCard title="New Clients" value={String(metrics.newClients)} desc="In period" icon="👥" />
          </div>
        </div>
      </AdminLayout>
    );
  }

  const data = clientQuery.data as Record<string, unknown>;
  const summary = data.summary as Record<string, number>;
  const balance = data.balance as Record<string, number>;
  const unpaidInvoices = (data.unpaidInvoices ?? []) as Record<string, unknown>[];
  const recentInvoices = (data.recentInvoices ?? []) as Record<string, unknown>[];
  const paymentMethods = (data.paymentMethods ?? []) as Record<string, unknown>[];

  const unpaidRows = unpaidInvoices.map((inv) => ({
    id: inv.invoiceNumber as string,
    date: formatDate(inv.invoiceDate as string),
    amount: formatCurrency(Number(inv.total ?? 0)),
    status: formatEnumLabel(inv.status as string),
    unpaid: true,
  }));

  const recentRows = recentInvoices.map((inv) => ({
    id: inv.invoiceNumber as string,
    date: formatDate(inv.invoiceDate as string),
    amount: formatCurrency(Number(inv.total ?? 0)),
    status: formatEnumLabel(inv.status as string),
    unpaid: (inv.status as string)?.toUpperCase() !== "PAID",
  }));

  return (
    <AdminLayout>
      <div className="p-6 bg-[#ffffff] min-h-full font-sans">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Billing</h1>
            <p className="text-sm text-slate-500">Dashboard / Billing</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" asChild>
              <Link to="/billing/invoices">
                <FileText className="mr-2 h-4 w-4" /> Invoice History
              </Link>
            </Button>
            <Button className="bg-blue-600" asChild>
              <Link to="/billing/add-funds">
                <Plus className="mr-2 h-4 w-4" /> Add Funds
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatCard title="Total Balance" value={formatCurrency(summary.totalBalance)} desc="Available Balance" icon="💳" />
          <StatCard
            title="Due Invoices"
            value={String(summary.dueInvoices)}
            desc={`${formatCurrency(summary.dueAmount)} Due`}
            icon="📄"
            highlight="text-rose-500"
          />
          <StatCard title="Total Invoices" value={String(summary.totalInvoices)} desc="All Time" icon="💰" />
          <StatCard title="Total Paid" value={formatCurrency(summary.totalPaid)} desc="All Time" icon="🏦" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <BillingTable title="Unpaid Invoices" data={unpaidRows} />
            <BillingTable title="Recent Invoices" data={recentRows} showAll />
          </div>

          <div className="space-y-6">
            <Card className="p-6 rounded-2xl shadow-sm">
              <h3 className="font-bold mb-4">Balance Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>Available Balance</span>
                  <span className="text-emerald-600">{formatCurrency(balance.availableBalance)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pending Amount</span>
                  <span className="text-rose-500">{formatCurrency(balance.pendingAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Credits</span>
                  <span>{formatCurrency(balance.totalCredits)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Debits</span>
                  <span>{formatCurrency(balance.totalDebits)}</span>
                </div>
                <Button className="w-full mt-4" asChild>
                  <Link to="/billing/add-funds">Add Funds</Link>
                </Button>
              </div>
            </Card>

            <Card className="p-6 rounded-2xl shadow-sm">
              <h3 className="font-bold mb-4">Payment Methods</h3>
              <div className="space-y-3">
                {paymentMethods.length === 0 ? (
                  <p className="text-sm text-slate-500">No payment methods saved.</p>
                ) : (
                  paymentMethods.map((pm) => (
                    <PaymentMethod
                      key={pm.id as string}
                      name={pm.label as string}
                      status={pm.isDefault ? "Default" : "Active"}
                    />
                  ))
                )}
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/billing/methods">Manage Payment Methods</Link>
                </Button>
              </div>
            </Card>
          </div>
        </div>

        <div className="mt-8 bg-white p-4 rounded-2xl border shadow-sm grid grid-cols-5 gap-4">
          <ActionBtn icon={<Banknote />} label="Pay Unpaid Invoices" />
          <ActionBtn icon={<Wallet />} label="Add Funds" />
          <ActionBtn icon={<Download />} label="Download Invoices" />
          <ActionBtn icon={<RefreshCw />} label="Update Billing Info" />
          <ActionBtn icon={<CreditCard />} label="Set Auto Pay" />
        </div>
      </div>
    </AdminLayout>
  );
}

function StatCard({
  title,
  value,
  desc,
  icon,
  highlight = "",
}: {
  title: string;
  value: string;
  desc: string;
  icon: string;
  highlight?: string;
}) {
  return (
    <Card className="p-5 rounded-2xl shadow-sm border-slate-100 flex items-center gap-4">
      <div className="text-3xl">{icon}</div>
      <div>
        <p className="text-xs text-slate-500 font-bold uppercase">{title}</p>
        <p className={`text-xl font-bold ${highlight}`}>{value}</p>
        <p className="text-[10px] text-slate-400">{desc}</p>
      </div>
    </Card>
  );
}

function BillingTable({
  title,
  data,
  showAll,
}: {
  title: string;
  data: { id: string; date: string; amount: string; status: string; unpaid?: boolean }[];
  showAll?: boolean;
}) {
  return (
    <Card className="p-6 rounded-2xl border-slate-100 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold">{title}</h3>
        {showAll && (
          <Button variant="ghost" className="text-xs text-blue-600" asChild>
            <Link to="/billing/invoices">View All Invoices</Link>
          </Button>
        )}
      </div>
      {data.length === 0 ? (
        <p className="text-sm text-slate-500">No invoices.</p>
      ) : (
        <table className="w-full text-xs">
          <thead className="text-slate-400 border-b">
            <tr>
              <th className="pb-3">Invoice #</th>
              <th className="pb-3">Date</th>
              <th className="pb-3">Amount</th>
              <th className="pb-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.id} className="border-b last:border-0">
                <td className="py-4 font-medium">{row.id}</td>
                <td className="py-4 text-slate-500">{row.date}</td>
                <td className="py-4 font-bold">{row.amount}</td>
                <td className="py-4">
                  <Badge
                    className={
                      row.unpaid ? "bg-rose-50 text-rose-600 border-0" : "bg-emerald-50 text-emerald-600 border-0"
                    }
                  >
                    {row.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}

function PaymentMethod({ name, status }: { name: string; status: string }) {
  return (
    <div className="flex justify-between items-center text-sm p-3 border rounded-lg">
      <span className="font-medium">{name}</span>
      <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-0">
        {status}
      </Badge>
    </div>
  );
}

function ActionBtn({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button className="flex flex-col items-center gap-2 text-xs font-semibold text-slate-600 hover:text-blue-600">
      <div className="p-3 bg-blue-50 rounded-full">{icon}</div>
      {label}
    </button>
  );
}
