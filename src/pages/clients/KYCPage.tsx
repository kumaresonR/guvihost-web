import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PageError, PageLoader } from "@/components/PageLoader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getAdminKyc, getClient, rejectKyc, verifyKyc } from "@/lib/api";
import { formatDate, formatDateTime, formatEnumLabel, initials, userDisplayName } from "@/lib/format";
import { CheckCircle2, Clock, XCircle } from "lucide-react";

export default function KYCPage() {
  const [searchParams] = useSearchParams();
  const clientId = searchParams.get("clientId") ?? "";
  const [notes, setNotes] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const clientQuery = useQuery({
    queryKey: ["client", clientId],
    queryFn: () => getClient(clientId),
    enabled: Boolean(clientId),
  });

  const kycQuery = useQuery({
    queryKey: ["admin-kyc", clientId],
    queryFn: () => getAdminKyc(clientId),
    enabled: Boolean(clientId),
  });

  const verifyMutation = useMutation({
    mutationFn: () => verifyKyc(clientId, notes || undefined),
    onSuccess: () => {
      toast.success("KYC verified");
      queryClient.invalidateQueries({ queryKey: ["admin-kyc", clientId] });
      navigate("/clients/kyc-verification");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rejectMutation = useMutation({
    mutationFn: () => rejectKyc(clientId, rejectReason),
    onSuccess: () => {
      toast.success("KYC rejected");
      queryClient.invalidateQueries({ queryKey: ["admin-kyc", clientId] });
      navigate("/clients/kyc-verification");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!clientId) {
    return (
      <AdminLayout>
        <div className="p-6">
          <p className="text-slate-600">Select a client from the KYC queue to review.</p>
          <Button className="mt-4" onClick={() => navigate("/clients/kyc-verification")}>
            Go to KYC Queue
          </Button>
        </div>
      </AdminLayout>
    );
  }

  if (clientQuery.isLoading || kycQuery.isLoading) return <PageLoader />;
  if (clientQuery.isError || kycQuery.isError) {
    return <PageError message="Failed to load KYC details" />;
  }

  const client = clientQuery.data as Record<string, unknown>;
  const kyc = kycQuery.data as Record<string, unknown>;
  const name = userDisplayName(client as { firstName?: string; lastName?: string; email?: string });
  const documents = (kyc.documents as Record<string, unknown>[]) ?? [];

  return (
    <AdminLayout>
      <div className="min-h-full font-sans">
        <div className="mx-auto max-w-[1400px] space-y-6 p-4 sm:p-6">
          <Card className="flex flex-col items-start justify-between gap-6 rounded-2xl border-slate-100 p-6 shadow-sm md:flex-row md:items-center">
            <div className="flex items-center gap-5">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xl font-bold text-blue-600">
                {initials(name)}
              </div>
              <div>
                <div className="mb-1.5 flex items-center gap-3">
                  <h1 className="text-xl font-bold tracking-tight text-slate-900">{name}</h1>
                  <KycStatusBadge status={String(client.kycStatus ?? kyc.status ?? "")} />
                </div>
                <div className="flex flex-wrap items-center gap-2 text-[13px] font-medium text-slate-500">
                  <span>{String(client.clientCode ?? "")}</span>
                  <span className="text-slate-300">•</span>
                  <span>{String(client.email ?? "")}</span>
                  <span className="text-slate-300">•</span>
                  <span>{String(client.phone ?? "")}</span>
                </div>
                {client.company ? (
                  <p className="mt-1 text-[13px] text-slate-400">{String(client.company)}</p>
                ) : null}
              </div>
            </div>
            <div className="text-sm">
              <p className="text-slate-500">Joined</p>
              <p className="font-semibold text-slate-800">{formatDate(String(client.createdAt ?? ""))}</p>
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card className="space-y-4 rounded-2xl border-slate-100 p-6 shadow-sm lg:col-span-2">
              <h2 className="text-base font-bold text-slate-800">Documents</h2>
              {documents.length === 0 ? (
                <p className="text-sm text-slate-500">No documents uploaded yet.</p>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg border border-slate-100 p-3 text-sm">
                      <span className="font-medium">{formatEnumLabel(String(doc.docType ?? doc.label ?? "Document"))}</span>
                      <Badge variant="outline">{formatEnumLabel(String(doc.status ?? "PENDING"))}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card className="space-y-4 rounded-2xl border-slate-100 p-6 shadow-sm">
              <h2 className="text-base font-bold text-slate-800">Review Actions</h2>
              <div>
                <label className="text-xs font-semibold text-slate-600">Verification notes</label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="mt-1" />
              </div>
              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                onClick={() => verifyMutation.mutate()}
                disabled={verifyMutation.isPending}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" /> Approve KYC
              </Button>
              <div>
                <label className="text-xs font-semibold text-slate-600">Rejection reason</label>
                <Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={2} className="mt-1" />
              </div>
              <Button
                variant="outline"
                className="w-full border-rose-200 text-rose-600 hover:bg-rose-50"
                onClick={() => rejectMutation.mutate()}
                disabled={rejectMutation.isPending || !rejectReason.trim()}
              >
                <XCircle className="mr-2 h-4 w-4" /> Reject KYC
              </Button>
              {kyc.submittedAt ? (
                <p className="text-xs text-slate-500">Submitted {formatDateTime(String(kyc.submittedAt))}</p>
              ) : null}
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

function KycStatusBadge({ status }: { status: string }) {
  const label = formatEnumLabel(status);
  if (status === "VERIFIED") {
    return (
      <Badge className="border border-emerald-200 bg-emerald-50 px-2 py-0 text-[10px] font-bold uppercase tracking-wider text-emerald-600 hover:bg-emerald-50">
        <CheckCircle2 className="mr-1 h-3 w-3" /> {label}
      </Badge>
    );
  }
  if (status === "PENDING") {
    return (
      <Badge className="border border-amber-200 bg-amber-50 px-2 py-0 text-[10px] font-bold uppercase tracking-wider text-amber-600 hover:bg-amber-50">
        <Clock className="mr-1 h-3 w-3" /> {label}
      </Badge>
    );
  }
  return (
    <Badge className="border border-rose-200 bg-rose-50 px-2 py-0 text-[10px] font-bold uppercase tracking-wider text-rose-600 hover:bg-rose-50">
      <XCircle className="mr-1 h-3 w-3" /> {label}
    </Badge>
  );
}
