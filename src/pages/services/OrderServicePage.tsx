import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ClientRoute } from "@/components/ClientRoute";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Check, Globe, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { addToCart } from "@/lib/api/commerce";
import {
  SERVICE_CATALOG,
  buildCartPayload,
  getCatalogCategory,
  type ServiceProduct,
} from "@/lib/service-catalog";
import { formatCurrency } from "@/lib/format";
import { GuvihostApiError } from "@/lib/guvihost-api";

export default function OrderServicePage() {
  const [searchParams] = useSearchParams();
  const typeFilter = searchParams.get("type");
  const navigate = useNavigate();
  const [addingId, setAddingId] = useState<string | null>(null);

  const categories = useMemo(() => {
    if (!typeFilter) return SERVICE_CATALOG;
    const match = getCatalogCategory(typeFilter);
    return match ? [match] : SERVICE_CATALOG;
  }, [typeFilter]);

  const addMutation = useMutation({
    mutationFn: (product: ServiceProduct) => addToCart(buildCartPayload(product)),
    onSuccess: () => {
      toast.success("Added to cart");
      navigate("/cart");
    },
    onError: (err) => {
      toast.error(err instanceof GuvihostApiError ? err.message : "Failed to add to cart");
    },
    onSettled: () => setAddingId(null),
  });

  const handleAdd = (product: ServiceProduct) => {
    setAddingId(product.id);
    addMutation.mutate(product);
  };

  const pageTitle = typeFilter
    ? getCatalogCategory(typeFilter)?.label ?? "Order Service"
    : "Order a Service";

  return (
    <ClientRoute>
      <AdminLayout>
        <div className="p-6 bg-[#f8f9fa] min-h-full font-sans max-w-5xl">
          <div className="mb-6">
            <Button variant="ghost" size="sm" className="mb-3 -ml-2 gap-2 text-slate-600" asChild>
              <Link to={typeFilter ? `/services/${typeRoute(typeFilter)}` : "/services/all"}>
                <ArrowLeft size={16} /> Back
              </Link>
            </Button>
            <h1 className="text-2xl font-bold text-slate-900">{pageTitle}</h1>
            <p className="text-sm text-slate-500 mt-1">
              Choose a plan, add to cart, then checkout to activate your service.
            </p>
          </div>

          <div className="space-y-8">
            {categories.map((category) => (
              <section key={category.type}>
                {!typeFilter && (
                  <h2 className="text-lg font-bold text-slate-800 mb-4">{category.label}</h2>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {category.products.map((product) => (
                    <Card key={product.id} className="p-6 rounded-2xl border-slate-100 shadow-sm flex flex-col">
                      <div className="flex justify-between items-start gap-3 mb-3">
                        <div>
                          <h3 className="font-bold text-slate-900">{product.productName}</h3>
                          <p className="text-xs text-slate-500 mt-0.5">{product.planName}</p>
                        </div>
                        <Badge variant="secondary" className="capitalize shrink-0">
                          {product.billingCycle}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600 mb-4">{product.description}</p>
                      <ul className="space-y-1.5 mb-5 flex-1">
                        {product.highlights.map((h) => (
                          <li key={h} className="flex items-center gap-2 text-sm text-slate-700">
                            <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                            {h}
                          </li>
                        ))}
                      </ul>
                      <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-100">
                        <p className="text-xl font-bold text-slate-900">
                          {formatCurrency(product.unitPrice)}
                          <span className="text-xs font-normal text-slate-500">
                            /{product.billingCycle === "monthly" ? "mo" : "yr"}
                          </span>
                        </p>
                        <Button
                          className="bg-blue-600 gap-2"
                          disabled={addingId !== null}
                          onClick={() => handleAdd(product)}
                        >
                          <ShoppingCart size={16} />
                          {addingId === product.id ? "Adding..." : "Add to Cart"}
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <Card className="mt-8 p-5 rounded-2xl border-blue-100 bg-blue-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Globe className="text-blue-600 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-semibold text-slate-900 text-sm">Need a domain?</p>
                <p className="text-xs text-slate-600">Search and register domains separately.</p>
              </div>
            </div>
            <Button variant="outline" asChild>
              <Link to="/domains/search">Register Domain</Link>
            </Button>
          </Card>
        </div>
      </AdminLayout>
    </ClientRoute>
  );
}

function typeRoute(type: string): string {
  const map: Record<string, string> = {
    SHARED_HOSTING: "shared",
    VPS: "vps",
    RESELLER_HOSTING: "all",
    BUSINESS_EMAIL: "email",
  };
  return map[type] ?? "all";
}
