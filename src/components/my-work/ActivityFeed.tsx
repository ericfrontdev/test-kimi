"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, AtSign, Activity } from "lucide-react";
import { useMyWorkStore } from "@/stores/my-work";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Tab = "all" | "comments" | "mentions";

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "À l'instant";
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays === 1) return "Hier";
  if (diffDays < 7) return `Il y a ${diffDays} jours`;
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function dateGroup(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const itemDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (itemDay.getTime() === today.getTime()) return "Aujourd'hui";
  if (itemDay.getTime() === yesterday.getTime()) return "Hier";
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
}

function truncate(text: string, max = 80): string {
  return text.length > max ? text.slice(0, max) + "…" : text;
}

export function ActivityFeed() {
  const { comments, mentions, isLoading, fetchMyWork } = useMyWorkStore();
  const [tab, setTab] = useState<Tab>("all");
  const [initial, setInitial] = useState<string>("?");
  const router = useRouter();

  useEffect(() => {
    fetchMyWork();
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      const fullName =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email ||
        "";
      setInitial(fullName.charAt(0).toUpperCase());
    });
  }, [fetchMyWork]);

  function handleMentionClick(item: FeedItem) {
    if (item.projectId && item.storyId) {
      router.push(`/project/${item.projectId}?tab=backlog&story=${item.storyId}`);
    }
  }

  // Build unified feed for "Toute l'activité" — only user-specific events
  const allItems = [
    ...comments.map((c) => ({
      id: c.id,
      content: `Vous avez commenté : « ${truncate(c.content)} »`,
      sub: `${c.project} · ${c.story}`,
      time: c.time,
    })),
    ...mentions.map((m) => ({
      id: `m-${m.id}`,
      content: m.message,
      sub: m.title,
      time: m.time,
      dimmed: m.read,
      projectId: m.projectId ?? undefined,
      storyId: m.storyId ?? undefined,
    })),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  const tabs: { key: Tab; label: string; icon: React.ReactNode; count: number }[] = [
    { key: "all", label: "Toute l'activité", icon: <Activity className="h-3.5 w-3.5" />, count: allItems.length },
    { key: "comments", label: "Commentaires", icon: <MessageSquare className="h-3.5 w-3.5" />, count: comments.length },
    { key: "mentions", label: "Mentions", icon: <AtSign className="h-3.5 w-3.5" />, count: mentions.length },
  ];

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Mon fil d&apos;activité</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-sm text-muted-foreground">
            Chargement...
          </div>
        </CardContent>
      </Card>
    );
  }

  function renderItems() {
    if (tab === "comments") {
      if (comments.length === 0) return <EmptyState label="Aucun commentaire récent" />;

      // Group by date
      const groups = groupByDate(comments.map((c) => ({ id: c.id, content: c.content, time: c.time, sub: `${c.project} · ${c.story}` })));
      return renderGroups(groups, initial, true);
    }

    if (tab === "mentions") {
      if (mentions.length === 0) return <EmptyState label="Vous n'avez pas encore été mentionné" />;

      const groups = groupByDate(mentions.map((m) => ({
        id: m.id,
        content: m.message,
        time: m.time,
        sub: m.title,
        dimmed: m.read,
        projectId: m.projectId ?? undefined,
        storyId: m.storyId ?? undefined,
      })));
      return renderGroups(groups, initial, false, handleMentionClick);
    }

    // "all"
    if (allItems.length === 0) return <EmptyState label="Aucune activité récente" />;

    const groups = groupByDate(allItems);
    return renderGroups(groups, initial, false, handleMentionClick);
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Mon fil d&apos;activité</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Tabs */}
        <div className="mb-4 flex gap-1 border-b">
          {tabs.map(({ key, label, icon, count }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                "flex items-center gap-1.5 px-3 pb-2 text-sm transition-colors",
                tab === key
                  ? "border-b-2 border-primary font-medium text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {icon}
              {label}
              {count > 0 && (
                <span className={cn(
                  "rounded-full px-1.5 py-0.5 text-xs",
                  tab === key ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                )}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {renderItems()}
      </CardContent>
    </Card>
  );
}

type FeedItem = { id: string; content: string; time: string; sub?: string; dimmed?: boolean; projectId?: string; storyId?: string };

function groupByDate(items: FeedItem[]): { label: string; items: FeedItem[] }[] {
  const map = new Map<string, FeedItem[]>();
  for (const item of items) {
    const label = dateGroup(item.time);
    if (!map.has(label)) map.set(label, []);
    map.get(label)!.push(item);
  }
  return Array.from(map.entries()).map(([label, items]) => ({ label, items }));
}

function renderGroups(
  groups: { label: string; items: FeedItem[] }[],
  initial: string,
  showQuote: boolean,
  onItemClick?: (item: FeedItem) => void
) {
  return (
    <div className="space-y-4">
      {groups.map(({ label, items }) => (
        <div key={label}>
          <p className="mb-2 text-xs font-medium text-muted-foreground">{label}</p>
          <div className="space-y-3">
            {items.map((item) => {
              const isClickable = !!onItemClick && !!item.projectId && !!item.storyId;
              return (
              <div
                key={item.id}
                className={cn(
                  "flex gap-3",
                  item.dimmed && "opacity-60",
                  isClickable && "cursor-pointer rounded-md px-1 -mx-1 hover:bg-accent/50 transition-colors"
                )}
                onClick={isClickable ? () => onItemClick!(item) : undefined}
              >
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xs font-medium text-white">
                  {initial}
                </div>
                <div className="flex-1 space-y-0.5">
                  <p className="text-sm leading-snug">
                    {showQuote ? `« ${item.content} »` : item.content}
                  </p>
                  {item.sub && (
                    <p className="text-xs text-muted-foreground">{item.sub}</p>
                  )}
                  <p className="text-xs text-muted-foreground">{formatTime(item.time)}</p>
                </div>
              </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <p className="py-8 text-center text-sm text-muted-foreground">{label}</p>
  );
}
