import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PageLoader, PageError } from "@/components/PageLoader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { useIsClient, useDisplayUser } from "@/hooks/use-role";
import {
  checkout,
  getCart,
  verifyRazorpayPayment,
} from "@/lib/api/commerce";
import { formatCurrency } from "@/lib/format";
import { GuvihostApiError } from "@/lib/guvihost-api";
import { openRazorpayCheckout } from "@/lib/razorpay-checkout";

type PaymentMethod = "WALLET" | "RAZORPAY" | "PAY_LATER";

const TAX_RATE = 0.18;

export default function CheckoutPage() {
  const isClient = useIsClient();
  const displayUser = useDisplayUser();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("WALLET");
  const [notes, setNotes] = useState("");

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["cart"],
    queryFn: getCart,
    enabled: isClient,
  });

  const checkoutMutation = useMutation({
    mutationFn: () => checkout({ paymentMethod, notes: notes.trim() || undefined }),
    onSuccess: async (result) => {
      qc.invalidateQueries({ queryKey: ["cart"] });
      qc.invalidateQueries({ queryKey: ["my-orders"] });

      const invoice = result.invoice as { id?: string; invoiceNumber?: string } | undefined;
      const order = result.order as { id?: string; orderNumber?: string } | undefined;
      const razorpay = result.razorpay as
        | { id?: string; amount?: number; devMode?: boolean }
        | null
        | undefined;

      if (paymentMethod === "RAZORPAY" && razorpay?.id && invoice?.id) {
        const keyId = import.meta.env.VITE_RAZORPAY_KEY_ID as string | undefined;
        const amountInr = Number(razorpay.amount ?? 0) / 100;

        if (!keyId) {
          toast.error("Razorpay is not configured. Please pay the invoice from billing.");
          navigate(`/billing/invoices/${invoice.id}`);
          return;
        }

        const status = await openRazorpayCheckout({
          keyId,
          orderId: razorpay.id,
          amountInr,
          description: `Order ${order?.orderNumber ?? ""}`,
          email: displayUser?.email,
          onSuccess: async (response) => {
            try {
              await verifyRazorpayPayment({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              });
              toast.success("Payment successful");
              navigate(`/my-orders`);
            } catch (err) {
              toast.error(
                err instanceof GuvihostApiError ? err.message : "Payment verification failed"
              );
            }
          },
        });

        if (status === "unavailable") {
          toast.error("Razorpay checkout is not available. Please pay the invoice from billing.");
          navigate(`/billing/invoices/${invoice.id}`);
        }
        return;
      }

      toast.success(String(result.message ?? "Order placed successfully"));
      navigate(paymentMethod === "PAY_LATER" && invoice?.id ? `/billing/invoices/${invoice.id}` : "/my-orders");
    },
    onError: (err) => {
      toast.error(err instanceof GuvihostApiError ? err.message : "Checkout failed");
    },
  });

  if (!isClient) {
    return <PageError message="You must be signed in as a client to checkout." />;
  }
  if (isLoading) return <PageLoader message="Loading checkout..." />;
  if (isError) {
    return (
      <PageError message={error instanceof Error ? error.message : "Failed to load cart."} />
    );
  }

  const items = data?.items ?? [];
  const subtotal = Number(data?.subtotal ?? 0);
  const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
  const total = subtotal + tax;

  if (items.length === 0) {
    return (
      <AdminLayout>
        <div className="p-6">
          <PageError message="Your cart is empty. Add items before checkout." />
          <div className="text-center mt-4">
            <Button asChild variant="outline">
              <Link to="/cart">Back to Cart</Link>
            </Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 bg-[#ffffff] min-h-full font-sans max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-slate-900">Checkout</h1>
          <p className="text-sm text-slate-500">Choose a payment method and place your order.</p>
        </div>

        <Card className="p-6 rounded-2xl shadow-sm border-slate-100 mb-6">
          <h3 className="font-bold mb-4">Order Summary</h3>
          <div className="space-y-2 text-sm mb-4">
            {items.map((item) => {
              const row = item as { id: string; productName: string; quantity: number; unitPrice: number | string };
              return (
                <div key={row.id} className="flex justify-between">
                  <span>
                    {row.productName} × {row.quantity}
                  </span>
                  <span>{formatCurrency(Number(row.unitPrice) * row.quantity)}</span>
                </div>
              );
            })}
          </div>
          <div className="border-t pt-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">GST (18%)</span>
              <span>{formatCurrency(tax)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg pt-2">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>
        </Card>

        <Card className="p-6 rounded-2xl shadow-sm border-slate-100 mb-6">
          <h3 className="font-bold mb-4">Payment Method</h3>
          <RadioGroup
            value={paymentMethod}
            onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
            className="space-y-3"
          >
            <PaymentOption
              value="WALLET"
              label="Wallet Balance"
              description="Pay instantly from your account wallet"
            />
            <PaymentOption
              value="RAZORPAY"
              label="Razorpay"
              description="Pay online via card, UPI, or net banking"
            />
            <PaymentOption
              value="PAY_LATER"
              label="Pay Later"
              description="Place order now and pay the invoice later"
            />
          </RadioGroup>
        </Card>

        <Card className="p-6 rounded-2xl shadow-sm border-slate-100 mb-6">
          <Label htmlFor="notes" className="font-bold">
            Order Notes (optional)
          </Label>
          <Textarea
            id="notes"
            className="mt-2"
            placeholder="Any special instructions..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </Card>

        <div className="flex gap-3">
          <Button variant="outline" asChild>
            <Link to="/cart">Back to Cart</Link>
          </Button>
          <Button
            className="bg-blue-600 flex-1"
            disabled={checkoutMutation.isPending}
            onClick={() => checkoutMutation.mutate()}
          >
            {checkoutMutation.isPending ? "Processing..." : "Place Order"}
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}

function PaymentOption({
  value,
  label,
  description,
}: {
  value: string;
  label: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-slate-200 p-4 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50/30">
      <RadioGroupItem value={value} id={`pay-${value}`} className="mt-0.5" />
      <Label htmlFor={`pay-${value}`} className="cursor-pointer flex-1">
        <span className="font-medium block">{label}</span>
        <span className="text-xs text-slate-500">{description}</span>
      </Label>
    </div>
  );
}
