import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ClientRoute } from "@/components/ClientRoute";
import { PageLoader, PageError } from "@/components/PageLoader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { listDomainTransfers } from "@/lib/api";
import { formatDate, formatEnumLabel } from "@/lib/format";
import { ArrowLeft, ArrowRightLeft, Plus } from "lucide-react";

export default function DomainTransfersPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["domain-transfers", page],
    queryFn: () => listDomainTransfers({ page, limit: 10 }),
  });

  if (isLoading) return <PageLoader message="Loading transfers..." />;
  if (isError) return <PageError message={error instanceof Error ? error.message : "Failed to load transfers"} />;

  const items = data?.items ?? [];
  const pagination = data?.pagination;

  return (
    <ClientRoute>
      <AdminLayout>
        <div className="p-6 bg-[#f8f9fa] min-h-full font-sans">
          <Link to="/domains" className="inline-flex items-center gap-2 text-sm text-blue-600 mb-4">
            <ArrowLeft size={16} /> Back to domains
          </Link>

          <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <ArrowRightLeft size={24} /> Domain Transfers
              </h1>
              <p className="text-sm text-slate-500 mt-1">Track incoming domain transfer requests.</p>
            </div>
            <Button asChild className="bg-blue-600 gap-2">
              <Link to="/domains/transfer"><Plus size={16} /> Transfer Domain</Link>
            </Button>
          </div>

          <Card className="rounded-2xl border-slate-100 shadow-sm overflow-hidden">
            {items.length === 0 ? (
              <p className="p-8 text-center text-sm text-slate-500">No domain transfers yet.</p>
            ) : (
              <div className="divide-y">
                {items.map((row) => {
                  const r = row as Record<string, unknown>;
                  const domain = `${r.name ?? ""}${r.extension ?? ""}`;
                  return (
                    <div key={String(r.id)} className="p-4 flex flex-wrap justify-between items-center gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{domain}</p>
                        <p className="text-xs text-slate-500">Started {formatDate(String(r.createdAt ?? ""))}</p>
                      </div>
                      <Badge variant="outline">{formatEnumLabel(String(r.status ?? "PENDING"))}</Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <span className="text-sm text-slate-500 self-center">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </AdminLayout>
    </ClientRoute>
  );
}
