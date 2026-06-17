import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PageError, PageLoader } from "@/components/PageLoader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { getStaffTicket, staffCloseTicket, staffReplyTicket } from "@/lib/api";
import { formatDateTime, formatEnumLabel, userDisplayName } from "@/lib/format";
import { ArrowLeft, CheckCircle2, Clock, FileText, Headset, Send, User } from "lucide-react";

export default function TicketViewPage() {
  const [searchParams] = useSearchParams();
  const ticketId = searchParams.get("id") ?? "";
  const [reply, setReply] = useState("");
  const queryClient = useQueryClient();

  const { data: ticket, isLoading, isError, error } = useQuery({
    queryKey: ["staff-ticket", ticketId],
    queryFn: () => getStaffTicket(ticketId),
    enabled: Boolean(ticketId),
  });

  const replyMutation = useMutation({
    mutationFn: () => staffReplyTicket(ticketId, reply, "IN_PROGRESS"),
    onSuccess: () => {
      toast.success("Reply sent");
      setReply("");
      queryClient.invalidateQueries({ queryKey: ["staff-ticket", ticketId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const closeMutation = useMutation({
    mutationFn: () => staffCloseTicket(ticketId),
    onSuccess: () => {
      toast.success("Ticket closed");
      queryClient.invalidateQueries({ queryKey: ["staff-ticket", ticketId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!ticketId) {
    return (
      <AdminLayout>
        <div className="p-6">
          <p className="text-slate-600">Missing ticket ID. Open a ticket from the support list.</p>
          <Button asChild className="mt-4">
            <Link to="/support/all">Back to Tickets</Link>
          </Button>
        </div>
      </AdminLayout>
    );
  }

  if (isLoading) return <PageLoader />;
  if (isError || !ticket) return <PageError message={error instanceof Error ? error.message : "Failed to load ticket"} />;

  const t = ticket as Record<string, unknown>;
  const user = t.user as Record<string, unknown> | undefined;
  const messages = (t.messages as Record<string, unknown>[]) ?? [];
  const department = t.department as Record<string, unknown> | undefined;
  const service = t.service as Record<string, unknown> | undefined;

  return (
    <AdminLayout>
      <div className="mx-auto max-w-[1400px] bg-[#ffffff] p-6 font-sans">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-slate-900">Ticket #{String(t.ticketNumber ?? "")}</h1>
              <Badge className="border-0 bg-purple-50 px-3 py-1 font-bold text-purple-600">
                {formatEnumLabel(String(t.status ?? ""))}
              </Badge>
            </div>
            <p className="mt-1 text-xs text-slate-400">Created {formatDateTime(String(t.createdAt ?? ""))}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" className="border" asChild>
              <Link to="/support/all">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Link>
            </Button>
            <Button variant="outline" onClick={() => closeMutation.mutate()} disabled={closeMutation.isPending}>
              <CheckCircle2 className="mr-2 h-4 w-4" /> Close Ticket
            </Button>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <MetaCard icon={FileText} label="Department" value={String(department?.name ?? "—")} />
          <MetaCard icon={Headset} label="Service" value={String(service?.name ?? "—")} />
          <MetaCard
            icon={User}
            label="Submitted By"
            value={userDisplayName(user)}
            sub={String(user?.email ?? "")}
          />
          <MetaCard
            icon={Clock}
            label="Last Updated"
            value={formatDateTime(String(t.updatedAt ?? ""))}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="space-y-4 rounded-2xl border-slate-100 p-6 shadow-sm lg:col-span-2">
            <h2 className="font-bold text-slate-900">{String(t.subject ?? "")}</h2>
            <p className="text-sm text-slate-600">{String(t.description ?? "")}</p>

            <div className="space-y-4 border-t pt-4">
              {messages.map((msg) => {
                const author = msg.user as Record<string, unknown> | undefined;
                return (
                  <div key={String(msg.id)} className="rounded-lg bg-slate-50 p-4">
                    <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
                      <span className="font-semibold text-slate-700">{userDisplayName(author)}</span>
                      <span>{formatDateTime(String(msg.createdAt ?? ""))}</span>
                    </div>
                    <p className="text-sm text-slate-700">{String(msg.content ?? "")}</p>
                  </div>
                );
              })}
            </div>

            <div className="border-t pt-4">
              <Textarea
                placeholder="Write your reply..."
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                rows={4}
              />
              <Button
                className="mt-3 bg-blue-600"
                onClick={() => replyMutation.mutate()}
                disabled={!reply.trim() || replyMutation.isPending}
              >
                <Send className="mr-2 h-4 w-4" /> Send Reply
              </Button>
            </div>
          </Card>

          <Card className="rounded-2xl border-slate-100 p-6 shadow-sm">
            <h3 className="mb-4 font-bold text-slate-900">Ticket Details</h3>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-slate-500">Priority</dt>
                <dd className="font-medium">{formatEnumLabel(String(t.priority ?? ""))}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Category</dt>
                <dd className="font-medium">{String((t.category as Record<string, unknown>)?.name ?? "—")}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Phone</dt>
                <dd className="font-medium">{String(user?.phone ?? "—")}</dd>
              </div>
            </dl>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}

function MetaCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: typeof FileText;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <Card className="rounded-xl border-slate-100 p-4 shadow-sm">
      <div className="mb-2 flex items-center gap-2 text-slate-500">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-semibold uppercase">{label}</span>
      </div>
      <p className="text-sm font-bold text-slate-800">{value}</p>
      {sub ? <p className="text-xs text-slate-500">{sub}</p> : null}
    </Card>
  );
}
