"use client";

import { useState } from "react";
import { MoreHorizontal, Layers, ArrowRight, ArrowLeft } from "lucide-react";
import { StoryDetailDialog } from "./StoryDetailDialog";
import { EditStoryDialog } from "./EditStoryDialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useProjectStore } from "@/stores/project";
import type { Story } from "./kanban/types";

interface BacklogTabProps {
  projectId: string;
}

export function BacklogTab({ projectId }: BacklogTabProps) {
  const stories = useProjectStore((state) => state.stories);
  const updateStoryStatus = useProjectStore((state) => state.updateStoryStatus);
  const updateStoryFields = useProjectStore((state) => state.updateStoryFields);

  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const backlogStories = stories.filter((s) => s.status === "BACKLOG");
  const boardStories = stories.filter((s) => s.status !== "BACKLOG" && s.status !== "ARCHIVED");

  function handleView(story: Story) {
    setSelectedStory(story);
    setIsDetailOpen(true);
  }

  function handleEdit(story: Story) {
    setSelectedStory(story);
    setIsEditOpen(true);
  }

  function handleSaveEdit(storyId: string, data: { title: string; description: string; status: string }) {
    updateStoryFields(storyId, data);
    setIsEditOpen(false);
  }

  return (
    <div className="space-y-8">
      {/* Table Backlog */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">
            Backlog
            <Badge variant="secondary" className="ml-2">
              {backlogStories.length}
            </Badge>
          </h3>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[60%]">Nom</TableHead>
                <TableHead>Sub-tasks</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {backlogStories.map((story) => (
                <TableRow key={story.id} className="cursor-pointer">
                  <TableCell className="font-medium">
                    <div className="flex flex-col gap-1">
                      <span className="truncate">{story.title}</span>
                      <Badge variant="outline" className="w-fit text-xs">
                        Backlog
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    {story.subtasks > 0 ? (
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Layers size={14} />
                        <span>{story.subtasks}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal size={16} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => updateStoryStatus(story.id, "TODO")}>
                          <ArrowRight className="mr-2 h-4 w-4" />
                          Envoyer au tableau
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleView(story)}>Voir</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(story)}>Modifier</DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => updateStoryStatus(story.id, "ARCHIVED")}
                          className="text-destructive"
                        >
                          Archiver
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {backlogStories.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center text-sm text-muted-foreground">
                    Aucune story dans le backlog
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Table Dans le tableau */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">
            Dans le tableau
            <Badge variant="secondary" className="ml-2">
              {boardStories.length}
            </Badge>
          </h3>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[60%]">Nom</TableHead>
                <TableHead>Sub-tasks</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {boardStories.map((story) => (
                <TableRow key={story.id} className="cursor-pointer">
                  <TableCell className="font-medium">
                    <div className="flex flex-col gap-1">
                      <span className="truncate">{story.title}</span>
                      <Badge
                        variant={story.status === "DONE" ? "default" : "outline"}
                        className="w-fit text-xs"
                      >
                        {story.status === "TODO" && "À faire"}
                        {story.status === "IN_PROGRESS" && "En cours"}
                        {story.status === "IN_REVIEW" && "En révision"}
                        {story.status === "DONE" && "Terminé"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    {story.subtasks > 0 ? (
                      <div className="flex items-center gap-1.5 text-sm">
                        <Layers size={14} className="text-muted-foreground" />
                        <span>{story.completedSubtasks}/{story.subtasks}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal size={16} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => updateStoryStatus(story.id, "BACKLOG")}>
                          <ArrowLeft className="mr-2 h-4 w-4" />
                          Renvoyer au backlog
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleView(story)}>Voir</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(story)}>Modifier</DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => updateStoryStatus(story.id, "ARCHIVED")}
                          className="text-destructive"
                        >
                          Archiver
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {boardStories.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center text-sm text-muted-foreground">
                    Aucune story dans le tableau
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Story Detail Dialog */}
      <StoryDetailDialog
        story={selectedStory}
        projectId={projectId}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
      />

      {/* Edit Story Dialog */}
      <EditStoryDialog
        story={selectedStory}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        onSave={handleSaveEdit}
      />
    </div>
  );
}
