import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PageLoader, PageError } from "@/components/PageLoader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Wallet, CreditCard, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useIsClient, useDisplayUser } from "@/hooks/use-role";
import { getInvoice } from "@/lib/api/index";
import {
  createRazorpayOrder,
  downloadInvoicePdf,
  payInvoice,
  verifyRazorpayPayment,
} from "@/lib/api/commerce";
import { formatCurrency, formatDate, formatEnumLabel } from "@/lib/format";
import { GuvihostApiError } from "@/lib/guvihost-api";
import { openRazorpayCheckout } from "@/lib/razorpay-checkout";

type InvoiceItem = {
  id: string;
  name: string;
  description?: string | null;
  amount: number | string;
};

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const isClient = useIsClient();
  const displayUser = useDisplayUser();
  const qc = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["invoice", id],
    queryFn: () => getInvoice(id!),
    enabled: isClient && Boolean(id),
  });

  const payWalletMutation = useMutation({
    mutationFn: () => payInvoice(id!, { paymentMethod: "WALLET" }),
    onSuccess: () => {
      toast.success("Invoice paid from wallet");
      qc.invalidateQueries({ queryKey: ["invoice", id] });
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["billingDashboard"] });
    },
    onError: (err) => {
      toast.error(err instanceof GuvihostApiError ? err.message : "Payment failed");
    },
  });

  const razorpayMutation = useMutation({
    mutationFn: () => createRazorpayOrder(id!),
    onSuccess: async (rz) => {
      const status = await openRazorpayCheckout({
        keyId: rz.keyId,
        orderId: rz.orderId,
        amountInr: Number(rz.amount),
        currency: rz.currency,
        description: `Invoice payment`,
        email: displayUser?.email,
        onSuccess: async (response) => {
          try {
            await verifyRazorpayPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            toast.success("Payment successful");
            qc.invalidateQueries({ queryKey: ["invoice", id] });
            qc.invalidateQueries({ queryKey: ["invoices"] });
            qc.invalidateQueries({ queryKey: ["billingDashboard"] });
          } catch (err) {
            toast.error(
              err instanceof GuvihostApiError ? err.message : "Payment verification failed"
            );
          }
        },
      });

      if (status === "unavailable") {
        toast.error("Razorpay is not configured. Online payment is unavailable.");
      }
    },
    onError: (err) => {
      toast.error(err instanceof GuvihostApiError ? err.message : "Failed to start Razorpay payment");
    },
  });

  const pdfMutation = useMutation({
    mutationFn: () => downloadInvoicePdf(id!),
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Invoice PDF downloaded");
    },
    onError: () => toast.error("Failed to download PDF"),
  });

  if (!isClient) {
    return <PageError message="You must be signed in as a client to view invoice details." />;
  }
  if (!id) return <PageError message="Invoice ID is required." />;
  if (isLoading) return <PageLoader message="Loading invoice..." />;
  if (isError) {
    return (
      <PageError message={error instanceof Error ? error.message : "Failed to load invoice."} />
    );
  }

  const invoice = data as Record<string, unknown>;
  const status = String(invoice.status ?? "").toUpperCase();
  const isPaid = status === "PAID";
  const isUnpaid = status === "UNPAID" || status === "OVERDUE";
  const amountDue = Number(invoice.amountDue ?? invoice.total ?? 0);
  const items = (invoice.items ?? []) as InvoiceItem[];
  const billTo = invoice.billTo as Record<string, string | undefined> | undefined;
  const isPaying = payWalletMutation.isPending || razorpayMutation.isPending;

  return (
    <AdminLayout>
      <div className="p-6 bg-[#ffffff] min-h-full font-sans">
        <div className="flex justify-between items-start mb-6">
          <div>
            <Button variant="ghost" size="sm" className="mb-2 -ml-2 text-slate-500" asChild>
              <Link to="/billing/invoices">
                <ArrowLeft className="mr-1 h-4 w-4" /> Back to Invoices
              </Link>
            </Button>
            <h1 className="text-xl font-bold text-slate-900">
              Invoice {String(invoice.invoiceNumber ?? id)}
            </h1>
            <p className="text-sm text-slate-500">
              Issued {formatDate(invoice.invoiceDate as string)} · Due{" "}
              {formatDate(invoice.dueDate as string)}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pdfMutation.isPending}
              onClick={() => pdfMutation.mutate()}
            >
              <Download className="mr-2 h-4 w-4" />
              {pdfMutation.isPending ? "Downloading..." : "Download PDF"}
            </Button>
            <InvoiceStatusBadge status={status} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6 rounded-2xl shadow-sm border-slate-100">
              <h3 className="font-bold mb-4">Bill To</h3>
              <div className="text-sm text-slate-600 space-y-1">
                <p className="font-medium text-slate-800">{billTo?.name ?? "—"}</p>
                <p>{billTo?.email ?? "—"}</p>
                {billTo?.address && <p>{billTo.address}</p>}
                {(billTo?.city || billTo?.country) && (
                  <p>
                    {[billTo.city, billTo.country].filter(Boolean).join(", ")}
                  </p>
                )}
              </div>
            </Card>

            <Card className="rounded-2xl shadow-sm border-slate-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-bold">
                    <tr>
                      <th className="p-4">Item</th>
                      <th className="p-4">Description</th>
                      <th className="p-4 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="p-8 text-center text-slate-500">
                          No line items.
                        </td>
                      </tr>
                    ) : (
                      items.map((item) => (
                        <tr key={item.id}>
                          <td className="p-4 font-medium">{item.name}</td>
                          <td className="p-4 text-slate-500">{item.description ?? "—"}</td>
                          <td className="p-4 text-right font-medium">
                            {formatCurrency(Number(item.amount))}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          <Card className="p-6 rounded-2xl shadow-sm border-slate-100 h-fit">
            <h3 className="font-bold mb-4">Summary</h3>
            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between">
                <span className="text-slate-500">Subtotal</span>
                <span>{formatCurrency(Number(invoice.subtotal ?? 0))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">CGST</span>
                <span>{formatCurrency(Number(invoice.cgst ?? 0))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">SGST</span>
                <span>{formatCurrency(Number(invoice.sgst ?? 0))}</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-3 border-t">
                <span>Total</span>
                <span>{formatCurrency(Number(invoice.total ?? 0))}</span>
              </div>
              {!isPaid && (
                <div className="flex justify-between text-rose-600 font-bold">
                  <span>Amount Due</span>
                  <span>{formatCurrency(amountDue)}</span>
                </div>
              )}
            </div>

            {isUnpaid && (
              <div className="space-y-2">
                <Button
                  className="w-full bg-blue-600"
                  disabled={isPaying}
                  onClick={() => payWalletMutation.mutate()}
                >
                  <Wallet className="mr-2 h-4 w-4" />
                  {payWalletMutation.isPending ? "Processing..." : "Pay with Wallet"}
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={isPaying}
                  onClick={() => razorpayMutation.mutate()}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  {razorpayMutation.isPending ? "Opening..." : "Pay with Razorpay"}
                </Button>
                <p className="text-xs text-slate-400 text-center">
                  Razorpay requires checkout.js to be loaded. If unavailable, wallet payment or add
                  funds first.
                </p>
              </div>
            )}

            {isPaid && (
              <p className="text-sm text-emerald-600 font-medium text-center">
                This invoice has been paid.
              </p>
            )}

            {!isUnpaid && !isPaid && (
              <p className="text-sm text-slate-500 text-center">
                Status: {formatEnumLabel(status)}
              </p>
            )}
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}

function InvoiceStatusBadge({ status }: { status: string }) {
  const paid = status === "PAID";
  return (
    <Badge className={paid ? "bg-emerald-50 text-emerald-600 border-0" : "bg-rose-50 text-rose-600 border-0"}>
      {formatEnumLabel(status)}
    </Badge>
  );
}
