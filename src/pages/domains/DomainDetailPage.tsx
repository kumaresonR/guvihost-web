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
  getDomain,
  renewDomain,
  setDomainAutoRenew,
  updateDomainNameservers,
} from "@/lib/api";
import { formatDate, formatEnumLabel } from "@/lib/format";
import { toast } from "sonner";
import { ArrowLeft, Globe, RefreshCw, Save } from "lucide-react";

export default function DomainDetailPage() {
  const { id = "" } = useParams();
  const queryClient = useQueryClient();
  const [ns1, setNs1] = useState("");
  const [ns2, setNs2] = useState("");
  const { data: domain, isLoading, isError, error } = useQuery({
    queryKey: ["domain", id],
    queryFn: () => getDomain(id),
    enabled: Boolean(id),
  });

  useEffect(() => {
    if (domain) {
      setNs1(String(domain.nameserver1 ?? ""));
      setNs2(String(domain.nameserver2 ?? ""));
    }
  }, [domain]);

  const renewMutation = useMutation({
    mutationFn: () => renewDomain(id),
    onSuccess: () => {
      toast.success("Domain renewed");
      queryClient.invalidateQueries({ queryKey: ["domain", id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const autoRenewMutation = useMutation({
    mutationFn: (autoRenew: boolean) => setDomainAutoRenew(id, autoRenew),
    onSuccess: () => {
      toast.success("Auto-renew updated");
      queryClient.invalidateQueries({ queryKey: ["domain", id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const nsMutation = useMutation({
    mutationFn: () => updateDomainNameservers(id, ns1.trim(), ns2.trim()),
    onSuccess: () => {
      toast.success("Nameservers updated");
      queryClient.invalidateQueries({ queryKey: ["domain", id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <PageLoader message="Loading domain..." />;
  if (isError) {
    return <PageError message={error instanceof Error ? error.message : "Failed to load domain"} />;
  }

  const d = domain!;
  const fqdn = `${d.name}${d.extension}`;

  return (
    <ClientRoute>
      <AdminLayout>
        <div className="p-6 bg-[#f8f9fa] min-h-full font-sans">
          <Link to="/domains" className="inline-flex items-center gap-2 text-sm text-blue-600 mb-4">
            <ArrowLeft size={16} /> Back to domains
          </Link>

          <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                <Globe size={20} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{fqdn}</h1>
                <p className="text-sm text-slate-500">Domain Management</p>
              </div>
            </div>
            <Badge>{formatEnumLabel(String(d.status))}</Badge>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 p-6 rounded-2xl border-slate-100 shadow-sm space-y-4">
              <h2 className="font-bold">Domain Information</h2>
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <Detail label="Registered" value={formatDate(d.registrationDate as string)} />
                <Detail label="Expires" value={formatDate(d.expiryDate as string)} />
                <Detail label="Registrar Lock" value={d.registrarLock ? "Enabled" : "Disabled"} />
                <Detail label="Privacy" value={d.privacyProtection ? "Enabled" : "Disabled"} />
              </dl>
            </Card>

            <Card className="p-6 rounded-2xl border-slate-100 shadow-sm space-y-5">
              <h2 className="font-bold">Actions</h2>
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-renew">Auto Renew</Label>
                <Switch
                  id="auto-renew"
                  checked={Boolean(d.autoRenew)}
                  disabled={autoRenewMutation.isPending}
                  onCheckedChange={(v) => autoRenewMutation.mutate(v)}
                />
              </div>
              <Button className="w-full gap-2" disabled={renewMutation.isPending} onClick={() => renewMutation.mutate()}>
                <RefreshCw size={16} /> Renew Domain
              </Button>
            </Card>
          </div>

          <Card className="p-6 mt-6 rounded-2xl border-slate-100 shadow-sm">
            <h2 className="font-bold mb-4">Nameservers</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl">
              <div>
                <Label htmlFor="ns1">Nameserver 1</Label>
                <Input id="ns1" value={ns1} onChange={(e) => setNs1(e.target.value)} placeholder="ns1.example.com" />
              </div>
              <div>
                <Label htmlFor="ns2">Nameserver 2</Label>
                <Input id="ns2" value={ns2} onChange={(e) => setNs2(e.target.value)} placeholder="ns2.example.com" />
              </div>
            </div>
            <Button
              className="mt-4 gap-2"
              disabled={nsMutation.isPending || !ns1.trim() || !ns2.trim()}
              onClick={() => nsMutation.mutate()}
            >
              <Save size={16} /> Update Nameservers
            </Button>
          </Card>
        </div>
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
