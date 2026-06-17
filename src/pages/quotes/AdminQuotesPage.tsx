import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { DataTable } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { PageLoader, PageError } from "@/components/PageLoader";
import { createAdminQuote, listAdminQuotes, listClients } from "@/lib/api";
import { formatCurrency, formatDate, userDisplayName } from "@/lib/format";
import { useIsStaff } from "@/hooks/use-role";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileText, Plus } from "lucide-react";
import { toast } from "sonner";
import { GuvihostApiError } from "@/lib/guvihost-api";

const PER_PAGE = 10;

type QuoteRow = Record<string, unknown> & { id: string };

export default function AdminQuotesPage() {
  const isStaff = useIsStaff();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    userId: "",
    subject: "",
    notes: "",
    validUntil: "",
    itemName: "",
    itemType: "SERVICE",
    quantity: "1",
    unitPrice: "",
    sendImmediately: false,
  });

  const quotesQuery = useQuery({
    queryKey: ["admin-quotes", page, search],
    queryFn: () =>
      listAdminQuotes({ page, limit: PER_PAGE, search: search || undefined }),
    enabled: isStaff,
  });

  const clientsQuery = useQuery({
    queryKey: ["clients-picker"],
    queryFn: () => listClients({ page: 1, limit: 100 }),
    enabled: isStaff && createOpen,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createAdminQuote({
        userId: form.userId,
        subject: form.subject,
        notes: form.notes || undefined,
        validUntil: form.validUntil,
        sendImmediately: form.sendImmediately,
        items: [
          {
            itemType: form.itemType,
            name: form.itemName,
            quantity: parseInt(form.quantity, 10) || 1,
            unitPrice: parseFloat(form.unitPrice),
          },
        ],
      }),
    onSuccess: () => {
      toast.success("Quote created");
      setCreateOpen(false);
      qc.invalidateQueries({ queryKey: ["admin-quotes"] });
    },
    onError: (err) => {
      toast.error(err instanceof GuvihostApiError ? err.message : "Failed to create quote");
    },
  });

  if (!isStaff) {
    return <PageError message="You must be signed in as staff to manage quotes." />;
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

  const items = (quotesQuery.data?.items ?? []) as QuoteRow[];
  const pagination = quotesQuery.data?.pagination ?? {
    page: 1,
    limit: PER_PAGE,
    total: 0,
    totalPages: 1,
  };
  const clients = (clientsQuery.data?.items ?? []) as Record<string, unknown>[];

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
      key: "client",
      label: "Client",
      render: (row: QuoteRow) => {
        const user = row.user as { firstName?: string; lastName?: string; email?: string } | undefined;
        return <span className="text-sm text-slate-700">{userDisplayName(user)}</span>;
      },
    },
    {
      key: "total",
      label: "Total",
      render: (row: QuoteRow) => (
        <span className="text-sm font-semibold text-slate-800">{formatCurrency(Number(row.total ?? 0))}</span>
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
      key: "createdAt",
      label: "Created",
      render: (row: QuoteRow) => (
        <span className="text-xs text-slate-500">{formatDate(String(row.createdAt ?? ""))}</span>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="max-w-[1600px] mx-auto space-y-6 pb-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-[22px] font-bold text-slate-900 flex items-center gap-2">
              <FileText className="h-6 w-6 text-blue-600" />
              Admin Quotes
            </h1>
            <p className="text-sm text-slate-500 mt-1">Create and manage client quotes.</p>
          </div>
          <Button className="gap-2" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Create Quote
          </Button>
        </div>

        <DataTable
          columns={columns}
          data={items}
          total={pagination.total}
          page={pagination.page}
          perPage={pagination.limit}
          totalPages={pagination.totalPages}
          onPageChange={setPage}
          searchPlaceholder="Search quotes..."
          onSearch={(q) => {
            setSearch(q);
            setPage(1);
          }}
          onRowClick={(row) => navigate(`/admin/quotes/${row.id}`)}
          showDateFilter={false}
        />

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Quote</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Client</Label>
                <select
                  value={form.userId}
                  onChange={(e) => setForm((f) => ({ ...f, userId: e.target.value }))}
                  className="mt-1.5 w-full h-10 rounded-md border border-slate-200 px-3 text-sm bg-white"
                  required
                >
                  <option value="">Select client</option>
                  {clients.map((c) => (
                    <option key={String(c.id)} value={String(c.id)}>
                      {userDisplayName(c as { firstName?: string; lastName?: string; email?: string })} ({String(c.email)})
                    </option>
                  ))}
                </select>
              </div>
              <Field label="Subject" value={form.subject} onChange={(v) => setForm((f) => ({ ...f, subject: v }))} />
              <Field label="Valid Until" type="date" value={form.validUntil} onChange={(v) => setForm((f) => ({ ...f, validUntil: v }))} />
              <Field label="Line Item Name" value={form.itemName} onChange={(v) => setForm((f) => ({ ...f, itemName: v }))} />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Quantity" value={form.quantity} onChange={(v) => setForm((f) => ({ ...f, quantity: v }))} />
                <Field label="Unit Price" value={form.unitPrice} onChange={(v) => setForm((f) => ({ ...f, unitPrice: v }))} />
              </div>
              <div>
                <Label>Notes</Label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  className="mt-1.5 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.sendImmediately}
                  onChange={(e) => setForm((f) => ({ ...f, sendImmediately: e.target.checked }))}
                />
                Send to client immediately
              </label>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button
                disabled={
                  createMutation.isPending ||
                  !form.userId ||
                  !form.subject ||
                  !form.validUntil ||
                  !form.itemName ||
                  !form.unitPrice
                }
                onClick={() => createMutation.mutate()}
              >
                {createMutation.isPending ? "Creating..." : "Create Quote"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="mt-1.5" />
    </div>
  );
}
