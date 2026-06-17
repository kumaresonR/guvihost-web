import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PageLoader, PageError } from "@/components/PageLoader";
import { listKycQueue } from "@/lib/api";
import { formatDate, formatEnumLabel, initials, userDisplayName } from "@/lib/format";
import { GuvihostApiError } from "@/lib/guvihost-api";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, ShieldCheck } from "lucide-react";

type KycQueueRow = {
  id: string;
  clientCode: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string;
  phone: string | null;
  company: string | null;
  kycStatus: string;
  updatedAt: string;
  createdAt: string;
};

export default function KYCVerification() {
  const [items, setItems] = useState<KycQueueRow[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadQueue = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listKycQueue({ page: pagination.page, limit: pagination.limit });
      setItems(res.items as KycQueueRow[]);
      setPagination(res.pagination);
    } catch (e) {
      const msg = e instanceof GuvihostApiError ? e.message : "Failed to load KYC queue";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit]);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  if (loading && items.length === 0) return <PageLoader message="Loading KYC queue..." />;
  if (error && items.length === 0) return <PageError message={error} />;

  return (
    <AdminLayout>
      <div className="p-6 bg-[#ffffff] min-h-full font-sans">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-slate-900">KYC Verification Queue</h1>
          <p className="text-sm text-slate-500 mt-1">Review and verify pending client KYC submissions.</p>
        </div>

        <Card className="rounded-2xl border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/80 border-b border-slate-100">
                <tr>
                  {["Client", "Email", "Phone", "Company", "KYC Status", "Submitted", "Action"].map((h) => (
                    <th key={h} className="py-4 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-sm text-slate-500">Loading...</td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-sm text-slate-500">No clients in the KYC queue.</td>
                  </tr>
                ) : (
                  items.map((row) => {
                    const name = userDisplayName(row);
                    return (
                      <tr key={row.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 font-bold flex items-center justify-center text-sm">
                              {initials(name)}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900">{name}</p>
                              <p className="text-xs text-slate-500">{row.clientCode ?? "—"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-6 text-sm text-slate-600">{row.email}</td>
                        <td className="py-3 px-6 text-sm text-slate-600">{row.phone ?? "—"}</td>
                        <td className="py-3 px-6 text-sm text-slate-600">{row.company ?? "—"}</td>
                        <td className="py-3 px-6">
                          <Badge className="bg-amber-50 text-amber-600 border-0">{formatEnumLabel(row.kycStatus)}</Badge>
                        </td>
                        <td className="py-3 px-6 text-sm text-slate-600 whitespace-nowrap">{formatDate(row.updatedAt)}</td>
                        <td className="py-3 px-6">
                          <Button asChild size="sm" className="gap-1.5 bg-blue-600 hover:bg-blue-700">
                            <Link to={`/clients/kyc?clientId=${row.id}`}>
                              <ShieldCheck size={14} /> Verify
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              {pagination.total} client{pagination.total !== 1 ? "s" : ""} in queue
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={pagination.page <= 1}
                onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                className="p-1.5 rounded hover:bg-slate-100 disabled:opacity-40"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm text-slate-600">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                type="button"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                className="p-1.5 rounded hover:bg-slate-100 disabled:opacity-40"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}
