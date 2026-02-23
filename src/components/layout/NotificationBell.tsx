"use client";

import useSWR, { mutate } from "swr";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { fetcher } from "@/lib/fetcher";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  data: { projectId?: string; storyId?: string } | null;
}

interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
}

const NOTIFICATIONS_KEY = "/api/notifications?limit=10";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const { data, mutate: mutateNotifications } = useSWR<NotificationsResponse>(
    NOTIFICATIONS_KEY,
    fetcher,
    { refreshInterval: 30000, revalidateOnFocus: true }
  );

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  async function markAsRead(id: string) {
    // Optimistic update
    mutateNotifications(
      (prev) => prev
        ? {
            ...prev,
            notifications: prev.notifications.map((n) => n.id === id ? { ...n, read: true } : n),
            unreadCount: Math.max(0, prev.unreadCount - 1),
          }
        : prev,
      false
    );

    try {
      await fetch(`/api/notifications/${id}`, { method: "PATCH" });
    } finally {
      mutateNotifications();
    }
  }

  async function markAllAsRead() {
    // Optimistic update
    mutateNotifications(
      (prev) => prev
        ? { ...prev, notifications: prev.notifications.map((n) => ({ ...n, read: true })), unreadCount: 0 }
        : prev,
      false
    );

    try {
      await fetch("/api/notifications", { method: "POST" });
    } finally {
      mutateNotifications();
    }
  }

  function formatTime(dateString: string) {
    const diff = Date.now() - new Date(dateString).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (minutes < 1) return "À l'instant";
    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours} h`;
    return `Il y a ${days} j`;
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button className="relative h-9 w-9 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors cursor-pointer">
          <Bell size={18} />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <span className="font-semibold">Notifications</span>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-8 text-xs">
              Tout marquer comme lu
            </Button>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="px-3 py-8 text-center text-muted-foreground text-sm">
              Aucune notification
            </div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={cn(
                  "flex flex-col items-start gap-1 p-3 cursor-pointer",
                  !notification.read && "bg-muted/50"
                )}
                onClick={() => {
                  if (!notification.read) markAsRead(notification.id);
                  const raw = notification.data;
                  const d = (typeof raw === "string" ? JSON.parse(raw) : raw) as { projectId?: string; storyId?: string } | null;
                  if (d?.projectId && d?.storyId) {
                    setOpen(false);
                    router.push(`/project/${d.projectId}?tab=backlog&story=${d.storyId}`);
                  }
                }}
              >
                <div className="flex items-start justify-between w-full gap-2">
                  <span className={cn("font-medium text-sm", !notification.read && "text-foreground")}>
                    {notification.title}
                  </span>
                  {!notification.read && (
                    <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{notification.message}</p>
                <span className="text-xs text-muted-foreground">{formatTime(notification.createdAt)}</span>
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
