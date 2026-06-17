import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PageError } from "@/components/PageLoader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Wallet } from "lucide-react";
import { toast } from "sonner";
import { useIsClient } from "@/hooks/use-role";
import { addFunds } from "@/lib/api/commerce";
import { formatCurrency } from "@/lib/format";
import { GuvihostApiError } from "@/lib/guvihost-api";

const PRESET_AMOUNTS = [500, 1000, 2500, 5000, 10000];

export default function AddFundsPage() {
  const isClient = useIsClient();
  const qc = useQueryClient();
  const [amount, setAmount] = useState("1000");

  const addFundsMutation = useMutation({
    mutationFn: (value: number) => addFunds(value),
    onSuccess: (result) => {
      const balance = (result as { balance?: number }).balance;
      toast.success(
        balance !== undefined
          ? `Funds added. New balance: ${formatCurrency(balance)}`
          : "Funds added successfully"
      );
      qc.invalidateQueries({ queryKey: ["billingDashboard"] });
      qc.invalidateQueries({ queryKey: ["clientDashboard"] });
    },
    onError: (err) => {
      toast.error(err instanceof GuvihostApiError ? err.message : "Failed to add funds");
    },
  });

  if (!isClient) {
    return <PageError message="You must be signed in as a client to add funds." />;
  }

  const parsedAmount = parseFloat(amount);
  const isValid = !Number.isNaN(parsedAmount) && parsedAmount > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) {
      toast.error("Enter a valid amount greater than zero");
      return;
    }
    addFundsMutation.mutate(parsedAmount);
  };

  return (
    <AdminLayout>
      <div className="p-6 bg-[#ffffff] min-h-full font-sans max-w-lg mx-auto">
        <Button variant="ghost" size="sm" className="mb-4 -ml-2 text-slate-500" asChild>
          <Link to="/billing">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to Billing
          </Link>
        </Button>

        <div className="mb-6">
          <h1 className="text-xl font-bold text-slate-900">Add Funds</h1>
          <p className="text-sm text-slate-500">Top up your wallet balance for faster checkout.</p>
        </div>

        <Card className="p-6 rounded-2xl shadow-sm border-slate-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="amount">Amount (INR)</Label>
              <Input
                id="amount"
                type="number"
                min={1}
                step={1}
                className="mt-2"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
              />
            </div>

            <div>
              <p className="text-xs font-bold uppercase text-slate-400 mb-2">Quick Select</p>
              <div className="flex flex-wrap gap-2">
                {PRESET_AMOUNTS.map((preset) => (
                  <Button
                    key={preset}
                    type="button"
                    variant={parsedAmount === preset ? "default" : "outline"}
                    size="sm"
                    onClick={() => setAmount(String(preset))}
                  >
                    {formatCurrency(preset)}
                  </Button>
                ))}
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600"
              disabled={!isValid || addFundsMutation.isPending}
            >
              <Wallet className="mr-2 h-4 w-4" />
              {addFundsMutation.isPending ? "Adding..." : "Add Funds to Wallet"}
            </Button>
          </form>

          <p className="text-xs text-slate-400 mt-4 text-center">
            Funds are credited instantly to your wallet for invoice and order payments.
          </p>
        </Card>
      </div>
    </AdminLayout>
  );
}
