import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PageLoader, PageError } from "@/components/PageLoader";
import { DataTable } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  duplicateAdminQuote,
  getAdminQuote,
  sendAdminQuote,
  updateAdminQuote,
  deleteAdminQuote,
} from "@/lib/api";
import { formatCurrency, formatDate, userDisplayName } from "@/lib/format";
import { useIsStaff } from "@/hooks/use-role";
import { toast } from "sonner";
import { ArrowLeft, Copy, Send, Trash2 } from "lucide-react";

export default function AdminQuoteDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const isStaff = useIsStaff();
  const [subject, setSubject] = useState("");
  const [notes, setNotes] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [loaded, setLoaded] = useState(false);

  const quoteQuery = useQuery({
    queryKey: ["admin-quote", id],
    queryFn: () => getAdminQuote(id),
    enabled: isStaff && Boolean(id),
  });

  const quote = quoteQuery.data as Record<string, unknown> | undefined;

  useEffect(() => {
    if (!quote || loaded) return;
    setSubject(String(quote.subject ?? ""));
    setNotes(String(quote.notes ?? ""));
    setValidUntil(String(quote.validUntil ?? "").slice(0, 10));
    setLoaded(true);
  }, [quote, loaded]);

  const updateMutation = useMutation({
    mutationFn: () =>
      updateAdminQuote(id, {
        subject,
        notes: notes || undefined,
        validUntil: validUntil ? new Date(validUntil).toISOString() : undefined,
      }),
    onSuccess: () => {
      toast.success("Quote updated");
      qc.invalidateQueries({ queryKey: ["admin-quote", id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const sendMutation = useMutation({
    mutationFn: () => sendAdminQuote(id),
    onSuccess: () => {
      toast.success("Quote sent to client");
      qc.invalidateQueries({ queryKey: ["admin-quote", id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const duplicateMutation = useMutation({
    mutationFn: () => duplicateAdminQuote(id),
    onSuccess: (data) => {
      toast.success("Quote duplicated");
      const newId = (data as { id?: string })?.id;
      if (newId) navigate(`/admin/quotes/${newId}`);
      else qc.invalidateQueries({ queryKey: ["admin-quotes"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteAdminQuote(id),
    onSuccess: () => {
      toast.success("Quote deleted");
      navigate("/admin/quotes");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!isStaff) return <PageError message="Staff access required" />;
  if (quoteQuery.isLoading) return <PageLoader />;
  if (quoteQuery.isError || !quote) {
    return <PageError message={quoteQuery.error instanceof Error ? quoteQuery.error.message : "Quote not found"} />;
  }

  const items = (quote.items as Record<string, unknown>[]) ?? [];
  const user = quote.user as { firstName?: string; lastName?: string; email?: string } | undefined;
  const status = String(quote.status ?? "");
  const canEdit = status === "DRAFT" || status === "SENT";
  const canDelete = status === "DRAFT";

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <Link to="/admin/quotes" className="inline-flex items-center gap-2 text-sm text-blue-600">
          <ArrowLeft size={16} /> Back to quotes
        </Link>

        <div className="flex flex-wrap justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{String(quote.quoteNumber ?? id.slice(0, 8))}</h1>
            <p className="text-sm text-slate-500">{userDisplayName(user)} · {user?.email}</p>
          </div>
          <StatusBadge status={status.toLowerCase()} />
        </div>

        <Card className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Subject</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} disabled={!canEdit} />
            </div>
            <div>
              <Label>Valid Until</Label>
              <Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} disabled={!canEdit} />
            </div>
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} disabled={!canEdit} />
          </div>
          {canEdit && (
            <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
              Save Changes
            </Button>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="font-bold mb-4">Line Items</h2>
          <div className="space-y-2 text-sm">
            {items.map((item, i) => (
              <div key={i} className="flex justify-between border-b py-2">
                <span>{String(item.name)} × {String(item.quantity)}</span>
                <span className="font-medium">{formatCurrency(Number(item.total ?? item.unitPrice ?? 0))}</span>
              </div>
            ))}
            <div className="flex justify-between pt-2 font-bold">
              <span>Total</span>
              <span>{formatCurrency(Number(quote.total ?? 0))}</span>
            </div>
          </div>
        </Card>

        <div className="flex flex-wrap gap-2">
          {status === "DRAFT" && (
            <Button className="gap-2 bg-blue-600" onClick={() => sendMutation.mutate()} disabled={sendMutation.isPending}>
              <Send size={16} /> Send to Client
            </Button>
          )}
          <Button variant="outline" className="gap-2" onClick={() => duplicateMutation.mutate()} disabled={duplicateMutation.isPending}>
            <Copy size={16} /> Duplicate
          </Button>
          {canDelete && (
            <Button
              variant="outline"
              className="gap-2 text-rose-600 border-rose-200"
              onClick={() => {
                if (confirm("Delete this draft quote?")) deleteMutation.mutate();
              }}
              disabled={deleteMutation.isPending}
            >
              <Trash2 size={16} /> Delete
            </Button>
          )}
        </div>

        <p className="text-xs text-slate-400">Created {formatDate(String(quote.createdAt ?? ""))}</p>
      </div>
    </AdminLayout>
  );
}
