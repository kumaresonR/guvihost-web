import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PageLoader, PageError } from "@/components/PageLoader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import {
  createAdminKbArticle,
  createAdminKbCategory,
  deleteAdminKbArticle,
  deleteAdminKbCategory,
  listAdminKbArticles,
  listAdminKbCategories,
  publishAdminKbArticle,
  updateAdminKbArticle,
  updateAdminKbCategory,
} from "@/lib/api";
import { formatDate } from "@/lib/format";
import { useIsStaff } from "@/hooks/use-role";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BookOpen, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { GuvihostApiError } from "@/lib/guvihost-api";

type CategoryRow = Record<string, unknown> & { id: string };
type ArticleRow = Record<string, unknown> & { id: string };

export default function AdminKbPage() {
  const isStaff = useIsStaff();
  const qc = useQueryClient();
  const [catDialog, setCatDialog] = useState<"create" | "edit" | null>(null);
  const [artDialog, setArtDialog] = useState<"create" | "edit" | null>(null);
  const [editCat, setEditCat] = useState<CategoryRow | null>(null);
  const [editArt, setEditArt] = useState<ArticleRow | null>(null);
  const [catForm, setCatForm] = useState({ name: "", slug: "", description: "", sortOrder: "0", isActive: true });
  const [artForm, setArtForm] = useState({
    categoryId: "",
    title: "",
    slug: "",
    summary: "",
    content: "",
    status: "DRAFT",
    isFeatured: false,
  });

  const categoriesQuery = useQuery({
    queryKey: ["admin-kb-categories"],
    queryFn: listAdminKbCategories,
    enabled: isStaff,
  });

  const articlesQuery = useQuery({
    queryKey: ["admin-kb-articles"],
    queryFn: () => listAdminKbArticles({ page: 1, limit: 50 }),
    enabled: isStaff,
  });

  const saveCatMutation = useMutation({
    mutationFn: () => {
      const body = {
        name: catForm.name,
        slug: catForm.slug,
        description: catForm.description || undefined,
        sortOrder: parseInt(catForm.sortOrder, 10) || 0,
        isActive: catForm.isActive,
      };
      return editCat ? updateAdminKbCategory(editCat.id, body) : createAdminKbCategory(body);
    },
    onSuccess: () => {
      toast.success(editCat ? "Category updated" : "Category created");
      setCatDialog(null);
      setEditCat(null);
      qc.invalidateQueries({ queryKey: ["admin-kb-categories"] });
    },
    onError: (err) => {
      toast.error(err instanceof GuvihostApiError ? err.message : "Failed to save category");
    },
  });

  const deleteCatMutation = useMutation({
    mutationFn: (id: string) => deleteAdminKbCategory(id),
    onSuccess: () => {
      toast.success("Category deleted");
      qc.invalidateQueries({ queryKey: ["admin-kb-categories"] });
    },
    onError: (err) => {
      toast.error(err instanceof GuvihostApiError ? err.message : "Failed to delete category");
    },
  });

  const saveArtMutation = useMutation({
    mutationFn: () => {
      const body = {
        categoryId: artForm.categoryId,
        title: artForm.title,
        slug: artForm.slug,
        summary: artForm.summary || undefined,
        content: artForm.content,
        status: artForm.status,
        isFeatured: artForm.isFeatured,
      };
      return editArt ? updateAdminKbArticle(editArt.id, body) : createAdminKbArticle(body);
    },
    onSuccess: () => {
      toast.success(editArt ? "Article updated" : "Article created");
      setArtDialog(null);
      setEditArt(null);
      qc.invalidateQueries({ queryKey: ["admin-kb-articles"] });
    },
    onError: (err) => {
      toast.error(err instanceof GuvihostApiError ? err.message : "Failed to save article");
    },
  });

  const deleteArtMutation = useMutation({
    mutationFn: (id: string) => deleteAdminKbArticle(id),
    onSuccess: () => {
      toast.success("Article deleted");
      qc.invalidateQueries({ queryKey: ["admin-kb-articles"] });
    },
    onError: (err) => {
      toast.error(err instanceof GuvihostApiError ? err.message : "Failed to delete article");
    },
  });

  const publishMutation = useMutation({
    mutationFn: ({ id, publish }: { id: string; publish: boolean }) => publishAdminKbArticle(id, publish),
    onSuccess: () => {
      toast.success("Article publish status updated");
      qc.invalidateQueries({ queryKey: ["admin-kb-articles"] });
    },
    onError: (err) => {
      toast.error(err instanceof GuvihostApiError ? err.message : "Failed to update publish status");
    },
  });

  if (!isStaff) {
    return <PageError message="You must be signed in as staff to manage the knowledge base." />;
  }
  if (categoriesQuery.isLoading || articlesQuery.isLoading) {
    return <PageLoader message="Loading knowledge base..." />;
  }

  const categories = (categoriesQuery.data ?? []) as CategoryRow[];
  const articles = (articlesQuery.data?.items ?? []) as ArticleRow[];

  const openCreateCat = () => {
    setEditCat(null);
    setCatForm({ name: "", slug: "", description: "", sortOrder: "0", isActive: true });
    setCatDialog("create");
  };

  const openEditCat = (cat: CategoryRow) => {
    setEditCat(cat);
    setCatForm({
      name: String(cat.name ?? ""),
      slug: String(cat.slug ?? ""),
      description: String(cat.description ?? ""),
      sortOrder: String(cat.sortOrder ?? 0),
      isActive: Boolean(cat.isActive ?? true),
    });
    setCatDialog("edit");
  };

  const openCreateArt = () => {
    setEditArt(null);
    setArtForm({
      categoryId: categories[0]?.id ?? "",
      title: "",
      slug: "",
      summary: "",
      content: "",
      status: "DRAFT",
      isFeatured: false,
    });
    setArtDialog("create");
  };

  const openEditArt = (art: ArticleRow) => {
    setEditArt(art);
    setArtForm({
      categoryId: String(art.categoryId ?? ""),
      title: String(art.title ?? ""),
      slug: String(art.slug ?? ""),
      summary: String(art.summary ?? ""),
      content: String(art.content ?? ""),
      status: String(art.status ?? "DRAFT"),
      isFeatured: Boolean(art.isFeatured),
    });
    setArtDialog("edit");
  };

  return (
    <AdminLayout>
      <div className="max-w-[1200px] mx-auto space-y-6 pb-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h1 className="text-[22px] font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-blue-600" />
            Knowledge Base
          </h1>
          <p className="text-sm text-slate-500 mt-1">Manage help categories and articles.</p>
        </div>

        <Tabs defaultValue="categories">
          <TabsList className="bg-white border border-slate-100 rounded-xl p-1">
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="articles">Articles</TabsTrigger>
          </TabsList>

          <TabsContent value="categories" className="space-y-4">
            <div className="flex justify-end">
              <Button className="gap-2" onClick={openCreateCat}>
                <Plus className="h-4 w-4" /> Add Category
              </Button>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Slug</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Order</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {categories.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                        No categories yet
                      </td>
                    </tr>
                  ) : (
                    categories.map((cat) => (
                      <tr key={cat.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-medium">{String(cat.name)}</td>
                        <td className="px-4 py-3 text-slate-500">{String(cat.slug)}</td>
                        <td className="px-4 py-3">{String(cat.sortOrder ?? 0)}</td>
                        <td className="px-4 py-3">
                          <StatusBadge status={cat.isActive ? "active" : "inactive"} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            <Button size="sm" variant="ghost" onClick={() => openEditCat(cat)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-rose-600"
                              onClick={() => {
                                if (confirm("Delete this category?")) deleteCatMutation.mutate(cat.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="articles" className="space-y-4">
            <div className="flex justify-end">
              <Button className="gap-2" onClick={openCreateArt} disabled={categories.length === 0}>
                <Plus className="h-4 w-4" /> Add Article
              </Button>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Title</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Updated</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {articles.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                        No articles yet
                      </td>
                    </tr>
                  ) : (
                    articles.map((art) => (
                      <tr key={art.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3">
                          <p className="font-medium">{String(art.title)}</p>
                          <p className="text-xs text-slate-500">{String(art.slug)}</p>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={String(art.status ?? "draft").toLowerCase()} />
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {formatDate(String(art.updatedAt ?? art.createdAt ?? ""))}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1 flex-wrap">
                            <Button size="sm" variant="outline" onClick={() => openEditArt(art)}>
                              Edit
                            </Button>
                            {String(art.status) === "PUBLISHED" ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => publishMutation.mutate({ id: art.id, publish: false })}
                              >
                                Unpublish
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => publishMutation.mutate({ id: art.id, publish: true })}
                              >
                                Publish
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-rose-600"
                              onClick={() => {
                                if (confirm("Delete this article?")) deleteArtMutation.mutate(art.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>

        <Dialog open={catDialog !== null} onOpenChange={() => setCatDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editCat ? "Edit Category" : "New Category"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Field label="Name" value={catForm.name} onChange={(v) => setCatForm((f) => ({ ...f, name: v }))} />
              <Field label="Slug" value={catForm.slug} onChange={(v) => setCatForm((f) => ({ ...f, slug: v }))} />
              <Field label="Description" value={catForm.description} onChange={(v) => setCatForm((f) => ({ ...f, description: v }))} />
              <Field label="Sort Order" value={catForm.sortOrder} onChange={(v) => setCatForm((f) => ({ ...f, sortOrder: v }))} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCatDialog(null)}>Cancel</Button>
              <Button disabled={saveCatMutation.isPending} onClick={() => saveCatMutation.mutate()}>
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={artDialog !== null} onOpenChange={() => setArtDialog(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editArt ? "Edit Article" : "New Article"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Category</Label>
                <select
                  value={artForm.categoryId}
                  onChange={(e) => setArtForm((f) => ({ ...f, categoryId: e.target.value }))}
                  className="mt-1.5 w-full h-10 rounded-md border border-slate-200 px-3 text-sm bg-white"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {String(c.name)}
                    </option>
                  ))}
                </select>
              </div>
              <Field label="Title" value={artForm.title} onChange={(v) => setArtForm((f) => ({ ...f, title: v }))} />
              <Field label="Slug" value={artForm.slug} onChange={(v) => setArtForm((f) => ({ ...f, slug: v }))} />
              <Field label="Summary" value={artForm.summary} onChange={(v) => setArtForm((f) => ({ ...f, summary: v }))} />
              <div>
                <Label>Content</Label>
                <textarea
                  value={artForm.content}
                  onChange={(e) => setArtForm((f) => ({ ...f, content: e.target.value }))}
                  rows={6}
                  className="mt-1.5 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setArtDialog(null)}>Cancel</Button>
              <Button disabled={saveArtMutation.isPending} onClick={() => saveArtMutation.mutate()}>
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} className="mt-1.5" />
    </div>
  );
}
