import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PageLoader, PageError } from "@/components/PageLoader";
import { getAdminDashboard, getServicesHub, getServicesReport } from "@/lib/api";
import { formatEnumLabel } from "@/lib/format";
import { GuvihostApiError } from "@/lib/guvihost-api";
import { useIsStaff } from "@/hooks/use-role";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, HardDrive, Globe, Mail, ShieldCheck, Headset, BookOpen, Info } from "lucide-react";

const TYPE_ROUTES: Record<string, string> = {
  VPS: "/services/vps",
  SHARED_HOSTING: "/services/shared",
  RESELLER_HOSTING: "/services/all",
  BUSINESS_EMAIL: "/services/email",
};

const TYPE_LABELS: Record<string, string> = {
  VPS: "VPS Hosting",
  SHARED_HOSTING: "Shared Hosting",
  RESELLER_HOSTING: "Reseller Hosting",
  BUSINESS_EMAIL: "Business Email",
};

export default function AllServicesPage() {
  const isStaff = useIsStaff();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<{ type: string; active: number; pending: number; suspended: number }[]>([]);
  const [domains, setDomains] = useState<{ active: number; pending: number; expiringSoon: number } | null>(null);
  const [reportTotal, setReportTotal] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        if (isStaff) {
          const [dashboard, report] = await Promise.all([getAdminDashboard(), getServicesReport()]);
          if (cancelled) return;
          setCategories(
            dashboard.servicesOverview.map((s) => ({
              type: s.type,
              active: s.count,
              pending: 0,
              suspended: 0,
            }))
          );
          const summary = report.summary as { total?: number } | undefined;
          setReportTotal(summary?.total ?? null);
        } else {
          const hub = await getServicesHub();
          if (cancelled) return;
          setCategories(hub.categories);
          setDomains(hub.domains);
        }
      } catch (e) {
        if (!cancelled) {
          const msg = e instanceof GuvihostApiError ? e.message : "Failed to load services";
          setError(msg);
          toast.error(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isStaff]);

  if (loading) return <PageLoader message="Loading services..." />;
  if (error) return <PageError message={error} />;

  return (
    <AdminLayout>
      <div className="p-6 bg-[#f8f9fa] min-h-full font-sans">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">All Services</h1>
            <p className="text-sm text-slate-500">
              {isStaff ? "Platform-wide service overview." : "Manage all your hosting services from one place."}
            </p>
          </div>
          {!isStaff && (
            <Button className="bg-blue-600 gap-2" asChild>
              <Link to="/services/order">
                <Plus size={16} /> Add New Service
              </Link>
            </Button>
          )}
        </div>

        {isStaff && reportTotal !== null && (
          <Card className="p-4 mb-6 rounded-2xl border-amber-100 bg-amber-50/50 text-sm text-amber-800">
            Admin view: {reportTotal.toLocaleString()} total services across all clients. Per-client service lists are available in the client portal.
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {categories.map((cat) => (
            <ServiceCard
              key={cat.type}
              title={TYPE_LABELS[cat.type] ?? formatEnumLabel(cat.type)}
              count={{ active: cat.active, pending: cat.pending, suspended: cat.suspended }}
              btn={`Manage ${TYPE_LABELS[cat.type]?.split(" ")[0] ?? "Service"}`}
              icon={cat.type === "BUSINESS_EMAIL" ? <Mail size={32} /> : cat.type.includes("RESELLER") ? <ShieldCheck size={32} /> : <HardDrive size={32} />}
              to={TYPE_ROUTES[cat.type] ?? "/services/all"}
            />
          ))}
          {!isStaff && domains && (
            <ServiceCard
              title="Domains"
              count={{ active: domains.active, pending: domains.pending, suspended: domains.expiringSoon }}
              btn="Manage Domains"
              icon={<Globe size={32} />}
              to="/domains"
            />
          )}
        </div>

        <Card className="p-4 mb-8 rounded-2xl border-blue-100 bg-blue-50/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Info className="text-blue-600" />
            <div>
              <p className="font-bold text-sm">Need Help?</p>
              <p className="text-xs text-slate-600">Our support team is available 24/7 to help you with your services.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2" asChild><Link to="/support/create"><Headset size={14} /> Open Support Ticket</Link></Button>
            <Button variant="outline" size="sm" className="gap-2" asChild><Link to="/kb"><BookOpen size={14} /> View Knowledge Base</Link></Button>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}

function ServiceCard({ title, count, btn, icon, to }: {
  title: string;
  count: { active: number; pending: number; suspended: number };
  btn: string;
  icon: React.ReactNode;
  to: string;
}) {
  return (
    <Card className="p-6 rounded-2xl border-slate-100 shadow-sm">
      <div className="flex justify-between mb-4">
        <h3 className="font-bold text-lg">{title}</h3>
        <div className="text-blue-600">{icon}</div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center mb-6 border-t pt-4">
        {[{ l: "Active", v: count.active }, { l: "Pending", v: count.pending }, { l: "Suspended", v: count.suspended }].map((c) => (
          <div key={c.l}>
            <p className="text-[9px] font-bold text-slate-400 uppercase">{c.l}</p>
            <p className="font-bold">{c.v}</p>
          </div>
        ))}
      </div>
      <Button variant="outline" className="w-full text-blue-600 border-blue-100" asChild>
        <Link to={to}>{btn} →</Link>
      </Button>
    </Card>
  );
}
