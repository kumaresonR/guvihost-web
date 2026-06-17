import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PageLoader, PageError } from "@/components/PageLoader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useIsClient } from "@/hooks/use-role";
import { clearCart, getCart, removeCartItem, updateCartItem } from "@/lib/api/commerce";
import { formatCurrency, formatEnumLabel } from "@/lib/format";
import { GuvihostApiError } from "@/lib/guvihost-api";

type CartItem = {
  id: string;
  productName: string;
  productType: string;
  quantity: number;
  unitPrice: number | string;
};

export default function CartPage() {
  const isClient = useIsClient();
  const qc = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["cart"],
    queryFn: getCart,
    enabled: isClient,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, quantity }: { id: string; quantity: number }) =>
      updateCartItem(id, { quantity }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cart"] });
    },
    onError: (err) => {
      toast.error(err instanceof GuvihostApiError ? err.message : "Failed to update item");
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => removeCartItem(id),
    onSuccess: () => {
      toast.success("Item removed");
      qc.invalidateQueries({ queryKey: ["cart"] });
    },
    onError: (err) => {
      toast.error(err instanceof GuvihostApiError ? err.message : "Failed to remove item");
    },
  });

  const clearMutation = useMutation({
    mutationFn: clearCart,
    onSuccess: () => {
      toast.success("Cart cleared");
      qc.invalidateQueries({ queryKey: ["cart"] });
    },
    onError: (err) => {
      toast.error(err instanceof GuvihostApiError ? err.message : "Failed to clear cart");
    },
  });

  if (!isClient) {
    return <PageError message="You must be signed in as a client to view your cart." />;
  }
  if (isLoading) return <PageLoader message="Loading cart..." />;
  if (isError) {
    return (
      <PageError message={error instanceof Error ? error.message : "Failed to load cart."} />
    );
  }

  const items = (data?.items ?? []) as CartItem[];
  const subtotal = Number(data?.subtotal ?? 0);
  const isBusy = updateMutation.isPending || removeMutation.isPending || clearMutation.isPending;

  return (
    <AdminLayout>
      <div className="p-6 bg-[#ffffff] min-h-full font-sans">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Shopping Cart</h1>
            <p className="text-sm text-slate-500">
              {items.length} item{items.length === 1 ? "" : "s"} in your cart
            </p>
          </div>
          {items.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              disabled={isBusy}
              onClick={() => clearMutation.mutate()}
            >
              Clear Cart
            </Button>
          )}
        </div>

        {items.length === 0 ? (
          <Card className="p-12 rounded-2xl shadow-sm border-slate-100 text-center">
            <ShoppingCart className="mx-auto h-12 w-12 text-slate-300 mb-4" />
            <p className="text-slate-600 mb-4">Your cart is empty.</p>
            <Button asChild className="bg-blue-600">
              <Link to="/services/all">Browse Services</Link>
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 rounded-2xl shadow-sm border-slate-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-bold">
                    <tr>
                      <th className="p-4">Product</th>
                      <th className="p-4">Type</th>
                      <th className="p-4">Price</th>
                      <th className="p-4">Qty</th>
                      <th className="p-4">Line Total</th>
                      <th className="p-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((item) => {
                      const unitPrice = Number(item.unitPrice);
                      const lineTotal = unitPrice * item.quantity;
                      return (
                        <tr key={item.id} className="hover:bg-slate-50/50">
                          <td className="p-4 font-medium text-slate-800">{item.productName}</td>
                          <td className="p-4 text-slate-500">{formatEnumLabel(item.productType)}</td>
                          <td className="p-4">{formatCurrency(unitPrice)}</td>
                          <td className="p-4">
                            <div className="flex items-center gap-1">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                disabled={isBusy || item.quantity <= 1}
                                onClick={() =>
                                  updateMutation.mutate({ id: item.id, quantity: item.quantity - 1 })
                                }
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <Input
                                type="number"
                                min={1}
                                value={item.quantity}
                                className="w-16 h-8 text-center"
                                disabled={isBusy}
                                onChange={(e) => {
                                  const qty = parseInt(e.target.value, 10);
                                  if (qty > 0) updateMutation.mutate({ id: item.id, quantity: qty });
                                }}
                              />
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                disabled={isBusy}
                                onClick={() =>
                                  updateMutation.mutate({ id: item.id, quantity: item.quantity + 1 })
                                }
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </td>
                          <td className="p-4 font-bold">{formatCurrency(lineTotal)}</td>
                          <td className="p-4 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-rose-600"
                              disabled={isBusy}
                              onClick={() => removeMutation.mutate(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card className="p-6 rounded-2xl shadow-sm border-slate-100 h-fit">
              <h3 className="font-bold mb-4">Order Summary</h3>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-500">Subtotal</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              <p className="text-xs text-slate-400 mb-4">Taxes calculated at checkout</p>
              <div className="flex justify-between font-bold text-lg mb-6 pt-4 border-t">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <Button className="w-full bg-blue-600" asChild>
                <Link to="/checkout">Proceed to Checkout</Link>
              </Button>
            </Card>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
