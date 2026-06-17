import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ClientRoute } from "@/components/ClientRoute";
import { PageLoader, PageError } from "@/components/PageLoader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { closeTicket, getTicket, replyToTicket, uploadTicketAttachments } from "@/lib/api";
import { formatDateTime, formatEnumLabel, userDisplayName } from "@/lib/format";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle, Headset, Paperclip, Send, User } from "lucide-react";

type TicketMessage = {
  id: string;
  content: string;
  isStaff: boolean;
  createdAt: string;
  user?: { firstName?: string; lastName?: string; role?: string };
};

export default function ClientTicketPage() {
  const { id = "" } = useParams();
  const queryClient = useQueryClient();
  const [reply, setReply] = useState("");

  const { data: ticket, isLoading, isError, error } = useQuery({
    queryKey: ["client-ticket", id],
    queryFn: () => getTicket(id),
    enabled: Boolean(id),
  });

  const replyMutation = useMutation({
    mutationFn: () => replyToTicket(id, reply.trim()),
    onSuccess: () => {
      toast.success("Reply sent");
      setReply("");
      queryClient.invalidateQueries({ queryKey: ["client-ticket", id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const closeMutation = useMutation({
    mutationFn: () => closeTicket(id),
    onSuccess: () => {
      toast.success("Ticket closed");
      queryClient.invalidateQueries({ queryKey: ["client-ticket", id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const uploadMutation = useMutation({
    mutationFn: (files: FileList) => uploadTicketAttachments(id, Array.from(files)),
    onSuccess: () => {
      toast.success("Attachments uploaded");
      queryClient.invalidateQueries({ queryKey: ["client-ticket", id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <PageLoader message="Loading ticket..." />;
  if (isError) {
    return <PageError message={error instanceof Error ? error.message : "Failed to load ticket"} />;
  }

  const t = ticket!;
  const status = String(t.status ?? "");
  const isClosed = status === "CLOSED";
  const messages = (t.messages as TicketMessage[]) ?? [];
  const attachments = (t.attachments as { id: string; filename: string; size?: number }[]) ?? [];
  const department = t.department as { name?: string } | undefined;
  const category = t.category as { name?: string } | undefined;

  return (
    <ClientRoute>
      <AdminLayout>
        <div className="p-6 bg-[#f8f9fa] min-h-full font-sans">
          <Link to="/support/create" className="inline-flex items-center gap-2 text-sm text-blue-600 mb-4">
            <ArrowLeft size={16} /> Back
          </Link>

          <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                <Headset size={16} /> {String(t.ticketNumber)}
              </div>
              <h1 className="text-xl font-bold text-slate-900">{String(t.subject)}</h1>
              <p className="text-sm text-slate-500 mt-1">
                {department?.name ?? "—"} · {category?.name ?? "—"} · {formatEnumLabel(String(t.priority))}
              </p>
            </div>
            <Badge>{formatEnumLabel(status)}</Badge>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 p-6 rounded-2xl border-slate-100 shadow-sm">
              <h2 className="font-bold mb-4">Conversation</h2>
              <div className="space-y-4 mb-6">
                {messages.length === 0 ? (
                  <p className="text-sm text-slate-500">{String(t.description)}</p>
                ) : (
                  messages.map((m) => (
                    <div
                      key={m.id}
                      className={`rounded-lg p-4 text-sm ${m.isStaff ? "bg-blue-50 border border-blue-100" : "bg-slate-50 border border-slate-100"}`}
                    >
                      <div className="flex items-center gap-2 mb-2 text-xs text-slate-500">
                        <User size={12} />
                        {m.isStaff ? "Support Team" : userDisplayName(m.user)}
                        <span>·</span>
                        {formatDateTime(m.createdAt)}
                      </div>
                      <p className="whitespace-pre-wrap">{m.content}</p>
                    </div>
                  ))
                )}
              </div>

              {!isClosed && (
                <div className="border-t pt-4 space-y-3">
                  <Textarea
                    placeholder="Type your reply..."
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    rows={3}
                  />
                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      className="gap-2 bg-blue-600"
                      disabled={!reply.trim() || replyMutation.isPending}
                      onClick={() => replyMutation.mutate()}
                    >
                      <Send size={16} /> Send Reply
                    </Button>
                    <label className="inline-flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                      <Paperclip size={16} />
                      <input
                        type="file"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.length) uploadMutation.mutate(e.target.files);
                          e.target.value = "";
                        }}
                      />
                      Attach files
                    </label>
                  </div>
                </div>
              )}

              {attachments.length > 0 && (
                <div className="border-t pt-4 mt-4">
                  <h3 className="text-sm font-semibold mb-2">Attachments</h3>
                  <ul className="text-sm space-y-1">
                    {attachments.map((a) => (
                      <li key={a.id} className="text-slate-600">{a.filename}</li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>

            <Card className="p-6 rounded-2xl border-slate-100 shadow-sm space-y-4 h-fit">
              <h2 className="font-bold">Ticket Info</h2>
              <dl className="text-sm space-y-2">
                <Info label="Created" value={formatDateTime(t.createdAt as string)} />
                <Info label="Updated" value={formatDateTime(t.updatedAt as string)} />
                <Info label="Status" value={formatEnumLabel(status)} />
              </dl>
              {!isClosed && (
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  disabled={closeMutation.isPending}
                  onClick={() => closeMutation.mutate()}
                >
                  <CheckCircle size={16} /> Close Ticket
                </Button>
              )}
            </Card>
          </div>
        </div>
      </AdminLayout>
    </ClientRoute>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
