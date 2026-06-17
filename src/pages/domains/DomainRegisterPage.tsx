import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ClientRoute } from "@/components/ClientRoute";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { registerDomain } from "@/lib/api";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

export default function DomainRegisterPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [name, setName] = useState(params.get("name") ?? "");
  const [extension, setExtension] = useState(params.get("extension") ?? ".com");
  const [years, setYears] = useState("1");
  const [autoRenew, setAutoRenew] = useState(true);
  const [privacyProtection, setPrivacyProtection] = useState(false);
  const [nameserver1, setNameserver1] = useState("");
  const [nameserver2, setNameserver2] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"WALLET" | "PAY_LATER">("PAY_LATER");

  useEffect(() => {
    if (params.get("name")) setName(params.get("name")!);
    if (params.get("extension")) setExtension(params.get("extension")!);
  }, [params]);

  const registerMutation = useMutation({
    mutationFn: () =>
      registerDomain({
        name: name.trim(),
        extension,
        years: Number(years),
        autoRenew,
        privacyProtection,
        nameserver1: nameserver1.trim() || undefined,
        nameserver2: nameserver2.trim() || undefined,
        paymentMethod,
      }),
    onSuccess: () => {
      toast.success("Domain registration submitted");
      navigate("/domains");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Domain name is required");
      return;
    }
    registerMutation.mutate();
  };

  return (
    <ClientRoute>
      <AdminLayout>
        <div className="p-6 bg-[#f8f9fa] min-h-full font-sans max-w-2xl">
          <Link to="/domains/search" className="inline-flex items-center gap-2 text-sm text-blue-600 mb-4">
            <ArrowLeft size={16} /> Back to search
          </Link>

          <h1 className="text-2xl font-bold text-slate-900 mb-6">Register Domain</h1>

          <Card className="p-6 rounded-2xl border-slate-100 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Domain Name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="mybusiness" />
                </div>
                <div>
                  <Label htmlFor="extension">Extension</Label>
                  <Input id="extension" value={extension} onChange={(e) => setExtension(e.target.value)} placeholder=".com" />
                </div>
              </div>

              <div>
                <Label>Registration Period</Label>
                <Select value={years} onValueChange={setYears}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 5, 10].map((y) => (
                      <SelectItem key={y} value={String(y)}>{y} year{y > 1 ? "s" : ""}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Payment Method</Label>
                <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as "WALLET" | "PAY_LATER")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WALLET">Wallet Balance</SelectItem>
                    <SelectItem value="PAY_LATER">Pay Later (Invoice)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ns1">Nameserver 1 (optional)</Label>
                  <Input id="ns1" value={nameserver1} onChange={(e) => setNameserver1(e.target.value)} placeholder="ns1.example.com" />
                </div>
                <div>
                  <Label htmlFor="ns2">Nameserver 2 (optional)</Label>
                  <Input id="ns2" value={nameserver2} onChange={(e) => setNameserver2(e.target.value)} placeholder="ns2.example.com" />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="auto-renew">Auto Renew</Label>
                <Switch id="auto-renew" checked={autoRenew} onCheckedChange={setAutoRenew} />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="privacy">Privacy Protection</Label>
                <Switch id="privacy" checked={privacyProtection} onCheckedChange={setPrivacyProtection} />
              </div>

              <Button type="submit" className="w-full bg-blue-600" disabled={registerMutation.isPending}>
                {registerMutation.isPending ? "Registering..." : "Register Domain"}
              </Button>
            </form>
          </Card>
        </div>
      </AdminLayout>
    </ClientRoute>
  );
}
