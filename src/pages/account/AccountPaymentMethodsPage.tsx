import React, { useCallback, useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PageLoader, PageError } from "@/components/PageLoader";
import { listPaymentMethods } from "@/lib/api";
import { addPaymentMethod, deletePaymentMethod, setDefaultPaymentMethod } from "@/lib/api/auth";
import { GuvihostApiError } from "@/lib/guvihost-api";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { CreditCard, Plus, Star, Trash2 } from "lucide-react";

type PaymentMethodType = "CARD" | "RAZORPAY" | "WALLET" | "BANK_TRANSFER";

type PaymentMethod = {
  id: string;
  type: PaymentMethodType;
  label: string;
  lastFour: string | null;
  brand: string | null;
  expiryMonth: number | null;
  expiryYear: number | null;
  isDefault: boolean;
};

const PAYMENT_TYPES: { value: PaymentMethodType; label: string }[] = [
  { value: "CARD", label: "Credit / Debit Card" },
  { value: "RAZORPAY", label: "Razorpay" },
  { value: "WALLET", label: "Wallet" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
];

const emptyForm = {
  type: "CARD" as PaymentMethodType,
  label: "",
  lastFour: "",
  brand: "",
  expiryMonth: "",
  expiryYear: "",
  isDefault: false,
};

export default function AccountPaymentMethodsPage() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  const loadMethods = useCallback(async () => {
    const data = await listPaymentMethods();
    setMethods(data as PaymentMethod[]);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await loadMethods();
      } catch (e) {
        if (!cancelled) {
          const msg = e instanceof GuvihostApiError ? e.message : "Failed to load payment methods";
          setError(msg);
          toast.error(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadMethods]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.label.trim()) {
      toast.error("Label is required");
      return;
    }
    if (form.type === "CARD" && form.lastFour && form.lastFour.length !== 4) {
      toast.error("Last four digits must be exactly 4 characters");
      return;
    }

    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        type: form.type,
        label: form.label.trim(),
        isDefault: form.isDefault,
      };
      if (form.lastFour.trim()) body.lastFour = form.lastFour.trim();
      if (form.brand.trim()) body.brand = form.brand.trim();
      if (form.expiryMonth) body.expiryMonth = Number(form.expiryMonth);
      if (form.expiryYear) body.expiryYear = Number(form.expiryYear);

      await addPaymentMethod(body);
      toast.success("Payment method added");
      setDialogOpen(false);
      setForm(emptyForm);
      await loadMethods();
    } catch (err) {
      toast.error(err instanceof GuvihostApiError ? err.message : "Failed to add payment method");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setActionId(id);
    try {
      await deletePaymentMethod(id);
      toast.success("Payment method removed");
      setMethods((prev) => prev.filter((pm) => pm.id !== id));
    } catch (err) {
      toast.error(err instanceof GuvihostApiError ? err.message : "Failed to remove payment method");
    } finally {
      setActionId(null);
    }
  };

  const handleSetDefault = async (id: string) => {
    setActionId(id);
    try {
      await setDefaultPaymentMethod(id);
      toast.success("Default payment method updated");
      await loadMethods();
    } catch (err) {
      toast.error(err instanceof GuvihostApiError ? err.message : "Failed to set default");
    } finally {
      setActionId(null);
    }
  };

  if (loading) return <PageLoader message="Loading payment methods..." />;
  if (error) return <PageError message={error} />;

  return (
    <AdminLayout>
      <div className="p-6 max-w-2xl mx-auto font-sans">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-xl font-bold text-[#0a1b3f]">Payment Methods</h1>
            <p className="text-slate-500 mt-1">Manage your saved payment methods.</p>
          </div>
          <Button className="bg-blue-600 gap-2 hover:bg-blue-700" onClick={() => setDialogOpen(true)}>
            <Plus size={16} /> Add Method
          </Button>
        </div>

        {methods.length === 0 ? (
          <Card className="p-8 rounded-2xl border-slate-100 shadow-sm text-center text-slate-500">
            <CreditCard className="mx-auto mb-3 text-slate-300" size={40} />
            <p>No payment methods on file.</p>
            <Button className="mt-4 bg-blue-600 hover:bg-blue-700" onClick={() => setDialogOpen(true)}>
              Add your first method
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {methods.map((pm) => (
              <Card key={pm.id} className="p-4 rounded-2xl border-slate-100 shadow-sm flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <CreditCard className="text-blue-600 shrink-0" size={24} />
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">
                      {pm.label}
                      {pm.lastFour && ` · **** ${pm.lastFour}`}
                      {pm.isDefault && (
                        <Badge className="ml-2 bg-emerald-50 text-emerald-700 text-[10px] uppercase">Default</Badge>
                      )}
                    </p>
                    <p className="text-xs text-slate-500">
                      {pm.brand ?? pm.type}
                      {pm.expiryMonth && pm.expiryYear && ` · Expires ${pm.expiryMonth}/${pm.expiryYear}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {!pm.isDefault && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={actionId === pm.id}
                      onClick={() => handleSetDefault(pm.id)}
                      className="gap-1"
                    >
                      <Star size={14} />
                      {actionId === pm.id ? "..." : "Default"}
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={actionId === pm.id}
                    onClick={() => handleDelete(pm.id)}
                    className="text-red-600 hover:text-red-700 gap-1"
                  >
                    <Trash2 size={14} />
                    {actionId === pm.id ? "..." : "Remove"}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Payment Method</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as PaymentMethodType })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {PAYMENT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Label</Label>
                <Input
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                  placeholder="e.g. Personal Visa"
                  required
                />
              </div>
              {form.type === "CARD" && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Last 4 Digits</Label>
                      <Input
                        value={form.lastFour}
                        onChange={(e) => setForm({ ...form, lastFour: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                        placeholder="4242"
                        maxLength={4}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Brand</Label>
                      <Input
                        value={form.brand}
                        onChange={(e) => setForm({ ...form, brand: e.target.value })}
                        placeholder="Visa, Mastercard..."
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Expiry Month</Label>
                      <Input
                        type="number"
                        min={1}
                        max={12}
                        value={form.expiryMonth}
                        onChange={(e) => setForm({ ...form, expiryMonth: e.target.value })}
                        placeholder="12"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Expiry Year</Label>
                      <Input
                        type="number"
                        min={2024}
                        value={form.expiryYear}
                        onChange={(e) => setForm({ ...form, expiryYear: e.target.value })}
                        placeholder="2028"
                      />
                    </div>
                  </div>
                </>
              )}
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isDefault}
                  onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                  className="rounded border-gray-300"
                />
                Set as default payment method
              </label>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                  {saving ? "Saving..." : "Add Method"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
