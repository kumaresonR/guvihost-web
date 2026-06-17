import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
import { transferDomain } from "@/lib/api";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

export default function DomainTransferPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [extension, setExtension] = useState(".com");
  const [authCode, setAuthCode] = useState("");
  const [years, setYears] = useState("1");
  const [autoRenew, setAutoRenew] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<"WALLET" | "PAY_LATER">("PAY_LATER");

  const transferMutation = useMutation({
    mutationFn: () =>
      transferDomain({
        name: name.trim(),
        extension,
        authCode: authCode.trim(),
        years: Number(years),
        autoRenew,
        paymentMethod,
      }),
    onSuccess: () => {
      toast.success("Domain transfer initiated");
      navigate("/domains/transfers");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !authCode.trim()) {
      toast.error("Domain name and auth code are required");
      return;
    }
    transferMutation.mutate();
  };

  return (
    <ClientRoute>
      <AdminLayout>
        <div className="p-6 bg-[#f8f9fa] min-h-full font-sans max-w-2xl">
          <Link to="/domains" className="inline-flex items-center gap-2 text-sm text-blue-600 mb-4">
            <ArrowLeft size={16} /> Back to domains
          </Link>

          <h1 className="text-2xl font-bold text-slate-900 mb-2">Transfer Domain</h1>
          <p className="text-sm text-slate-500 mb-6">
            Transfer a domain from another registrar using the EPP / auth code.
          </p>

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
                <Label htmlFor="authCode">Auth / EPP Code</Label>
                <Input
                  id="authCode"
                  value={authCode}
                  onChange={(e) => setAuthCode(e.target.value)}
                  placeholder="Enter authorization code"
                  required
                />
              </div>

              <div>
                <Label>Transfer Period</Label>
                <Select value={years} onValueChange={setYears}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 5].map((y) => (
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
                    <SelectItem value="WALLET">Wallet</SelectItem>
                    <SelectItem value="PAY_LATER">Pay Later (Invoice)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="autoRenew">Auto Renew</Label>
                <Switch id="autoRenew" checked={autoRenew} onCheckedChange={setAutoRenew} />
              </div>

              <Button type="submit" className="w-full bg-blue-600" disabled={transferMutation.isPending}>
                {transferMutation.isPending ? "Submitting..." : "Start Transfer"}
              </Button>
            </form>
          </Card>
        </div>
      </AdminLayout>
    </ClientRoute>
  );
}
