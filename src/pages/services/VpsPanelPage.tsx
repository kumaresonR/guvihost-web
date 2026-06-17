import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ClientRoute } from "@/components/ClientRoute";
import { PageLoader, PageError } from "@/components/PageLoader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createVpsBackup,
  createVpsSnapshot,
  getVpsNetwork,
  getVpsOsTemplates,
  getVpsOverview,
  listVpsBackups,
  listVpsSnapshots,
  restoreVpsBackup,
  updateVpsNetwork,
  vpsPowerAction,
  vpsReinstall,
} from "@/lib/api";
import { formatDateTime, formatEnumLabel } from "@/lib/format";
import { toast } from "sonner";
import { ArrowLeft, Camera, HardDrive, Play, Power, RotateCcw, Square } from "lucide-react";

export default function VpsPanelPage() {
  const { id = "" } = useParams();
  const queryClient = useQueryClient();
  const [snapshotName, setSnapshotName] = useState("");
  const [osTemplate, setOsTemplate] = useState("");
  const [reinstallConfirm, setReinstallConfirm] = useState(false);
  const [reverseDns, setReverseDns] = useState("");
  const [firewallEnabled, setFirewallEnabled] = useState(true);

  const overviewQuery = useQuery({
    queryKey: ["vps-overview", id],
    queryFn: () => getVpsOverview(id),
    enabled: Boolean(id),
  });

  const snapshotsQuery = useQuery({
    queryKey: ["vps-snapshots", id],
    queryFn: () => listVpsSnapshots(id),
    enabled: Boolean(id),
  });

  const backupsQuery = useQuery({
    queryKey: ["vps-backups", id],
    queryFn: () => listVpsBackups(id),
    enabled: Boolean(id),
  });

  const osTemplatesQuery = useQuery({
    queryKey: ["vps-os-templates"],
    queryFn: getVpsOsTemplates,
  });

  const networkQuery = useQuery({
    queryKey: ["vps-network", id],
    queryFn: () => getVpsNetwork(id),
    enabled: Boolean(id),
  });

  useEffect(() => {
    const net = networkQuery.data as Record<string, unknown> | undefined;
    if (!net) return;
    if (net.reverseDns) setReverseDns(String(net.reverseDns));
    if (typeof net.firewallEnabled === "boolean") setFirewallEnabled(net.firewallEnabled);
  }, [networkQuery.data]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["vps-overview", id] });
    queryClient.invalidateQueries({ queryKey: ["vps-snapshots", id] });
    queryClient.invalidateQueries({ queryKey: ["vps-backups", id] });
  };

  const powerMutation = useMutation({
    mutationFn: (action: "start" | "stop" | "reboot") => vpsPowerAction(id, action),
    onSuccess: (_, action) => {
      toast.success(`VPS ${action} initiated`);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const snapshotMutation = useMutation({
    mutationFn: () => createVpsSnapshot(id, snapshotName.trim() || `Snapshot ${new Date().toLocaleDateString()}`),
    onSuccess: () => {
      toast.success("Snapshot created");
      setSnapshotName("");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const backupMutation = useMutation({
    mutationFn: () => createVpsBackup(id),
    onSuccess: () => {
      toast.success("Backup created");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const restoreBackupMutation = useMutation({
    mutationFn: (backupId: string) => restoreVpsBackup(id, backupId),
    onSuccess: () => {
      toast.success("Backup restore initiated");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const reinstallMutation = useMutation({
    mutationFn: () => vpsReinstall(id, osTemplate),
    onSuccess: () => {
      toast.success("OS reinstall started");
      setReinstallConfirm(false);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const networkMutation = useMutation({
    mutationFn: () => updateVpsNetwork(id, { reverseDns: reverseDns || undefined, firewallEnabled }),
    onSuccess: () => {
      toast.success("Network settings updated");
      queryClient.invalidateQueries({ queryKey: ["vps-network", id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const templates = (osTemplatesQuery.data ?? []) as { id: string; label: string }[];

  if (overviewQuery.isLoading) return <PageLoader message="Loading VPS panel..." />;
  if (overviewQuery.isError) {
    return <PageError message={overviewQuery.error instanceof Error ? overviewQuery.error.message : "Failed to load VPS"} />;
  }

  const overview = overviewQuery.data!;
  const service = overview.service as Record<string, unknown>;
  const powerStatus = String(service.powerStatus ?? "RUNNING");
  const snapshots = snapshotsQuery.data ?? [];
  const backups = backupsQuery.data ?? [];
  const snapshotLimit = (overview.snapshots as { limit?: number })?.limit ?? 3;
  const backupLimit = (overview.backups as { limit?: number })?.limit ?? 5;

  return (
    <ClientRoute>
      <AdminLayout>
        <div className="p-6 bg-[#f8f9fa] min-h-full font-sans">
          <Link to={`/services/${id}`} className="inline-flex items-center gap-2 text-sm text-blue-600 mb-4">
            <ArrowLeft size={16} /> Back to service
          </Link>

          <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{String(service.name)}</h1>
              <p className="text-sm text-slate-500">VPS Control Panel · {String(service.hostname ?? service.domain ?? "")}</p>
            </div>
            <Badge>{formatEnumLabel(powerStatus)}</Badge>
          </div>

          <Card className="p-6 mb-6 rounded-2xl border-slate-100 shadow-sm">
            <h2 className="font-bold mb-4">Power Controls</h2>
            <div className="flex flex-wrap gap-3">
              <Button className="gap-2" disabled={powerMutation.isPending} onClick={() => powerMutation.mutate("start")}>
                <Play size={16} /> Start
              </Button>
              <Button variant="outline" className="gap-2" disabled={powerMutation.isPending} onClick={() => powerMutation.mutate("stop")}>
                <Square size={16} /> Stop
              </Button>
              <Button variant="outline" className="gap-2" disabled={powerMutation.isPending} onClick={() => powerMutation.mutate("reboot")}>
                <RotateCcw size={16} /> Reboot
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 text-sm">
              <Info label="IP" value={String(service.ipAddress ?? "—")} />
              <Info label="OS" value={String(service.os ?? "—")} />
              <Info label="Plan" value={String(service.planName ?? "—")} />
              <Info label="Status" value={formatEnumLabel(String(service.status ?? ""))} />
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6 rounded-2xl border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold flex items-center gap-2"><Camera size={18} /> Snapshots</h2>
                <span className="text-xs text-slate-500">{snapshots.length}/{snapshotLimit}</span>
              </div>
              <div className="flex gap-2 mb-4">
                <Input
                  placeholder="Snapshot name"
                  value={snapshotName}
                  onChange={(e) => setSnapshotName(e.target.value)}
                />
                <Button disabled={snapshotMutation.isPending || snapshots.length >= snapshotLimit} onClick={() => snapshotMutation.mutate()}>
                  Create
                </Button>
              </div>
              {snapshots.length === 0 ? (
                <p className="text-sm text-slate-500">No snapshots yet.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {snapshots.map((s) => (
                    <li key={String(s.id)} className="flex justify-between items-center border-b py-2">
                      <span className="font-medium">{String(s.name)}</span>
                      <span className="text-xs text-slate-400">{formatDateTime(s.createdAt as string)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card className="p-6 rounded-2xl border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold flex items-center gap-2"><HardDrive size={18} /> Backups</h2>
                <span className="text-xs text-slate-500">{backups.length}/{backupLimit}</span>
              </div>
              <Button
                className="mb-4 gap-2"
                disabled={backupMutation.isPending || backups.length >= backupLimit}
                onClick={() => backupMutation.mutate()}
              >
                <Power size={16} /> Create Backup
              </Button>
              {backups.length === 0 ? (
                <p className="text-sm text-slate-500">No backups yet.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {backups.map((b) => (
                    <li key={String(b.id)} className="flex justify-between items-center border-b py-2">
                      <div>
                        <p className="font-medium">{String(b.label ?? b.id)}</p>
                        <p className="text-xs text-slate-400">{formatDateTime(b.createdAt as string)}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={restoreBackupMutation.isPending}
                        onClick={() => restoreBackupMutation.mutate(String(b.id))}
                      >
                        Restore
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <Card className="p-6 rounded-2xl border-slate-100 shadow-sm">
              <h2 className="font-bold mb-4">Reinstall OS</h2>
              <p className="text-sm text-slate-500 mb-4">Reinstalling will erase all data on the VPS disk.</p>
              <div className="space-y-4">
                <div>
                  <Label>OS Template</Label>
                  <Select value={osTemplate} onValueChange={setOsTemplate}>
                    <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select OS" /></SelectTrigger>
                    <SelectContent>
                      {templates.map((t) => (
                        <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={reinstallConfirm}
                    onChange={(e) => setReinstallConfirm(e.target.checked)}
                  />
                  I understand all data will be erased
                </label>
                <Button
                  variant="destructive"
                  disabled={!osTemplate || !reinstallConfirm || reinstallMutation.isPending}
                  onClick={() => reinstallMutation.mutate()}
                >
                  Reinstall OS
                </Button>
              </div>
            </Card>

            <Card className="p-6 rounded-2xl border-slate-100 shadow-sm">
              <h2 className="font-bold mb-4">Network</h2>
              <div className="space-y-4">
                <div>
                  <Label>Reverse DNS (rDNS)</Label>
                  <Input className="mt-1.5" value={reverseDns} onChange={(e) => setReverseDns(e.target.value)} placeholder="vps.example.com" />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Firewall enabled</Label>
                  <Switch checked={firewallEnabled} onCheckedChange={setFirewallEnabled} />
                </div>
                <Button onClick={() => networkMutation.mutate()} disabled={networkMutation.isPending}>
                  Save Network Settings
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </AdminLayout>
    </ClientRoute>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-bold text-slate-400 uppercase">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
