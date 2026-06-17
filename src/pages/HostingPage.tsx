import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PageError, PageLoader } from "@/components/PageLoader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getServicesHub } from "@/lib/api";
import { formatEnumLabel } from "@/lib/format";
import { useIsStaff } from "@/hooks/use-role";
import { getAdminDashboard } from "@/lib/api";
import { HardDrive, Globe, Mail, Server } from "lucide-react";

const TYPE_ICONS: Record<string, typeof Server> = {
  SHARED_HOSTING: HardDrive,
  VPS: Server,
  RESELLER_HOSTING: HardDrive,
  BUSINESS_EMAIL: Mail,
};

export default function HostingPage() {
  const isStaff = useIsStaff();

  const clientQuery = useQuery({ queryKey: ["services-hub"], queryFn: getServicesHub, enabled: !isStaff });
  const adminQuery = useQuery({ queryKey: ["admin-dashboard"], queryFn: getAdminDashboard, enabled: isStaff });

  const isLoading = isStaff ? adminQuery.isLoading : clientQuery.isLoading;
  const isError = isStaff ? adminQuery.isError : clientQuery.isError;
  const error = isStaff ? adminQuery.error : clientQuery.error;

  if (isLoading) return <PageLoader />;
  if (isError) return <PageError message={error instanceof Error ? error.message : "Failed to load hosting data"} />;

  const categories = isStaff
    ? (adminQuery.data?.servicesOverview ?? []).map((g) => ({
        type: g.type,
        active: g.count,
        pending: 0,
        suspended: 0,
      }))
    : (clientQuery.data?.categories ?? []);

  return (
    <AdminLayout>
      <div className="min-h-full bg-[#f8f9fa] p-6 font-sans">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Hosting Services</h1>
          <p className="text-sm text-slate-500">Overview of hosting products and quick links.</p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {categories.map((cat) => {
            const Icon = TYPE_ICONS[cat.type] ?? Server;
            const path =
              cat.type === "VPS"
                ? "/services/vps"
                : cat.type === "SHARED_HOSTING"
                  ? "/services/shared"
                  : cat.type === "BUSINESS_EMAIL"
                    ? "/services/email"
                    : "/services/all";
            return (
              <Card key={cat.type} className="rounded-2xl border-slate-100 p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-3">
                  <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                    <Icon size={24} />
                  </div>
                  <h2 className="font-bold text-slate-900">{formatEnumLabel(cat.type)}</h2>
                </div>
                <div className="mb-4 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-lg bg-emerald-50 p-2">
                    <p className="font-bold text-emerald-700">{cat.active}</p>
                    <p className="text-slate-500">Active</p>
                  </div>
                  <div className="rounded-lg bg-amber-50 p-2">
                    <p className="font-bold text-amber-700">{cat.pending}</p>
                    <p className="text-slate-500">Pending</p>
                  </div>
                  <div className="rounded-lg bg-rose-50 p-2">
                    <p className="font-bold text-rose-700">{cat.suspended}</p>
                    <p className="text-slate-500">Suspended</p>
                  </div>
                </div>
                <Button asChild className="w-full bg-blue-600">
                  <Link to={path}>Manage</Link>
                </Button>
              </Card>
            );
          })}
        </div>

        {!isStaff && clientQuery.data?.domains && (
          <Card className="mt-6 rounded-2xl border-slate-100 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Globe className="text-blue-600" />
                <div>
                  <h3 className="font-bold text-slate-900">Domains</h3>
                  <p className="text-sm text-slate-500">
                    {clientQuery.data.domains.active} active · {clientQuery.data.domains.expiringSoon} expiring soon
                  </p>
                </div>
              </div>
              <Button asChild variant="outline">
                <Link to="/domains">View Domains</Link>
              </Button>
            </div>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
