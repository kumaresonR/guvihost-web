import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ClientRoute } from "@/components/ClientRoute";
import { PageLoader } from "@/components/PageLoader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { checkDomainAvailability, getDomainPricing } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { toast } from "sonner";
import { ArrowLeft, Globe, Search } from "lucide-react";

type DomainResult = {
  domain: string;
  name: string;
  extension: string;
  available: boolean;
  registerPrice: number;
  premium?: boolean;
};

export default function DomainSearchPage() {
  const [query, setQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const pricingQuery = useQuery({
    queryKey: ["domain-pricing"],
    queryFn: getDomainPricing,
  });

  const searchQuery = useQuery({
    queryKey: ["domain-check", searchTerm],
    queryFn: () => checkDomainAvailability(searchTerm),
    enabled: searchTerm.length > 0,
  });

  const handleSearch = () => {
    const trimmed = query.trim();
    if (!trimmed) {
      toast.error("Enter a domain name to search");
      return;
    }
    setSearchTerm(trimmed.toLowerCase().split(".")[0]);
  };

  const results = (searchQuery.data?.results as DomainResult[]) ?? [];

  return (
    <ClientRoute>
      <AdminLayout>
        <div className="p-6 bg-[#f8f9fa] min-h-full font-sans">
          <Link to="/domains" className="inline-flex items-center gap-2 text-sm text-blue-600 mb-4">
            <ArrowLeft size={16} /> Back to domains
          </Link>

          <h1 className="text-2xl font-bold text-slate-900 mb-2">Domain Search</h1>
          <p className="text-sm text-slate-500 mb-6">Check availability and register your perfect domain.</p>

          <Card className="p-6 mb-8 rounded-2xl border-slate-100 shadow-sm">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 text-slate-400" size={16} />
                <Input
                  className="pl-10"
                  placeholder="Enter domain name (e.g. mybusiness)"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
              <Button className="bg-blue-600" disabled={searchQuery.isFetching} onClick={handleSearch}>
                Search
              </Button>
            </div>
          </Card>

          {searchQuery.isLoading && <PageLoader message="Checking availability..." />}

          {searchTerm && !searchQuery.isLoading && (
            <Card className="p-6 rounded-2xl border-slate-100 shadow-sm">
              <h2 className="font-bold mb-4">Results for &quot;{searchTerm}&quot;</h2>
              {results.length === 0 ? (
                <p className="text-sm text-slate-500">No results. Try a different name.</p>
              ) : (
                <div className="space-y-3">
                  {results.map((r) => (
                    <div key={r.domain} className="flex items-center justify-between border-b last:border-0 py-3">
                      <div className="flex items-center gap-3">
                        <Globe className="text-blue-600" size={18} />
                        <div>
                          <p className="font-bold">{r.domain}</p>
                          <p className="text-xs text-slate-500">{formatCurrency(Number(r.registerPrice))}/yr</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={r.available ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}>
                          {r.available ? "Available" : "Taken"}
                        </Badge>
                        {r.available && (
                          <Button size="sm" asChild>
                            <Link to={`/domains/register?name=${encodeURIComponent(r.name)}&extension=${encodeURIComponent(r.extension)}`}>
                              Register
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {pricingQuery.data && pricingQuery.data.length > 0 && !searchTerm && (
            <Card className="p-6 rounded-2xl border-slate-100 shadow-sm mt-6">
              <h2 className="font-bold mb-4">Popular Extensions</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                {pricingQuery.data.slice(0, 8).map((ext) => (
                  <div key={String(ext.extension)} className="p-3 bg-slate-50 rounded-lg">
                    <p className="font-bold">{String(ext.extension)}</p>
                    <p className="text-slate-500">{formatCurrency(Number(ext.registerPrice))}/yr</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </AdminLayout>
    </ClientRoute>
  );
}
