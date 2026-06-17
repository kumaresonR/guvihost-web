import React, { useCallback, useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PageLoader, PageError } from "@/components/PageLoader";
import { createNote, deleteNote, getNotesSummary, listNotes } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { GuvihostApiError } from "@/lib/guvihost-api";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Trash2, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type NoteRow = {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
  isPinned?: boolean;
  category?: { name: string } | null;
  tags?: { tag: { name: string } }[];
};

export default function ClientNotesPage() {
  const [summary, setSummary] = useState<{ total: number; pinned: number; withReminder: number; lastUpdated?: string } | null>(null);
  const [notes, setNotes] = useState<NoteRow[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryRes, notesRes] = await Promise.all([
        getNotesSummary(),
        listNotes({ search: debouncedSearch || undefined, limit: 50 }),
      ]);
      setSummary(summaryRes as typeof summary);
      setNotes(notesRes.items as NoteRow[]);
    } catch (e) {
      const msg = e instanceof GuvihostApiError ? e.message : "Failed to load notes";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;
    setSaving(true);
    try {
      await createNote({ title: newTitle.trim(), content: newContent.trim() });
      toast.success("Note created");
      setNewTitle("");
      setNewContent("");
      setShowForm(false);
      loadData();
    } catch (err) {
      toast.error(err instanceof GuvihostApiError ? err.message : "Failed to create note");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this note?")) return;
    try {
      await deleteNote(id);
      toast.success("Note deleted");
      loadData();
    } catch (err) {
      toast.error(err instanceof GuvihostApiError ? err.message : "Failed to delete note");
    }
  };

  if (loading && !summary) return <PageLoader message="Loading notes..." />;
  if (error && !summary) return <PageError message={error} />;

  const kpiStats = [
    { label: "Total Notes", value: String(summary?.total ?? 0), icon: "📄" },
    { label: "Pinned Notes", value: String(summary?.pinned ?? 0), icon: "📌" },
    { label: "Notes with Reminders", value: String(summary?.withReminder ?? 0), icon: "🔔" },
    { label: "Last Updated", value: summary?.lastUpdated ? formatDate(summary.lastUpdated as string) : "—", icon: "🕒" },
  ];

  return (
    <AdminLayout>
      <div className="p-6 bg-[#ffffff] min-h-screen font-sans">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-xl font-bold text-[#0a1b3f]">Client Notes</h1>
            <p className="text-sm text-slate-500">Add and manage your private notes. These notes are only visible to you.</p>
          </div>
          <Button className="bg-[#1b5df9] hover:bg-blue-700 gap-2" onClick={() => setShowForm(true)}>
            <Plus size={16} /> Add New Note
          </Button>
        </div>

        {showForm && (
          <Card className="p-6 mb-6 rounded-2xl border-blue-100 shadow-sm">
            <form onSubmit={handleCreate} className="space-y-4">
              <Input placeholder="Note title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} required />
              <textarea
                placeholder="Note content"
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                rows={4}
                required
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <div className="flex gap-2">
                <Button type="submit" disabled={saving} className="bg-blue-600">{saving ? "Saving..." : "Save Note"}</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {kpiStats.map((stat) => (
            <Card key={stat.label} className="p-4 flex items-center gap-4 rounded-2xl shadow-sm border-slate-100">
              <div className="text-xl">{stat.icon}</div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase">{stat.label}</p>
                <p className="text-lg font-bold text-slate-800">{stat.value}</p>
              </div>
            </Card>
          ))}
        </div>

        <Card className="p-6 rounded-2xl shadow-sm border-slate-100">
          <div className="flex gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
              <Input placeholder="Search notes..." className="pl-10 h-10" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Button variant="outline" onClick={loadData}><RotateCcw size={16} /></Button>
          </div>

          <table className="w-full text-left">
            <thead className="text-slate-400 text-xs uppercase">
              <tr>
                <th className="pb-4">Title</th>
                <th className="pb-4">Category</th>
                <th className="pb-4">Tags</th>
                <th className="pb-4">Updated On</th>
                <th className="pb-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm">
              {loading ? (
                <tr><td colSpan={5} className="py-6 text-center text-slate-500">Loading...</td></tr>
              ) : notes.length === 0 ? (
                <tr><td colSpan={5} className="py-6 text-center text-slate-500">No notes yet.</td></tr>
              ) : (
                notes.map((note) => (
                  <tr key={note.id} className="hover:bg-slate-50">
                    <td className="py-4 font-medium text-slate-800">{note.title}</td>
                    <td className="py-4">
                      {note.category ? (
                        <Badge variant="secondary" className="bg-blue-50 text-blue-700">{note.category.name}</Badge>
                      ) : "—"}
                    </td>
                    <td className="py-4 text-slate-500">
                      {note.tags?.map((t) => t.tag.name).join(", ") || "—"}
                    </td>
                    <td className="py-4 text-slate-500">{formatDate(note.updatedAt)}</td>
                    <td className="py-4">
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(note.id)} className="text-rose-600 hover:text-rose-700">
                        <Trash2 size={16} />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>
      </div>
    </AdminLayout>
  );
}
