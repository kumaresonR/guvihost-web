import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PageLoader, PageError } from "@/components/PageLoader";
import { getAdminDashboard, getDomainsSummary, getServicesReport, listDomains } from "@/lib/api";
import { formatDate, formatEnumLabel } from "@/lib/format";
import { GuvihostApiError } from "@/lib/guvihost-api";
import { useIsStaff } from "@/hooks/use-role";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Settings, MoreHorizontal, Globe, Info } from "lucide-react";

type DomainRow = {
  id: string;
  name: string;
  extension: string;
  status: string;
  registrationDate: string;
  expiryDate: string;
  autoRenew: boolean;
};

type DomainSummary = {
  total: number;
  active: number;
  expiringSoon: number;
  expired: number;
  pending?: number;
};

export default function DomainsPage() {
  const isStaff = useIsStaff();
  const [summary, setSummary] = useState<DomainSummary | null>(null);
  const [domains, setDomains] = useState<DomainRow[]>([]);
  const [adminOverview, setAdminOverview] = useState<{ type: string; count: number }[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (isStaff) {
        const [dashboard, report] = await Promise.all([getAdminDashboard(), getServicesReport()]);
        setAdminOverview(dashboard.servicesOverview);
        const byType = (report.byType as { type: string; count: number }[]) ?? [];
        const domainType = byType.find((t) => t.type === "DOMAIN");
        setSummary({
          total: domainType?.count ?? dashboard.summary.activeServices,
          active: dashboard.summary.activeClients,
          expiringSoon: dashboard.summary.dueForRenewal,
          expired: 0,
        });
        setDomains([]);
      } else {
        const [summaryRes, listRes] = await Promise.all([
          getDomainsSummary(),
          listDomains({ search: debouncedSearch || undefined, limit: 50 }),
        ]);
        setSummary(summaryRes as DomainSummary);
        setDomains(listRes.items as DomainRow[]);
      }
    } catch (e) {
      const msg = e instanceof GuvihostApiError ? e.message : "Failed to load domains";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [isStaff, debouncedSearch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading && !summary) return <PageLoader message="Loading domains..." />;
  if (error && !summary) return <PageError message={error} />;

  const kpis = [
    { l: "Total Domains", v: summary?.total ?? 0 },
    { l: "Active Domains", v: summary?.active ?? 0 },
    { l: "Expiring Soon", v: summary?.expiringSoon ?? 0 },
    { l: "Expired Domains", v: summary?.expired ?? 0 },
  ];

  return (
    <AdminLayout>
      <div className="p-6 bg-[#ffffff] min-h-full font-sans">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-xl font-bold text-slate-900">{isStaff ? "Domains Overview" : "My Domains"}</h1>
            <p className="text-sm text-slate-500">Dashboard / Domains</p>
          </div>
          {!isStaff && (
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2" asChild>
                <Link to="/domains/transfers">Transfers</Link>
              </Button>
              <Button variant="outline" className="gap-2" asChild>
                <Link to="/domains/transfer">Transfer In</Link>
              </Button>
              <Button className="bg-blue-600 gap-2" asChild>
                <Link to="/domains/search"><Plus size={16} /> Register Domain</Link>
              </Button>
            </div>
          )}
        </div>

        {isStaff && (
          <Card className="p-4 mb-6 rounded-2xl border-amber-100 bg-amber-50/50 flex gap-3 text-sm text-amber-800">
            <Info className="shrink-0 mt-0.5" size={18} />
            <p>Admin view: domain lists are client-scoped. Stats below combine dashboard and services report data.</p>
          </Card>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {kpis.map((k) => (
            <Card key={k.l} className="p-5 rounded-2xl border-slate-100 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase mb-1">{k.l}</p>
              <p className="text-xl font-bold text-slate-900">{k.v}</p>
            </Card>
          ))}
        </div>

        {isStaff && adminOverview.length > 0 && (
          <Card className="p-6 mb-8 rounded-2xl border-slate-100 shadow-sm">
            <h2 className="font-bold mb-4">Services Overview (Admin Dashboard)</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {adminOverview.map((s) => (
                <div key={s.type} className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-xs text-slate-500 uppercase font-bold">{formatEnumLabel(s.type)}</p>
                  <p className="text-lg font-bold">{s.count}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {!isStaff && (
          <Card className="p-6 mb-8 rounded-2xl border-slate-100 shadow-sm">
            <div className="flex gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 text-slate-400" size={16} />
                <Input className="pl-10" placeholder="Search by domain name..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>
            <table className="w-full text-sm">
              <thead className="text-slate-400 text-xs uppercase font-bold border-b">
                <tr>
                  {["Domain Name", "Extension", "Status", "Registration Date", "Expiry Date", "Auto Renew", "Actions"].map((h) => (
                    <th key={h} className="pb-4 text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr><td colSpan={7} className="py-6 text-center text-slate-500">Loading...</td></tr>
                ) : domains.length === 0 ? (
                  <tr><td colSpan={7} className="py-6 text-center text-slate-500">No domains found.</td></tr>
                ) : (
                  domains.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50">
                      <td className="py-4 font-bold flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">
                          <Globe size={14} />
                        </div>
                        {d.name}
                      </td>
                      <td className="py-4">{d.extension}</td>
                      <td className="py-4"><Badge className={getStatusClass(d.status)}>{formatEnumLabel(d.status)}</Badge></td>
                      <td className="py-4 text-slate-500">{formatDate(d.registrationDate)}</td>
                      <td className="py-4 text-slate-500">{formatDate(d.expiryDate)}</td>
                      <td className="py-4">{d.autoRenew ? "Yes" : "No"}</td>
                      <td className="py-4 flex gap-2">
                        <Button variant="outline" size="sm" className="gap-2" asChild><Link to={`/domains/${d.id}`}><Settings size={14} /> Manage</Link></Button>
                        <Button variant="ghost" size="sm"><MoreHorizontal size={14} /></Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}

function getStatusClass(status: string) {
  const map: Record<string, string> = {
    ACTIVE: "bg-emerald-50 text-emerald-600",
    EXPIRING_SOON: "bg-amber-50 text-amber-600",
    EXPIRED: "bg-rose-50 text-rose-600",
    PENDING: "bg-amber-50 text-amber-600",
  };
  return map[status] ?? "bg-slate-100";
}
