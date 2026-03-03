"use client";

import { useState } from "react";
import { Layers } from "lucide-react";
import { useMyWorkStore, MyWorkStory } from "@/stores/my-work";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StoryDetailDialog } from "@/components/project/StoryDetailDialog";

type FilterMode = "active" | "in_review" | "done" | "all";

const STATUS_ORDER = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"] as const;

const STATUS_LABELS: Record<string, string> = {
  TODO: "À faire",
  IN_PROGRESS: "En cours",
  IN_REVIEW: "En révision",
  DONE: "Terminé",
};

const STATUS_BADGE_CLASSES: Record<string, string> = {
  TODO: "bg-slate-100 text-slate-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  IN_REVIEW: "bg-yellow-100 text-yellow-700",
  DONE: "bg-emerald-100 text-emerald-700",
};

type SelectedStory = {
  story: { id: string; storyNumber: number; title: string; type: "FEATURE" | "FIX" };
  projectId: string;
};

export function MyStories() {
  const { stories, isLoading } = useMyWorkStore();
  const [filter, setFilter] = useState<FilterMode>("active");
  const [selectedStory, setSelectedStory] = useState<SelectedStory | null>(null);

  const filteredStories =
    filter === "active"
      ? stories.filter((s) => s.status === "TODO" || s.status === "IN_PROGRESS")
      : filter === "in_review"
      ? stories.filter((s) => s.status === "IN_REVIEW")
      : filter === "done"
      ? stories.filter((s) => s.status === "DONE")
      : stories;

  const grouped = STATUS_ORDER.reduce<Record<string, MyWorkStory[]>>((acc, status) => {
    const group = filteredStories.filter((s) => s.status === status);
    if (group.length > 0) acc[status] = group;
    return acc;
  }, {});

  function handleStoryClick(story: MyWorkStory) {
    setSelectedStory({
      story: { id: story.id, storyNumber: story.storyNumber, title: story.title, type: story.type },
      projectId: story.projectId,
    });
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Mes stories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-sm text-muted-foreground">Chargement...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-semibold">Mes stories</CardTitle>
          <Select value={filter} onValueChange={(v) => setFilter(v as FilterMode)}>
            <SelectTrigger className="h-8 w-auto text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">À faire et en cours</SelectItem>
              <SelectItem value="in_review">En révision</SelectItem>
              <SelectItem value="done">Terminé</SelectItem>
              <SelectItem value="all">Toutes les stories</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="space-y-4">
          {filteredStories.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Aucune story active. Créez-en une dans un projet !
            </div>
          ) : (
            Object.entries(grouped).map(([status, group]) => (
              <div key={status} className="space-y-2">
                <div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-1.5">
                  <span className="text-sm font-medium">{STATUS_LABELS[status]}</span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{group.length}</span>
                </div>
                {group.map((story) => (
                  <div
                    key={story.id}
                    onClick={() => handleStoryClick(story)}
                    className="cursor-pointer rounded-md border p-3 transition-colors hover:bg-muted/30"
                  >
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">{story.title}</h4>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Layers size={14} />
                          <span>
                            {story.completedSubtasks}/{story.subtasks} sous-tâche
                            {story.subtasks !== 1 ? "s" : ""}
                          </span>
                        </div>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE_CLASSES[story.status] ?? ""}`}
                        >
                          {STATUS_LABELS[story.status] ?? story.status}
                        </span>
                      </div>
                      <Badge variant="secondary" className="text-xs font-normal">
                        {story.project}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {selectedStory && (
        <StoryDetailDialog
          story={selectedStory.story}
          projectId={selectedStory.projectId}
          open={!!selectedStory}
          onOpenChange={(open) => !open && setSelectedStory(null)}
        />
      )}
    </>
  );
}
