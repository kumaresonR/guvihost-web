import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PageLoader, PageError } from "@/components/PageLoader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Plus, Trash2 } from "lucide-react";
import { listPaymentMethods } from "@/lib/api/index";
import { formatEnumLabel } from "@/lib/format";

type PaymentMethod = {
  id: string;
  type: string;
  label: string;
  lastFour?: string | null;
  brand?: string | null;
  expiryMonth?: number | null;
  expiryYear?: number | null;
  isDefault: boolean;
  isActive: boolean;
};

export default function PaymentMethodsPage() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["paymentMethods"],
    queryFn: listPaymentMethods,
  });

  if (isLoading) return <PageLoader message="Loading payment methods..." />;
  if (isError) return <PageError message={error instanceof Error ? error.message : "Failed to load payment methods"} />;

  const methods = (data ?? []) as PaymentMethod[];

  return (
    <AdminLayout>
      <div className="p-6 bg-[#ffffff] min-h-full font-sans">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Payment Methods</h1>
            <p className="text-sm text-slate-500">Manage saved cards and payment options.</p>
          </div>
          <Button className="bg-blue-600">
            <Plus className="mr-2 h-4 w-4" /> Add Payment Method
          </Button>
        </div>

        {methods.length === 0 ? (
          <Card className="p-12 rounded-2xl shadow-sm border-slate-100 text-center">
            <CreditCard className="mx-auto h-10 w-10 text-slate-300 mb-4" />
            <p className="text-slate-500 mb-4">No payment methods saved yet.</p>
            <Button className="bg-blue-600">
              <Plus className="mr-2 h-4 w-4" /> Add Payment Method
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {methods.map((pm) => (
              <Card key={pm.id} className="p-5 rounded-2xl shadow-sm border-slate-100">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-50 rounded-xl">
                      <CreditCard className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{pm.label}</p>
                      <p className="text-xs text-slate-500">
                        {formatEnumLabel(pm.type)}
                        {pm.brand ? ` · ${pm.brand}` : ""}
                        {pm.lastFour ? ` · **** ${pm.lastFour}` : ""}
                      </p>
                      {pm.expiryMonth && pm.expiryYear && (
                        <p className="text-xs text-slate-400 mt-1">
                          Expires {String(pm.expiryMonth).padStart(2, "0")}/{pm.expiryYear}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {pm.isDefault && (
                      <Badge className="bg-emerald-50 text-emerald-700 border-0 text-[10px]">Default</Badge>
                    )}
                    <Button variant="ghost" size="sm" className="text-rose-500 h-8">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
