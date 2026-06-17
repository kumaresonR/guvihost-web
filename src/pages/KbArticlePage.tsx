import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ClientRoute } from "@/components/ClientRoute";
import { PageLoader, PageError } from "@/components/PageLoader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getKbArticleBySlug } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { ArrowLeft, BookOpen } from "lucide-react";

export default function KbArticlePage() {
  const { slug = "" } = useParams();

  const { data: article, isLoading, isError, error } = useQuery({
    queryKey: ["kb-article", slug],
    queryFn: () => getKbArticleBySlug(slug),
    enabled: Boolean(slug),
  });

  if (isLoading) return <PageLoader message="Loading article..." />;
  if (isError) {
    return <PageError message={error instanceof Error ? error.message : "Article not found"} />;
  }

  const a = article!;
  const category = a.category as { name?: string; slug?: string } | undefined;
  const tags = (a.tags as string[]) ?? [];

  return (
    <ClientRoute>
      <AdminLayout>
        <div className="p-6 bg-[#f8f9fa] min-h-full font-sans max-w-3xl mx-auto">
          <Link to="/kb" className="inline-flex items-center gap-2 text-sm text-blue-600 mb-4">
            <ArrowLeft size={16} /> Back to Knowledge Base
          </Link>

          <Card className="p-8 rounded-2xl border-slate-100 shadow-sm">
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
              <BookOpen size={16} />
              {category?.name && <span>{category.name}</span>}
              {a.publishedAt && <span>· {formatDate(a.publishedAt as string)}</span>}
            </div>

            <h1 className="text-2xl font-bold text-slate-900 mb-4">{String(a.title)}</h1>

            {a.summary && (
              <p className="text-slate-600 mb-6 pb-6 border-b">{String(a.summary)}</p>
            )}

            <div
              className="prose prose-slate max-w-none text-sm leading-relaxed"
              dangerouslySetInnerHTML={{ __html: String(a.content ?? "") }}
            />

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t">
                {tags.map((tag) => (
                  <Badge key={tag} variant="outline">{tag}</Badge>
                ))}
              </div>
            )}
          </Card>
        </div>
      </AdminLayout>
    </ClientRoute>
  );
}
