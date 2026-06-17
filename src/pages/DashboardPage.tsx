import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PageError, PageLoader } from "@/components/PageLoader";
import { useAuth } from "@/lib/auth";
import { getAdminDashboard } from "@/lib/api";
import { formatCurrency, formatEnumLabel } from "@/lib/format";
import {
  Users,
  Server,
  ShoppingCart,
  IndianRupee,
  Ticket,
  Clock,
  Calendar,
  TrendingUp,
  Globe,
  HardDrive,
  UserPlus,
  FileText,
  Wallet,
  ChevronRight,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";

const PIE_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#06b6d4", "#ec4899"];

const StatusBadge = ({ status }: { status: string }) => {
  const label = formatEnumLabel(status);
  let colorClass = "bg-slate-100 text-slate-600";
  if (status === "ACTIVE" || status === "COMPLETED" || status === "PAID")
    colorClass = "text-emerald-600 border border-emerald-200 bg-emerald-50";
  if (status === "PENDING" || status === "OPEN")
    colorClass = "text-amber-500 border border-amber-200 bg-amber-50";

  return (
    <span className={`rounded px-2.5 py-0.5 text-[10px] font-medium ${colorClass}`}>{label}</span>
  );
};

export default function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: getAdminDashboard,
  });

  const metrics = useMemo(() => {
    if (!data) return [];
    const s = data.summary;
    return [
      { title: "Total Clients", value: s.totalClients.toLocaleString(), icon: Users, bgColor: "bg-blue-600" },
      { title: "Active Services", value: s.activeServices.toLocaleString(), icon: Server, bgColor: "bg-emerald-500" },
      { title: "Pending Orders", value: s.pendingOrders.toLocaleString(), icon: ShoppingCart, bgColor: "bg-orange-400" },
      { title: "Monthly Revenue", value: formatCurrency(s.monthlyRevenue), icon: IndianRupee, bgColor: "bg-indigo-400" },
      { title: "Open Tickets", value: s.openTickets.toLocaleString(), icon: Ticket, bgColor: "bg-cyan-400" },
      { title: "Due for Renewal", value: s.dueForRenewal.toLocaleString(), icon: Clock, bgColor: "bg-rose-500" },
    ];
  }, [data]);

  const servicesData = useMemo(() => {
    if (!data?.servicesOverview?.length) return [];
    const total = data.servicesOverview.reduce((sum, g) => sum + g.count, 0) || 1;
    return data.servicesOverview.map((g, i) => ({
      name: formatEnumLabel(g.type),
      count: g.count,
      percent: Math.round((g.count / total) * 100),
      color: PIE_COLORS[i % PIE_COLORS.length],
    }));
  }, [data]);

  if (isLoading) return <PageLoader />;
  if (isError || !data)
    return <PageError message={error instanceof Error ? error.message : "Failed to load dashboard"} />;

  const servicesTotal = servicesData.reduce((s, g) => s + g.count, 0);

  return (
    <AdminLayout>
      <div className="mx-auto max-w-[1600px] space-y-6 pb-10 font-sans">
        <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:flex-row sm:items-center">
          <div>
            <h1 className="text-[22px] font-bold tracking-tight text-slate-900">
              Welcome back, {user?.name || "Admin"}!
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Here&apos;s what&apos;s happening with your hosting business today.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm">
            <Calendar className="h-4 w-4 text-slate-400" />
            <span>{new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
          {metrics.map((metric, i) => (
            <div
              key={i}
              className="flex flex-col items-center rounded-2xl border border-slate-100 bg-white p-5 text-center shadow-sm"
            >
              <div className={`mb-3 flex h-12 w-14 items-center justify-center rounded-xl text-white shadow-md ${metric.bgColor}`}>
                <metric.icon className="h-6 w-6" strokeWidth={2.5} />
              </div>
              <p className="mb-1 text-xs font-semibold text-slate-500">{metric.title}</p>
              <h3 className="mb-1 text-xl font-bold text-slate-800">{metric.value}</h3>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm lg:col-span-2">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-800">Business Summary</h3>
              <Link to="/reports" className="text-xs font-semibold text-blue-600 hover:underline">
                View Reports
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <SummaryTile label="Active Clients" value={data.summary.activeClients} />
              <SummaryTile label="Inactive Clients" value={data.summary.inactiveClients} />
              <SummaryTile label="KYC Verified" value={data.summary.kycVerified} />
              <SummaryTile label="KYC Pending" value={data.summary.kycUnverified} />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <h3 className="mb-6 text-base font-bold text-slate-800">Services Overview</h3>
            {servicesData.length > 0 ? (
              <div className="flex flex-col items-center">
                <div className="relative h-[200px] w-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={servicesData} dataKey="count" innerRadius={65} outerRadius={95} paddingAngle={3} stroke="none">
                        {servicesData.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xs font-semibold text-slate-500">Total</span>
                    <span className="text-xl font-bold text-slate-800">{servicesTotal.toLocaleString()}</span>
                  </div>
                </div>
                <div className="mt-6 w-full space-y-3">
                  {servicesData.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="font-medium text-slate-700">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-semibold text-slate-700">{item.count.toLocaleString()}</span>
                        <span className="w-8 text-right text-slate-400">({item.percent}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-center text-sm text-slate-500">No services yet</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-800">Recent Orders</h3>
            <Link
              to="/orders"
              className="rounded-md border border-blue-100 px-3 py-1.5 text-xs font-semibold text-blue-600 transition-colors hover:bg-blue-50"
            >
              View All
            </Link>
          </div>
          {data.recentOrders.length > 0 ? (
            <div className="space-y-4">
              {data.recentOrders.map((order, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between border-b border-slate-50 pb-4 text-xs last:border-0 last:pb-0"
                >
                  <span className="w-28 font-semibold text-slate-800">{order.orderId}</span>
                  <span className="w-32 text-slate-500">{order.product}</span>
                  <span className="w-24 font-medium text-slate-700">{order.customer}</span>
                  <div className="w-20 text-right">
                    <StatusBadge status={order.status} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No recent orders</p>
          )}
        </div>

        <h3 className="pt-2 text-base font-bold text-slate-800">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
          {[
            { title: "Add Client", icon: UserPlus, href: "/clients/add" },
            { title: "Register Domain", icon: Globe, href: "/domains" },
            { title: "Order Hosting", icon: Server, href: "/hosting" },
            { title: "Create Invoice", icon: FileText, href: "/billing/invoices" },
            { title: "Create Ticket", icon: Ticket, href: "/support" },
            { title: "Add Funds", icon: Wallet, href: "/billing" },
          ].map((action, i) => (
            <Link
              key={i}
              to={action.href}
              className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-blue-400 hover:shadow"
            >
              <div className="flex items-center gap-3">
                <action.icon className="h-5 w-5 text-slate-600 transition-colors group-hover:text-blue-600" />
                <span className="text-sm font-semibold text-slate-700 transition-colors group-hover:text-blue-700">
                  {action.title}
                </span>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400 transition-colors group-hover:text-blue-500" />
            </Link>
          ))}
        </div>

        <div className="mt-8 flex flex-col items-center justify-between border-t border-slate-200 pt-6 pb-2 text-xs text-slate-500 sm:flex-row">
          <p>© {new Date().getFullYear()} Guvihost Technologies Pvt Ltd. All rights reserved.</p>
          <p className="mt-2 font-medium sm:mt-0">Version 1.0.0</p>
        </div>
      </div>
    </AdminLayout>
  );
}

function SummaryTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 text-center">
      <p className="text-2xl font-bold text-slate-800">{value.toLocaleString()}</p>
      <p className="mt-1 text-xs font-medium text-slate-500">{label}</p>
    </div>
  );
}
