import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Check, Clock, FileText, Globe, HardDrive, Headset } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  getNotificationCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { useIsClient } from "@/hooks/use-role";

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  type: string;
  readAt: string | null;
  createdAt: string;
};

const iconMap: Record<string, typeof Bell> = {
  service: HardDrive,
  domain: Globe,
  ticket: Headset,
  billing: FileText,
  general: Bell,
};

const colorMap: Record<string, string> = {
  service: "text-primary bg-primary/10",
  domain: "text-emerald-600 bg-emerald-50",
  ticket: "text-amber-600 bg-amber-50",
  billing: "text-blue-600 bg-blue-50",
  general: "text-slate-600 bg-slate-100",
};

export function NotificationDropdown() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isClient = useIsClient();
  const [open, setOpen] = useState(false);

  const countQuery = useQuery({
    queryKey: ["notification-count"],
    queryFn: getNotificationCount,
    enabled: isClient,
    refetchInterval: 60000,
  });

  const listQuery = useQuery({
    queryKey: ["notifications", "dropdown"],
    queryFn: () => listNotifications({ limit: 10 }),
    enabled: isClient && open,
  });

  const markAllMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notification-count"] });
    },
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notification-count"] });
    },
  });

  if (!isClient) return null;

  const unreadCount = countQuery.data?.count ?? 0;
  const notifications = (listQuery.data?.items ?? []) as NotificationItem[];

  const markAllRead = () => markAllMutation.mutate();

  const handleClick = (n: NotificationItem) => {
    if (!n.readAt) markReadMutation.mutate(n.id);
    setOpen(false);
    navigate("/notifications");
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-muted-foreground">
          <Bell className="h-[18px] w-[18px]" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-[min(340px,calc(100vw-4rem))] max-w-[calc(100vw-4rem)] p-0" style={{ maxWidth: "calc(100vw - 4rem)" }}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
          <h4 className="text-sm font-semibold">Notifications</h4>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-xs text-primary hover:underline flex items-center gap-1">
              <Check className="h-3 w-3" /> Mark all read
            </button>
          )}
        </div>
        <ScrollArea className="max-h-[400px]">
          {listQuery.isLoading ? (
            <p className="px-4 py-6 text-sm text-muted-foreground text-center">Loading...</p>
          ) : notifications.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted-foreground text-center">No notifications</p>
          ) : (
            notifications.map((n) => {
              const Icon = iconMap[n.type] ?? Bell;
              const color = colorMap[n.type] ?? colorMap.general;
              const isUnread = !n.readAt;
              return (
                <div
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={cn(
                    "flex gap-3 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors border-b border-border/20 last:border-0",
                    isUnread && "bg-primary/5"
                  )}
                >
                  <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5", color)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn("text-sm", isUnread ? "font-semibold" : "font-medium")}>{n.title}</p>
                      {isUnread && <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{n.body}</p>
                    <p className="text-[11px] text-muted-foreground/70 mt-1 flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {formatDateTime(n.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </ScrollArea>
        <DropdownMenuSeparator />
        <div className="p-2 text-center">
          <button onClick={() => { setOpen(false); navigate("/notifications"); }} className="text-xs text-primary hover:underline">
            View all notifications
          </button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
