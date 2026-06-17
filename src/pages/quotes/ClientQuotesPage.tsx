import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { DataTable } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { PageLoader, PageError } from "@/components/PageLoader";
import { acceptQuote, getQuotesSummary, listQuotes, rejectQuote } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/format";
import { useIsClient } from "@/hooks/use-role";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Check, X } from "lucide-react";
import { toast } from "sonner";
import { GuvihostApiError } from "@/lib/guvihost-api";

const PER_PAGE = 10;

type QuoteRow = Record<string, unknown> & { id: string };

export default function ClientQuotesPage() {
  const isClient = useIsClient();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const summaryQuery = useQuery({
    queryKey: ["quotes-summary"],
    queryFn: getQuotesSummary,
    enabled: isClient,
  });

  const quotesQuery = useQuery({
    queryKey: ["client-quotes", page],
    queryFn: () => listQuotes({ page, limit: PER_PAGE }),
    enabled: isClient,
  });

  const acceptMutation = useMutation({
    mutationFn: (id: string) => acceptQuote(id),
    onSuccess: () => {
      toast.success("Quote accepted");
      qc.invalidateQueries({ queryKey: ["client-quotes"] });
      qc.invalidateQueries({ queryKey: ["quotes-summary"] });
    },
    onError: (err) => {
      toast.error(err instanceof GuvihostApiError ? err.message : "Failed to accept quote");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: () => rejectQuote(rejectId!, rejectReason || undefined),
    onSuccess: () => {
      toast.success("Quote rejected");
      setRejectOpen(false);
      setRejectId(null);
      setRejectReason("");
      qc.invalidateQueries({ queryKey: ["client-quotes"] });
      qc.invalidateQueries({ queryKey: ["quotes-summary"] });
    },
    onError: (err) => {
      toast.error(err instanceof GuvihostApiError ? err.message : "Failed to reject quote");
    },
  });

  if (!isClient) {
    return <PageError message="You must be signed in as a client to view quotes." />;
  }
  if (quotesQuery.isLoading) return <PageLoader message="Loading quotes..." />;
  if (quotesQuery.isError) {
    return (
      <PageError
        message={
          quotesQuery.error instanceof GuvihostApiError
            ? quotesQuery.error.message
            : "Failed to load quotes."
        }
      />
    );
  }

  const summary = summaryQuery.data as Record<string, number> | undefined;
  const items = (quotesQuery.data?.items ?? []) as QuoteRow[];
  const pagination = quotesQuery.data?.pagination ?? {
    page: 1,
    limit: PER_PAGE,
    total: 0,
    totalPages: 1,
  };

  const columns = [
    {
      key: "quoteNumber",
      label: "Quote",
      render: (row: QuoteRow) => (
        <div>
          <p className="font-semibold text-slate-800">{String(row.quoteNumber ?? row.id.slice(0, 8))}</p>
          <p className="text-xs text-slate-500">{String(row.subject ?? "")}</p>
        </div>
      ),
    },
    {
      key: "total",
      label: "Total",
      render: (row: QuoteRow) => (
        <span className="text-sm font-semibold">{formatCurrency(Number(row.total ?? 0))}</span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (row: QuoteRow) => <StatusBadge status={String(row.status ?? "").toLowerCase()} />,
    },
    {
      key: "validUntil",
      label: "Valid Until",
      render: (row: QuoteRow) => (
        <span className="text-xs text-slate-500">{formatDate(String(row.validUntil ?? ""))}</span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (row: QuoteRow) => {
        const status = String(row.status ?? "");
        if (status !== "SENT") return <span className="text-xs text-slate-400">—</span>;
        return (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1 text-emerald-600 border-emerald-200"
              disabled={acceptMutation.isPending}
              onClick={() => acceptMutation.mutate(row.id)}
            >
              <Check className="h-3 w-3" /> Accept
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1 text-rose-600 border-rose-200"
              onClick={() => {
                setRejectId(row.id);
                setRejectOpen(true);
              }}
            >
              <X className="h-3 w-3" /> Reject
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <AdminLayout>
      <div className="max-w-[1200px] mx-auto space-y-6 pb-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h1 className="text-[22px] font-bold text-slate-900 flex items-center gap-2">
            <FileText className="h-6 w-6 text-blue-600" />
            My Quotes
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {summary
              ? `${summary.pending ?? 0} pending · ${summary.accepted ?? 0} accepted · ${summary.rejected ?? 0} rejected`
              : "Review and respond to quotes from our team."}
          </p>
        </div>

        <DataTable
          columns={columns}
          data={items}
          total={pagination.total}
          page={pagination.page}
          perPage={pagination.limit}
          totalPages={pagination.totalPages}
          onPageChange={setPage}
          showDateFilter={false}
        />

        <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Quote</DialogTitle>
            </DialogHeader>
            <div>
              <Label>Reason (optional)</Label>
              <Input
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Why are you rejecting this quote?"
                className="mt-1.5"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRejectOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={rejectMutation.isPending}
                onClick={() => rejectMutation.mutate()}
              >
                {rejectMutation.isPending ? "Rejecting..." : "Reject Quote"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
