import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ClientRoute } from "@/components/ClientRoute";
import { PageLoader, PageError } from "@/components/PageLoader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  cancelService,
  getCpanelLoginUrl,
  getService,
  renewService,
  setServiceAutoRenew,
} from "@/lib/api";
import { formatCurrency, formatDate, formatDateTime, formatEnumLabel } from "@/lib/format";
import { toast } from "sonner";
import { ArrowLeft, ExternalLink, RefreshCw, Server, XCircle } from "lucide-react";

export default function ServiceDetailPage() {
  const { id = "" } = useParams();
  const queryClient = useQueryClient();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const { data: service, isLoading, isError, error } = useQuery({
    queryKey: ["service", id],
    queryFn: () => getService(id),
    enabled: Boolean(id),
  });

  const renewMutation = useMutation({
    mutationFn: () => renewService(id),
    onSuccess: () => {
      toast.success("Service renewed");
      queryClient.invalidateQueries({ queryKey: ["service", id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const autoRenewMutation = useMutation({
    mutationFn: (autoRenew: boolean) => setServiceAutoRenew(id, autoRenew),
    onSuccess: () => {
      toast.success("Auto-renew updated");
      queryClient.invalidateQueries({ queryKey: ["service", id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelService(id, cancelReason || undefined),
    onSuccess: () => {
      toast.success("Cancellation requested");
      setCancelOpen(false);
      queryClient.invalidateQueries({ queryKey: ["service", id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const cpanelMutation = useMutation({
    mutationFn: () => getCpanelLoginUrl(id),
    onSuccess: (res) => {
      window.open(res.url, "_blank", "noopener,noreferrer");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <PageLoader message="Loading service..." />;
  if (isError) {
    return <PageError message={error instanceof Error ? error.message : "Failed to load service"} />;
  }

  const svc = service!;
  const type = String(svc.type ?? "");
  const status = String(svc.status ?? "");
  const isVps = type === "VPS";
  const hasCpanel = Boolean(svc.cpanelUsername);
  const activities = (svc.activities as { id: string; description: string; createdAt: string }[]) ?? [];

  return (
    <ClientRoute>
      <AdminLayout>
        <div className="p-6 bg-[#f8f9fa] min-h-full font-sans">
          <Link to={isVps ? "/services/vps" : "/services/all"} className="inline-flex items-center gap-2 text-sm text-blue-600 mb-4">
            <ArrowLeft size={16} /> Back to services
          </Link>

          <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{String(svc.name)}</h1>
              <p className="text-sm text-slate-500">{String(svc.accountCode)} · {formatEnumLabel(type)}</p>
            </div>
            <Badge className="text-sm">{formatEnumLabel(status)}</Badge>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 p-6 rounded-2xl border-slate-100 shadow-sm space-y-4">
              <h2 className="font-bold">Service Details</h2>
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <Detail label="Domain" value={svc.domain ? String(svc.domain) : "—"} />
                <Detail label="Plan" value={String(svc.planName)} />
                <Detail label="Billing Cycle" value={formatEnumLabel(String(svc.billingCycle ?? "monthly"))} />
                <Detail label="Amount" value={formatCurrency(Number(svc.amount))} />
                <Detail label="Start Date" value={formatDate(svc.startDate as string)} />
                <Detail label="Next Due" value={formatDate(svc.nextDueDate as string)} />
                {svc.ipAddress && <Detail label="IP Address" value={String(svc.ipAddress)} />}
                {svc.os && <Detail label="OS" value={String(svc.os)} />}
              </dl>

              {activities.length > 0 && (
                <div className="pt-4 border-t">
                  <h3 className="font-semibold text-sm mb-3">Recent Activity</h3>
                  <ul className="space-y-2 text-sm text-slate-600">
                    {activities.map((a) => (
                      <li key={a.id} className="flex justify-between gap-2">
                        <span>{a.description}</span>
                        <span className="text-xs text-slate-400 shrink-0">{formatDateTime(a.createdAt)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>

            <Card className="p-6 rounded-2xl border-slate-100 shadow-sm space-y-5">
              <h2 className="font-bold">Actions</h2>

              <div className="flex items-center justify-between">
                <Label htmlFor="auto-renew">Auto Renew</Label>
                <Switch
                  id="auto-renew"
                  checked={Boolean(svc.autoRenew)}
                  disabled={autoRenewMutation.isPending}
                  onCheckedChange={(v) => autoRenewMutation.mutate(v)}
                />
              </div>

              <Button
                className="w-full gap-2"
                disabled={renewMutation.isPending || status === "CANCELLED"}
                onClick={() => renewMutation.mutate()}
              >
                <RefreshCw size={16} /> Renew Service
              </Button>

              {hasCpanel && (
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  disabled={cpanelMutation.isPending}
                  onClick={() => cpanelMutation.mutate()}
                >
                  <ExternalLink size={16} /> Open cPanel
                </Button>
              )}

              {isVps && (
                <Button variant="outline" className="w-full gap-2" asChild>
                  <Link to={`/services/${id}/vps`}>
                    <Server size={16} /> VPS Control Panel
                  </Link>
                </Button>
              )}

              <Button
                variant="destructive"
                className="w-full gap-2"
                disabled={status === "CANCELLED"}
                onClick={() => setCancelOpen(true)}
              >
                <XCircle size={16} /> Cancel Service
              </Button>
            </Card>
          </div>
        </div>

        <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cancel Service</DialogTitle>
            </DialogHeader>
            <Textarea
              placeholder="Reason for cancellation (optional)"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setCancelOpen(false)}>Keep Service</Button>
              <Button variant="destructive" disabled={cancelMutation.isPending} onClick={() => cancelMutation.mutate()}>
                Confirm Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AdminLayout>
    </ClientRoute>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-bold text-slate-400 uppercase">{label}</dt>
      <dd className="font-medium mt-0.5">{value}</dd>
    </div>
  );
}
