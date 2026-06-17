import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HardDrive, Globe, FileText, Headset, Wallet, ShoppingCart, Mail, BookOpen } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PageLoader, PageError } from "@/components/PageLoader";
import { useDisplayUser } from "@/hooks/use-role";
import { getClientDashboard } from "@/lib/api/index";
import { formatCurrency, formatDate, formatEnumLabel } from "@/lib/format";

export default function ClientDashboardPage() {
  const displayUser = useDisplayUser();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["clientDashboard"],
    queryFn: getClientDashboard,
  });

  if (isLoading) return <PageLoader message="Loading dashboard..." />;
  if (isError) return <PageError message={error instanceof Error ? error.message : "Failed to load dashboard"} />;

  const summary = data!.summary;
  const firstName = displayUser?.name?.split(" ")[0] ?? "there";

  return (
    <AdminLayout>
      <div className="p-8 bg-[#f8f9fa] min-h-screen font-sans">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Welcome back, {firstName} 👋</h1>
            <p className="text-slate-500">Here's what's happening with your account today.</p>
          </div>
          <Button className="bg-blue-600 gap-2" asChild>
            <Link to="/services/order">+ Add New Service</Link>
          </Button>
        </div>

        <div className="grid grid-cols-5 gap-4 mb-8">
          <StatCard
            icon={<HardDrive />}
            title="Active Services"
            value={String(summary.activeServices)}
            link="View all services"
            href="/services/all"
          />
          <StatCard icon={<Globe />} title="Domains" value={String(summary.domains)} link="Manage domains" href="/domains" />
          <StatCard
            icon={<FileText />}
            title="Unpaid Invoices"
            value={String(summary.unpaidInvoices)}
            sub={formatCurrency(summary.unpaidAmount)}
            link="View invoices"
            href="/billing/invoices"
          />
          <StatCard
            icon={<Headset />}
            title="Open Tickets"
            value={String(summary.openTickets)}
            link="View tickets"
            href="/support/create"
          />
          <StatCard
            icon={<Wallet />}
            title="Account Balance"
            value={formatCurrency(summary.walletBalance)}
            link="Add Funds"
            href="/billing/add-funds"
          />
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <Card className="p-6 rounded-2xl shadow-sm border-slate-100">
            <h3 className="font-bold mb-4">Services Overview</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                { label: "Active", value: data!.servicesOverview.active, color: "text-emerald-600" },
                { label: "Pending", value: data!.servicesOverview.pending, color: "text-amber-600" },
                { label: "Suspended", value: data!.servicesOverview.suspended, color: "text-rose-600" },
                { label: "Cancelled", value: data!.servicesOverview.cancelled, color: "text-slate-500" },
              ].map((item) => (
                <div key={item.label} className="rounded-lg bg-slate-50 p-3">
                  <p className="text-[10px] font-bold uppercase text-slate-400">{item.label}</p>
                  <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 rounded-2xl shadow-sm border-slate-100">
            <div className="flex justify-between mb-4">
              <h3 className="font-bold">Recent Invoices</h3>
              <Link to="/billing/invoices" className="text-xs text-blue-600">
                View All
              </Link>
            </div>
            {data!.recentInvoices.length === 0 ? (
              <p className="text-sm text-slate-500">No invoices yet.</p>
            ) : (
              <div className="space-y-3">
                {data!.recentInvoices.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium">{inv.invoiceNumber}</p>
                      <p className="text-xs text-slate-500">{formatDate(inv.invoiceDate)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatCurrency(inv.total)}</p>
                      <Badge variant="outline" className="text-[10px] border-0">
                        {formatEnumLabel(inv.status)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {data!.activeServices.length > 0 && (
          <Card className="p-6 rounded-2xl shadow-sm border-slate-100 mb-8">
            <h3 className="font-bold mb-4">Active Services</h3>
            <div className="space-y-2">
              {data!.activeServices.map((svc) => (
                <Link key={svc.id} to={`/services/${svc.id}`} className="flex items-center justify-between text-sm border-b last:border-0 py-2 hover:bg-slate-50 -mx-2 px-2 rounded">
                  <div>
                    <p className="font-medium">{svc.name}</p>
                    <p className="text-xs text-slate-500">{svc.domain ?? formatEnumLabel(svc.type)}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] border-0">
                    {formatEnumLabel(svc.status)}
                  </Badge>
                </Link>
              ))}
            </div>
          </Card>
        )}

        <h3 className="font-bold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-6 gap-4">
          {[
            { i: <ShoppingCart />, l: "Order Hosting", href: "/services" },
            { i: <Globe />, l: "Register Domain", href: "/domains/search" },
            { i: <Headset />, l: "Open Ticket", href: "/support/create" },
            { i: <Wallet />, l: "Make Payment", href: "/billing" },
            { i: <FileText />, l: "View Invoices", href: "/billing/invoices" },
            { i: <BookOpen />, l: "Knowledge Base", href: "/kb" },
          ].map((a) => (
            <Link key={a.l} to={a.href}>
              <Card className="p-4 rounded-xl flex flex-col items-center gap-2 cursor-pointer hover:border-blue-300">
                <div className="text-blue-600">{a.i}</div>
                <p className="text-[10px] font-bold">{a.l}</p>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}

function StatCard({
  icon,
  title,
  value,
  sub,
  link,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  sub?: string;
  link: string;
  href: string;
}) {
  return (
    <Card className="p-5 rounded-2xl border-slate-100 shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        <div className="text-blue-600">{icon}</div>
        <p className="text-[10px] font-bold text-slate-400 uppercase">{title}</p>
      </div>
      <p className="text-xl font-bold">{value}</p>
      {sub && <p className="text-xs text-rose-500 font-bold">{sub}</p>}
      <Link to={href} className="text-[10px] font-bold text-blue-600 mt-2 block">
        {link} →
      </Link>
    </Card>
  );
}
