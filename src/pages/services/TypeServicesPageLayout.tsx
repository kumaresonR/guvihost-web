import React from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PageLoader, PageError } from "@/components/PageLoader";
import { formatCurrency, formatDate, formatEnumLabel } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Settings, Info } from "lucide-react";
import { useTypeServicesPage, type ServiceRow } from "./useTypeServicesPage";

type Props = {
  title: string;
  serviceType: string | null;
  breadcrumb?: string;
  emptyMessage?: string;
};

export default function TypeServicesPageLayout({ title, serviceType, breadcrumb, emptyMessage }: Props) {
  const { isStaff, services, stats, reportByType, reportTotal, loading, error, search, setSearch } =
    useTypeServicesPage(serviceType, title);

  if (loading && !stats && services.length === 0 && reportByType.length === 0) {
    return <PageLoader message={`Loading ${title}...`} />;
  }
  if (error && !stats && services.length === 0) return <PageError message={error} />;

  return (
    <AdminLayout>
      <div className="p-6 bg-[#ffffff] min-h-full font-sans">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-xl font-bold text-slate-900">{title}</h1>
            <p className="text-sm text-slate-500">{breadcrumb ?? `Dashboard / Services / ${title}`}</p>
          </div>
          {!isStaff && (
            <Button className="bg-blue-600 gap-2" asChild>
              <Link to={serviceType ? `/services/order?type=${serviceType}` : "/services/order"}>
                <Plus size={16} /> Order New
              </Link>
            </Button>
          )}
        </div>

        {isStaff ? (
          <>
            <Card className="p-4 mb-6 rounded-2xl border-amber-100 bg-amber-50/50 flex gap-3 text-sm text-amber-800">
              <Info className="shrink-0 mt-0.5" size={18} />
              <p>
                Admin view: per-service lists are client-scoped. Below is the platform report
                {reportTotal !== null ? ` (${reportTotal.toLocaleString()} total services)` : ""}.
              </p>
            </Card>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {(reportByType.length ? reportByType : [{ type: serviceType ?? "ALL", count: 0 }]).map((row) => (
                <Card key={row.type} className="p-5 rounded-2xl border-slate-100 shadow-sm">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-1">{formatEnumLabel(row.type)}</p>
                  <p className="text-xl font-bold text-slate-900">{row.count}</p>
                  {"mrrEstimate" in row && row.mrrEstimate != null && (
                    <p className="text-xs text-slate-500 mt-1">MRR est. {formatCurrency(Number(row.mrrEstimate))}</p>
                  )}
                </Card>
              ))}
            </div>
          </>
        ) : (
          stats && (
            <div className="grid grid-cols-4 gap-4 mb-8">
              <KpiCard title={`Total ${title}`} value={stats.total} />
              <KpiCard title="Active" value={stats.active} color="text-emerald-600" />
              <KpiCard title="Pending" value={stats.pending} color="text-amber-500" />
              <KpiCard title="Suspended" value={stats.suspended} color="text-rose-600" />
            </div>
          )
        )}

        {!isStaff && (
          <Card className="p-6 mb-8 rounded-2xl border-slate-100 shadow-sm">
            <div className="flex gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 text-slate-400" size={16} />
                <Input className="pl-10" placeholder="Search services..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>
            <ServiceTable services={services} loading={loading} emptyMessage={emptyMessage} />
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}

function KpiCard({ title, value, color = "text-slate-900" }: { title: string; value: number; color?: string }) {
  return (
    <Card className="p-5 rounded-2xl border-slate-100 shadow-sm">
      <p className="text-xs font-bold text-slate-400 uppercase mb-1">{title}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </Card>
  );
}

function ServiceTable({ services, loading, emptyMessage }: { services: ServiceRow[]; loading: boolean; emptyMessage?: string }) {
  return (
    <table className="w-full text-sm">
      <thead className="text-slate-400 text-xs uppercase font-bold border-b">
        <tr>
          {["Name", "Domain", "Plan", "Status", "Created", "Amount", "Actions"].map((h) => (
            <th key={h} className="pb-4 text-left">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y">
        {loading ? (
          <tr><td colSpan={7} className="py-6 text-center text-slate-500">Loading...</td></tr>
        ) : services.length === 0 ? (
          <tr><td colSpan={7} className="py-6 text-center text-slate-500">{emptyMessage ?? "No services found."}</td></tr>
        ) : (
          services.map((s) => (
            <tr key={s.id} className="hover:bg-slate-50">
              <td className="py-4 font-bold text-slate-900">{s.name}</td>
              <td className="py-4">{s.domain ?? "—"}</td>
              <td className="py-4 text-xs text-slate-500">{s.planName}</td>
              <td className="py-4"><Badge className={statusClass(s.status)}>{formatEnumLabel(s.status)}</Badge></td>
              <td className="py-4 text-slate-500">{formatDate(s.createdAt)}</td>
              <td className="py-4 font-bold">{formatCurrency(Number(s.amount))}</td>
              <td className="py-4"><Button variant="outline" size="sm" className="gap-2" asChild><Link to={`/services/${s.id}`}><Settings size={14} /> Manage</Link></Button></td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}

function statusClass(status: string) {
  const map: Record<string, string> = {
    ACTIVE: "bg-emerald-50 text-emerald-600",
    PENDING: "bg-amber-50 text-amber-600",
    SUSPENDED: "bg-rose-50 text-rose-600",
    EXPIRED: "bg-rose-50 text-rose-600",
    CANCELLED: "bg-slate-100 text-slate-600",
  };
  return map[status] ?? "bg-slate-100";
}
