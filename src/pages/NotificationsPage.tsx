import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ClientRoute } from "@/components/ClientRoute";
import { PageLoader, PageError } from "@/components/PageLoader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { listNotifications, markAllNotificationsRead, markNotificationRead } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Bell, Check } from "lucide-react";
import { toast } from "sonner";

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  type: string;
  readAt: string | null;
  createdAt: string;
};

export default function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => listNotifications({ limit: 50 }),
  });

  const markAllMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      toast.success("All notifications marked as read");
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notification-count"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notification-count"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <PageLoader message="Loading notifications..." />;
  if (isError) {
    return <PageError message={error instanceof Error ? error.message : "Failed to load notifications"} />;
  }

  const items = (data?.items ?? []) as NotificationItem[];
  const unread = items.filter((n) => !n.readAt).length;

  return (
    <ClientRoute>
      <AdminLayout>
        <div className="p-6 bg-[#f8f9fa] min-h-full font-sans max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Bell className="text-blue-600" size={28} />
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
                <p className="text-sm text-slate-500">{unread} unread</p>
              </div>
            </div>
            {unread > 0 && (
              <Button variant="outline" size="sm" className="gap-2" disabled={markAllMutation.isPending} onClick={() => markAllMutation.mutate()}>
                <Check size={14} /> Mark all read
              </Button>
            )}
          </div>

          {items.length === 0 ? (
            <Card className="p-8 text-center rounded-2xl border-slate-100 shadow-sm">
              <p className="text-slate-500">No notifications yet.</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {items.map((n) => (
                <Card
                  key={n.id}
                  className={cn(
                    "p-4 rounded-xl border-slate-100 shadow-sm cursor-pointer transition-colors hover:border-blue-200",
                    !n.readAt && "bg-blue-50/30 border-blue-100"
                  )}
                  onClick={() => {
                    if (!n.readAt) markReadMutation.mutate(n.id);
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className={cn("text-sm", !n.readAt ? "font-semibold" : "font-medium")}>{n.title}</p>
                      <p className="text-xs text-slate-500 mt-1">{n.body}</p>
                      <p className="text-[11px] text-slate-400 mt-2">{formatDateTime(n.createdAt)}</p>
                    </div>
                    {!n.readAt && <span className="h-2 w-2 rounded-full bg-blue-600 shrink-0 mt-1.5" />}
                  </div>
                </Card>
              ))}
            </div>
          )}

          <p className="text-center mt-6">
            <Link to="/client-dashboard" className="text-sm text-blue-600 hover:underline">Back to dashboard</Link>
          </p>
        </div>
      </AdminLayout>
    </ClientRoute>
  );
}
