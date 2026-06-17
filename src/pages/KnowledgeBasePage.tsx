import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ClientRoute } from "@/components/ClientRoute";
import { PageLoader, PageError } from "@/components/PageLoader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { listKbArticles, listKbCategories } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { BookOpen, Search } from "lucide-react";

export default function KnowledgeBasePage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");

  const categoriesQuery = useQuery({
    queryKey: ["kb-categories"],
    queryFn: listKbCategories,
  });

  const articlesQuery = useQuery({
    queryKey: ["kb-articles", search, category],
    queryFn: () =>
      listKbArticles({
        search: search.trim() || undefined,
        category: category || undefined,
        limit: 50,
      }),
  });

  if (articlesQuery.isLoading && !articlesQuery.data) return <PageLoader message="Loading articles..." />;
  if (articlesQuery.isError) {
    return <PageError message={articlesQuery.error instanceof Error ? articlesQuery.error.message : "Failed to load KB"} />;
  }

  const categories = (categoriesQuery.data ?? []) as { id: string; name: string; slug: string; _count?: { articles: number } }[];
  const articles = (articlesQuery.data?.items ?? []) as {
    id: string;
    title: string;
    slug: string;
    summary?: string;
    isFeatured?: boolean;
    publishedAt?: string;
    category?: { name: string; slug: string };
  }[];

  return (
    <ClientRoute>
      <AdminLayout>
        <div className="p-6 bg-[#f8f9fa] min-h-full font-sans">
          <div className="flex items-center gap-3 mb-6">
            <BookOpen className="text-blue-600" size={28} />
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Knowledge Base</h1>
              <p className="text-sm text-slate-500">Find answers and guides for common questions</p>
            </div>
          </div>

          <Card className="p-4 mb-6 rounded-2xl border-slate-100 shadow-sm">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-slate-400" size={16} />
              <Input
                className="pl-10"
                placeholder="Search articles..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </Card>

          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              <button
                type="button"
                onClick={() => setCategory("")}
                className={`px-3 py-1.5 text-xs font-bold rounded-full border ${
                  !category ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200"
                }`}
              >
                All
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategory(c.slug)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-full border ${
                    category === c.slug ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200"
                  }`}
                >
                  {c.name} {c._count?.articles != null ? `(${c._count.articles})` : ""}
                </button>
              ))}
            </div>
          )}

          {articles.length === 0 ? (
            <Card className="p-8 text-center rounded-2xl border-slate-100 shadow-sm">
              <p className="text-slate-500">No articles found.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {articles.map((a) => (
                <Link key={a.id} to={`/kb/${a.slug}`}>
                  <Card className="p-5 rounded-2xl border-slate-100 shadow-sm hover:border-blue-200 transition-colors h-full">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h2 className="font-bold text-slate-900">{a.title}</h2>
                      {a.isFeatured && <Badge className="bg-amber-50 text-amber-600 shrink-0">Featured</Badge>}
                    </div>
                    {a.summary && <p className="text-sm text-slate-500 line-clamp-2 mb-3">{a.summary}</p>}
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      {a.category?.name && <span>{a.category.name}</span>}
                      {a.publishedAt && <span>· {formatDate(a.publishedAt)}</span>}
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </AdminLayout>
    </ClientRoute>
  );
}
