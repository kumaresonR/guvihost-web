import { useCallback, useEffect, useState } from "react";
import { getServiceStats, getServicesReport, listServices } from "@/lib/api";
import { GuvihostApiError } from "@/lib/guvihost-api";
import { useIsStaff } from "@/hooks/use-role";
import { toast } from "sonner";

type ServiceRow = {
  id: string;
  name: string;
  domain: string | null;
  planName: string;
  status: string;
  ipAddress: string | null;
  os: string | null;
  amount: number | string;
  createdAt: string;
  accountCode: string;
};

type Stats = { total: number; active: number; pending: number; suspended: number };

type ReportByType = { type: string; count: number; mrrEstimate?: number };

export function useTypeServicesPage(serviceType: string | null, title: string) {
  const isStaff = useIsStaff();
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [reportByType, setReportByType] = useState<ReportByType[]>([]);
  const [reportTotal, setReportTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (isStaff) {
        const report = await getServicesReport();
        const byType = (report.byType as ReportByType[]) ?? [];
        setReportByType(serviceType ? byType.filter((t) => t.type === serviceType) : byType);
        const summary = report.summary as { total?: number } | undefined;
        setReportTotal(summary?.total ?? null);
        setServices([]);
        setStats(null);
      } else if (serviceType) {
        const [listRes, statsRes] = await Promise.all([
          listServices({ type: serviceType, search: search.trim() || undefined, limit: 50 }),
          getServiceStats(serviceType),
        ]);
        setServices(listRes.items as ServiceRow[]);
        setStats(statsRes as Stats);
      } else {
        setServices([]);
        setStats(null);
      }
    } catch (e) {
      const msg = e instanceof GuvihostApiError ? e.message : `Failed to load ${title}`;
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [isStaff, serviceType, search, title]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    isStaff,
    services,
    stats,
    reportByType,
    reportTotal,
    loading,
    error,
    search,
    setSearch,
    reload: load,
  };
}

export type { ServiceRow, Stats, ReportByType };
