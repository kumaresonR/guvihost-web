import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ClientRoute } from "@/components/ClientRoute";
import { PageLoader } from "@/components/PageLoader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { globalSearch } from "@/lib/api";
import { formatEnumLabel } from "@/lib/format";
import { Globe, HardDrive, Headset, Search } from "lucide-react";

export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const initialQ = params.get("q") ?? "";
  const [query, setQuery] = useState(initialQ);
  const [searchQ, setSearchQ] = useState(initialQ);

  useEffect(() => {
    const q = params.get("q") ?? "";
    setQuery(q);
    setSearchQ(q);
  }, [params]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["global-search", searchQ],
    queryFn: () => globalSearch(searchQ),
    enabled: searchQ.trim().length > 0,
  });

  const handleSearch = () => {
    const trimmed = query.trim();
    setSearchQ(trimmed);
    setParams(trimmed ? { q: trimmed } : {});
  };

  const services = (data?.services ?? []) as Record<string, unknown>[];
  const domains = (data?.domains ?? []) as Record<string, unknown>[];
  const tickets = (data?.tickets ?? []) as Record<string, unknown>[];
  const hasResults = services.length + domains.length + tickets.length > 0;

  return (
    <ClientRoute>
      <AdminLayout>
        <div className="p-6 bg-[#f8f9fa] min-h-full font-sans">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Search</h1>
          <p className="text-sm text-slate-500 mb-6">Search across services, domains, and tickets</p>

          <Card className="p-4 mb-8 rounded-2xl border-slate-100 shadow-sm">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 text-slate-400" size={16} />
                <Input
                  className="pl-10"
                  placeholder="Search..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
              <Button className="bg-blue-600" disabled={isFetching} onClick={handleSearch}>Search</Button>
            </div>
          </Card>

          {isLoading && searchQ && <PageLoader message="Searching..." />}

          {searchQ && !isLoading && (
            <>
              {!hasResults ? (
                <Card className="p-8 text-center rounded-2xl border-slate-100 shadow-sm">
                  <p className="text-slate-500">No results for &quot;{searchQ}&quot;</p>
                </Card>
              ) : (
                <div className="space-y-6">
                  {services.length > 0 && (
                    <ResultSection title="Services" icon={<HardDrive size={18} />}>
                      {services.map((s) => (
                        <Link key={String(s.id)} to={`/services/${s.id}`} className="block p-3 rounded-lg hover:bg-slate-50 border-b last:border-0">
                          <p className="font-medium">{String(s.name)}</p>
                          <p className="text-xs text-slate-500">{formatEnumLabel(String(s.type))} · {String(s.domain ?? s.accountCode)}</p>
                        </Link>
                      ))}
                    </ResultSection>
                  )}

                  {domains.length > 0 && (
                    <ResultSection title="Domains" icon={<Globe size={18} />}>
                      {domains.map((d) => (
                        <Link key={String(d.id)} to={`/domains/${d.id}`} className="block p-3 rounded-lg hover:bg-slate-50 border-b last:border-0">
                          <p className="font-medium">{String(d.name)}{String(d.extension)}</p>
                          <p className="text-xs text-slate-500">{formatEnumLabel(String(d.status))}</p>
                        </Link>
                      ))}
                    </ResultSection>
                  )}

                  {tickets.length > 0 && (
                    <ResultSection title="Tickets" icon={<Headset size={18} />}>
                      {tickets.map((t) => (
                        <Link key={String(t.id)} to={`/support/tickets/${t.id}`} className="block p-3 rounded-lg hover:bg-slate-50 border-b last:border-0">
                          <p className="font-medium">{String(t.subject)}</p>
                          <p className="text-xs text-slate-500">{String(t.ticketNumber)} · {formatEnumLabel(String(t.status))}</p>
                        </Link>
                      ))}
                    </ResultSection>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </AdminLayout>
    </ClientRoute>
  );
}

function ResultSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card className="p-5 rounded-2xl border-slate-100 shadow-sm">
      <h2 className="font-bold flex items-center gap-2 mb-3 text-blue-600">{icon} {title}</h2>
      <div>{children}</div>
    </Card>
  );
}
