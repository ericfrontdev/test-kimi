"use client";

import { useState, useEffect, useRef } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { X, Edit3, Copy, Link2, CheckSquare, User, Flag, Calendar, Tag, GitBranch, MessageSquare, Clock, MoreHorizontal, Check, Circle, Loader2, FileText, FolderOpen, Archive, ArchiveRestore, CopyCheck, ListChecks, Paperclip } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/ui/user-avatar";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { MentionTextarea, extractMentions } from "@/components/ui/mention-textarea";
import { createClient } from "@/lib/supabase/client";
import { DatePicker } from "@/components/ui/date-picker";
import { LabelSelector } from "@/components/project/LabelSelector";
import { ChecklistSection } from "@/components/project/ChecklistSection";
import type { Label, Checklist } from "@/components/project/kanban/types";

interface TaskAssignee {
  id: string;
  name: string | null;
  email: string;
  avatarUrl?: string | null;
}

interface Task {
  id: string;
  taskNumber: number;
  title: string;
  status: string;
  assignee?: TaskAssignee | null;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    name: string | null;
    email: string;
    avatarUrl?: string | null;
  };
}

interface StoryDetail {
  id: string;
  storyNumber: number;
  title: string;
  description?: string | null;
  status: string;
  type: "FEATURE" | "FIX";
  priority: number;
  createdAt: string;
  tasks: Task[];
  comments: Comment[];
  assignee?: {
    name: string | null;
    email: string;
    avatarUrl?: string | null;
  } | null;
  author?: {
    name: string | null;
    email: string;
    avatarUrl?: string | null;
  } | null;
  dueDate?: string | null;
  labels?: Label[];
  checklists?: Checklist[];
}

interface StoryDetailDialogProps {
  story: { id: string; storyNumber: number; title: string; type: "FEATURE" | "FIX" } | null;
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: () => void;
  scrollToComments?: boolean;
}

function getStatusIcon(status: string) {
  switch (status) {
    case "DONE":
      return <Check className="h-4 w-4 text-emerald-500" />;
    case "IN_PROGRESS":
      return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
    default:
      return <Circle className="h-4 w-4 text-slate-400" />;
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case "TODO": return "À faire";
    case "IN_PROGRESS": return "En cours";
    case "IN_REVIEW": return "En révision";
    case "DONE": return "Terminé";
    case "BACKLOG": return "Backlog";
    case "ARCHIVED": return "Archivé";
    default: return status;
  }
}

function getPriorityLabel(priority: number) {
  switch (priority) {
    case 0: return "P0 - Critique";
    case 1: return "P1 - Haute";
    case 2: return "P2 - Normale";
    case 3: return "P3 - Basse";
    default: return `P${priority}`;
  }
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function StoryDetailDialog({
  story,
  projectId,
  open,
  onOpenChange,
  onEdit,
  scrollToComments = false,
}: StoryDetailDialogProps) {
  const storyKey = open && story ? `/api/projects/${projectId}/stories/${story.id}` : null;
  const commentsKey = open && story ? `/api/projects/${projectId}/stories/${story.id}/comments` : null;
  const membersKey = open ? `/api/projects/${projectId}/members` : null;

  const { data: storyDetail, isLoading, mutate: mutateStory } = useSWR<StoryDetail>(storyKey, fetcher);
  const { data: comments = [], isLoading: isLoadingComments, mutate: mutateComments } = useSWR<Comment[]>(commentsKey, fetcher);
  const { data: projectUsers = [], isLoading: isLoadingUsers } = useSWR<TaskAssignee[]>(membersKey, fetcher);
  const labelsKey = open ? `/api/projects/${projectId}/labels` : null;
  const { data: projectLabels = [], mutate: mutateProjectLabels } = useSWR<Label[]>(labelsKey, fetcher);

  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState("");
  const [isSavingDescription, setIsSavingDescription] = useState(false);

  // New subtask state
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");

  // Comments state
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [currentUserName, setCurrentUserName] = useState<string | null>(null);
  const [currentUserAvatarUrl, setCurrentUserAvatarUrl] = useState<string | null>(null);
  const commentsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !scrollToComments || isLoadingComments) return;
    const timer = setTimeout(() => {
      commentsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
    return () => clearTimeout(timer);
  }, [open, scrollToComments, isLoadingComments]);

  useEffect(() => {
    fetch("/api/users/me")
      .then((r) => r.json())
      .then((data) => {
        setCurrentUserName(data.name ?? data.email ?? null);
        setCurrentUserAvatarUrl(data.avatarUrl ?? null);
      })
      .catch(() => {});
  }, []);

  // Archive confirmation dialog
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  // Restore confirmation dialog
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  // Copy tooltip state
  const [copied, setCopied] = useState(false);

  async function handleSubmitComment() {
    if (!newComment.trim() || !story) return;
    setIsSubmittingComment(true);
    try {
      const mentions = extractMentions(newComment.trim(), projectUsers);
      const response = await fetch(`/api/projects/${projectId}/stories/${story.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment.trim(), mentions }),
      });
      if (response.ok) {
        const comment = await response.json();
        mutateComments((prev) => [...(prev ?? []), comment], false);
        setNewComment("");
      }
    } finally {
      setIsSubmittingComment(false);
    }
  }

  async function handleToggleLabel(label: Label) {
    if (!storyDetail) return;

    const isSelected = storyDetail.labels?.some((l) => l.id === label.id);
    mutateStory(
      {
        ...storyDetail,
        labels: isSelected
          ? storyDetail.labels?.filter((l) => l.id !== label.id)
          : [...(storyDetail.labels ?? []), label],
      },
      false
    );

    try {
      await fetch(`/api/projects/${projectId}/stories/${storyDetail.id}/labels`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ labelId: label.id }),
      });
    } finally {
      mutateStory();
    }
  }

  async function handleCreateAndToggleLabel(name: string, color: string) {
    if (!storyDetail) return;
    const res = await fetch(`/api/projects/${projectId}/labels`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, color }),
    });
    if (res.ok) {
      const newLabel: Label = await res.json();
      mutateProjectLabels((prev) => [...(prev ?? []), newLabel], false);
      await handleToggleLabel(newLabel);
    }
  }

  async function handleAddChecklist() {
    if (!storyDetail) return;
    const res = await fetch(`/api/projects/${projectId}/stories/${storyDetail.id}/checklists`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    if (res.ok) {
      const newChecklist: Checklist = await res.json();
      mutateStory({ ...storyDetail, checklists: [...(storyDetail.checklists ?? []), newChecklist] }, false);
    }
  }

  function handleUpdateChecklists(updater: (prev: Checklist[]) => Checklist[]) {
    if (!storyDetail) return;
    mutateStory({ ...storyDetail, checklists: updater(storyDetail.checklists ?? []) }, false);
  }

  async function handleDeleteChecklist(checklistId: string) {
    if (!storyDetail) return;
    mutateStory({ ...storyDetail, checklists: (storyDetail.checklists ?? []).filter((c) => c.id !== checklistId) }, false);
    await fetch(`/api/projects/${projectId}/stories/${storyDetail.id}/checklists/${checklistId}`, { method: "DELETE" });
  }

  async function handleDeleteLabel(labelId: string) {
    mutateProjectLabels((prev) => prev?.filter((l) => l.id !== labelId), false);
    if (storyDetail) {
      mutateStory({ ...storyDetail, labels: storyDetail.labels?.filter((l) => l.id !== labelId) }, false);
    }
    await fetch(`/api/projects/${projectId}/labels/${labelId}`, { method: "DELETE" });
  }

  async function handleDueDateChange(date: Date | null) {
    if (!storyDetail) return;

    mutateStory(
      { ...storyDetail, dueDate: date ? date.toISOString() : null },
      false
    );

    try {
      await fetch(`/api/projects/${projectId}/stories/${storyDetail.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dueDate: date ? date.toISOString() : null }),
      });
    } finally {
      mutateStory();
    }
  }

  async function handleAssignStory(userId: string | null) {
    if (!storyDetail) return;
    const assignee = userId ? projectUsers.find((u) => u.id === userId) || null : null;

    mutateStory(
      { ...storyDetail, assignee: assignee ? { name: assignee.name, email: assignee.email } : null },
      false
    );

    try {
      await fetch(`/api/projects/${projectId}/stories/${storyDetail.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignee: userId }),
      });
    } finally {
      mutateStory();
    }
  }

  async function handleAssignTask(taskId: string, userId: string | null) {
    if (!storyDetail) return;
    const assignee = userId ? projectUsers.find((u) => u.id === userId) || null : null;

    // Optimistic update
    mutateStory(
      { ...storyDetail, tasks: storyDetail.tasks.map((t) => t.id === taskId ? { ...t, assignee: assignee || undefined } : t) },
      false
    );

    try {
      await fetch(`/api/projects/${projectId}/stories/${storyDetail.id}/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assigneeId: userId }),
      });
    } finally {
      mutateStory();
    }
  }

  async function handleSaveDescription() {
    if (!storyDetail) return;
    setIsSavingDescription(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/stories/${storyDetail.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: editedDescription }),
      });
      if (response.ok) {
        mutateStory({ ...storyDetail, description: editedDescription }, false);
        setIsEditingDescription(false);
      }
    } finally {
      setIsSavingDescription(false);
    }
  }

  function handleStartEditingDescription() {
    setEditedDescription(storyDetail?.description || "");
    setIsEditingDescription(true);
  }

  async function handleAddSubtask() {
    if (!newSubtaskTitle.trim() || !storyDetail) return;
    try {
      const response = await fetch(`/api/projects/${projectId}/stories/${storyDetail.id}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newSubtaskTitle.trim() }),
      });
      if (response.ok) {
        setNewSubtaskTitle("");
        setIsAddingSubtask(false);
        mutateStory(); // Revalidate to get new task
      }
    } catch {
      // silently fail — user can retry
    }
  }

  async function handleToggleTaskStatus(taskId: string, currentStatus: string) {
    if (!storyDetail) return;
    const newStatus = currentStatus === "DONE" ? "TODO" : "DONE";

    // Optimistic update
    mutateStory(
      { ...storyDetail, tasks: storyDetail.tasks.map((t) => t.id === taskId ? { ...t, status: newStatus } : t) },
      false
    );

    try {
      await fetch(`/api/projects/${projectId}/stories/${storyDetail.id}/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
    } finally {
      mutateStory();
    }
  }

  const displayStory = storyDetail || story;
  if (!displayStory) return null;

  const completedTasks = storyDetail?.tasks.filter((t) => t.status === "DONE").length || 0;
  const totalTasks = storyDetail?.tasks.length || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-none w-[60vw] h-[90vh] overflow-hidden flex flex-col p-0 gap-0" showCloseButton={false}>
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b flex flex-row items-center justify-between">
          <DialogTitle className="sr-only">
            Détails de la story {displayStory.title}
          </DialogTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-mono">{displayStory.type}-{displayStory.storyNumber}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
              <Edit3 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="flex flex-1 overflow-hidden">
            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Title */}
              <h1 className="text-2xl font-semibold">{displayStory.title}</h1>

              {/* Description - Editable Inline */}
              <div className="space-y-3">
                {isEditingDescription ? (
                  <div className="space-y-3">
                    <RichTextEditor
                      value={editedDescription}
                      onChange={setEditedDescription}
                      placeholder="Décrivez la story..."
                      variant="borderless"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setIsEditingDescription(false)}
                        disabled={isSavingDescription}
                      >
                        Annuler
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={handleSaveDescription}
                        disabled={isSavingDescription}
                      >
                        {isSavingDescription ? (
                          <>
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            Enregistrement...
                          </>
                        ) : (
                          "Enregistrer"
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {storyDetail?.description ? (
                      <div 
                        className="text-sm text-muted-foreground prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: storyDetail.description }}
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground italic">
                        Aucune description
                      </p>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs" 
                      onClick={handleStartEditingDescription}
                    >
                      <Edit3 className="h-3 w-3 mr-1" />
                      Modifier la description
                    </Button>
                  </div>
                )}
              </div>

              {/* Checklists */}
              {(storyDetail?.checklists ?? []).length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-6">
                    {(storyDetail?.checklists ?? []).map((checklist) => (
                      <ChecklistSection
                        key={checklist.id}
                        checklist={checklist}
                        projectId={projectId}
                        storyId={storyDetail!.id}
                        onUpdate={handleUpdateChecklists}
                        onDelete={handleDeleteChecklist}
                      />
                    ))}
                  </div>
                </>
              )}

              <Separator />

              {/* Sub-tasks */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    <CheckSquare className="h-4 w-4" />
                    Sous-tâches
                    <span className="text-muted-foreground">
                      {completedTasks}/{totalTasks}
                    </span>
                  </h3>
                </div>

                <div className="space-y-1">
                  {storyDetail?.tasks.map((task, index) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 group"
                    >
                      <span className="text-xs text-muted-foreground font-mono w-6">
                        {index + 1}
                      </span>
                      <button 
                        className="flex-shrink-0 cursor-pointer"
                        onClick={() => handleToggleTaskStatus(task.id, task.status)}
                      >
                        {getStatusIcon(task.status)}
                      </button>
                      <span className={cn(
                        "flex-1 text-sm",
                        task.status === "DONE" && "line-through text-muted-foreground"
                      )}>
                        {task.title}
                      </span>
                      <div className="flex items-center gap-1">
                        {/* Assignee Button with Dropdown */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7 relative"
                              title={task.assignee ? `Assigné à ${task.assignee.name || task.assignee.email}` : "Assigner"}
                            >
                              {task.assignee ? (
                                <UserAvatar name={task.assignee.name} email={task.assignee.email} avatarUrl={task.assignee.avatarUrl} size="xs" />
                              ) : (
                                <User className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuItem onClick={() => handleAssignTask(task.id, null)}>
                              <Circle className="h-4 w-4 mr-2 text-slate-400" />
                              Non assigné
                            </DropdownMenuItem>
                            <Separator className="my-1" />
                            {isLoadingUsers ? (
                              <DropdownMenuItem disabled>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Chargement...
                              </DropdownMenuItem>
                            ) : (
                              projectUsers.map((user) => (
                                <DropdownMenuItem 
                                  key={user.id} 
                                  onClick={() => handleAssignTask(task.id, user.id)}
                                  className={cn(
                                    task.assignee?.id === user.id && "bg-accent"
                                  )}
                                >
                                  <UserAvatar name={user.name} email={user.email} avatarUrl={user.avatarUrl} size="xs" className="mr-2" />
                                  {user.name || user.email}
                                  {task.assignee?.id === user.id && <Check className="h-3 w-3 ml-auto" />}
                                </DropdownMenuItem>
                              ))
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>

                        {/* More Actions */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <FileText className="h-4 w-4 mr-2" />
                              Détacher et convertir en story
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <FolderOpen className="h-4 w-4 mr-2" />
                              Changer de story parent
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              <Archive className="h-4 w-4 mr-2" />
                              Détacher et archiver
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                  {(!storyDetail?.tasks || storyDetail.tasks.length === 0) && (
                    <p className="text-sm text-muted-foreground italic py-2">
                      Aucune sous-tâche
                    </p>
                  )}
                </div>

                {/* Add Subtask Inline */}
                {isAddingSubtask ? (
                  <div className="flex items-center gap-2 p-2">
                    <span className="text-xs text-muted-foreground font-mono w-6">
                      {(totalTasks || 0) + 1}
                    </span>
                    <Circle className="h-4 w-4 text-slate-400 flex-shrink-0" />
                    <Input
                      autoFocus
                      placeholder="Nouvelle sous-tâche..."
                      value={newSubtaskTitle}
                      onChange={(e) => setNewSubtaskTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddSubtask();
                        if (e.key === "Escape") {
                          setIsAddingSubtask(false);
                          setNewSubtaskTitle("");
                        }
                      }}
                      className="flex-1 h-8 text-sm"
                    />
                    <Button size="sm" onClick={handleAddSubtask} disabled={!newSubtaskTitle.trim()}>
                      Ajouter
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        setIsAddingSubtask(false);
                        setNewSubtaskTitle("");
                      }}
                    >
                      Annuler
                    </Button>
                  </div>
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-xs"
                    onClick={() => setIsAddingSubtask(true)}
                  >
                    + Sous-tâche
                  </Button>
                )}
              </div>

              <Separator />

              {/* Add to Story */}
              <div className="space-y-2">
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Add to Story</h3>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className={cn(
                      "text-xs",
                      (storyDetail?.checklists ?? []).length > 0 && "border-primary text-primary"
                    )}
                    onClick={handleAddChecklist}
                    disabled={!storyDetail}
                  >
                    <ListChecks className="h-3 w-3 mr-1" />
                    Checklist
                  </Button>
                  <Button type="button" variant="outline" size="sm" className="text-xs" disabled>
                    <Link2 className="h-3 w-3 mr-1" />
                    External Links
                  </Button>
                  <Button type="button" variant="outline" size="sm" className="text-xs" disabled>
                    <Paperclip className="h-3 w-3 mr-1" />
                    Attach Files
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Comments */}
              <div ref={commentsRef} className="space-y-3">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Commentaires
                  <span className="text-muted-foreground">({comments.length})</span>
                </h3>
                
                {/* Existing Comments */}
                {isLoadingComments ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : comments.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic py-2">
                    Aucun commentaire
                  </p>
                ) : (
                  <div className="space-y-4">
                    {comments.map((comment) => (
                      <div key={comment.id} className="flex items-start gap-3">
                        <UserAvatar name={comment.author.name} email={comment.author.email} avatarUrl={comment.author.avatarUrl} size="md" />
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">
                              {comment.author.name || comment.author.email}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(comment.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {comment.content}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Add Comment */}
                <div className="flex items-start gap-3 pt-2">
                  <UserAvatar name={currentUserName} avatarUrl={currentUserAvatarUrl} size="md" />
                  <div className="flex-1">
                    <MentionTextarea
                      placeholder="Ajouter un commentaire... Utilisez @ pour mentionner"
                      value={newComment}
                      onChange={setNewComment}
                      users={projectUsers}
                    />
                    <div className="flex justify-end mt-2">
                      <Button 
                        size="sm" 
                        className="text-xs"
                        onClick={handleSubmitComment}
                        disabled={isSubmittingComment || !newComment.trim()}
                      >
                        {isSubmittingComment ? (
                          <>
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            Envoi...
                          </>
                        ) : (
                          "Commenter"
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Activity */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Activité
                </h3>
                <div className="flex items-start gap-3 text-sm">
                  <UserAvatar name={storyDetail?.author?.name} email={storyDetail?.author?.email} avatarUrl={storyDetail?.author?.avatarUrl} size="sm" />
                  <div>
                    <span className="font-medium">{storyDetail?.author?.name || storyDetail?.author?.email}</span>
                    {" "}a créé cette story dans{" "}
                    <Badge variant="secondary" className="text-xs">
                      {getStatusLabel(storyDetail?.status || "BACKLOG")}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {storyDetail?.createdAt && formatDate(storyDetail.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="w-72 border-l bg-muted/20 p-4 space-y-4 overflow-y-auto">
              {/* Story ID */}
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Story ID</label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-muted px-2 py-1 rounded text-sm font-mono truncate">
                    {displayStory.type}-{displayStory.storyNumber}
                  </code>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7 relative"
                    title={copied ? "Copié!" : "Copier"}
                    onClick={() => {
                      navigator.clipboard.writeText(`${displayStory.type}-${displayStory.storyNumber}`);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                  >
                    {copied ? <CopyCheck className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <MoreHorizontal className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => {
                        // Duplicate story logic
                        if (storyDetail) {
                          fetch(`/api/projects/${projectId}/stories`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              title: `${storyDetail.title} (copie)`,
                              description: storyDetail.description,
                              type: storyDetail.type,
                              status: "BACKLOG",
                              priority: storyDetail.priority,
                            }),
                          }).then(() => onOpenChange(false));
                        }
                      }}>
                        <Copy className="h-4 w-4 mr-2" />
                        Dupliquer la story
                      </DropdownMenuItem>
                      {storyDetail?.status === "ARCHIVED" ? (
                        <DropdownMenuItem 
                          onClick={() => setShowRestoreConfirm(true)}
                        >
                          <ArchiveRestore className="h-4 w-4 mr-2" />
                          Restaurer la story
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => setShowArchiveConfirm(true)}
                        >
                          <Archive className="h-4 w-4 mr-2" />
                          Archiver la story
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Permalink */}
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Permalink</label>
                <div className="flex items-center gap-2">
                  <Link2 className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground truncate flex-1">
                    projet360.ca/story/{displayStory.type}-{displayStory.storyNumber}
                  </span>
                </div>
              </div>

              <Separator />

              {/* Metadata Fields */}
              <div className="space-y-3">
                {/* State */}
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground flex items-center gap-1">
                    <GitBranch className="h-3 w-3" />
                    Statut
                  </label>
                  <Badge variant="outline" className="font-normal">
                    {getStatusLabel(storyDetail?.status || "BACKLOG")}
                  </Badge>
                </div>

                {/* Type */}
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    Type
                  </label>
                  <div className="text-sm">{displayStory.type === "FEATURE" ? "Feature" : "Fix"}</div>
                </div>

                {/* Priority */}
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Flag className="h-3 w-3" />
                    Priorité
                  </label>
                  <div className="text-sm">{getPriorityLabel(storyDetail?.priority || 2)}</div>
                </div>

                {/* Assignee */}
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground flex items-center gap-1">
                    <User className="h-3 w-3" />
                    Assigné à
                  </label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="w-full justify-start h-auto py-1.5 px-2 -ml-2 font-normal">
                        {storyDetail?.assignee ? (
                          <div className="flex items-center gap-2">
                            <UserAvatar name={storyDetail.assignee.name} email={storyDetail.assignee.email} avatarUrl={storyDetail.assignee.avatarUrl} size="xs" />
                            <span className="text-sm">{storyDetail.assignee.name || storyDetail.assignee.email}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground italic">Non assigné</span>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56">
                      <DropdownMenuItem onClick={() => handleAssignStory(null)}>
                        <span className="text-muted-foreground">Non assigné</span>
                        {!storyDetail?.assignee && <Check className="h-3 w-3 ml-auto" />}
                      </DropdownMenuItem>
                      {projectUsers.map((u) => (
                        <DropdownMenuItem key={u.id} onClick={() => handleAssignStory(u.id)}>
                          <div className="flex items-center gap-2 flex-1">
                            <UserAvatar name={u.name} email={u.email} avatarUrl={u.avatarUrl} size="xs" />
                            <div className="flex flex-col min-w-0">
                              <span className="text-sm truncate">{u.name || u.email}</span>
                              {u.name && <span className="text-xs text-muted-foreground truncate">{u.email}</span>}
                            </div>
                          </div>
                          {storyDetail?.assignee?.email === u.email && <Check className="h-3 w-3 ml-auto flex-shrink-0" />}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Labels */}
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    Labels
                  </label>
                  <LabelSelector
                    projectId={projectId}
                    selectedLabels={storyDetail?.labels ?? []}
                    projectLabels={projectLabels}
                    onToggle={handleToggleLabel}
                    onCreateAndToggle={handleCreateAndToggleLabel}
                    onDelete={handleDeleteLabel}
                  />
                </div>

                {/* Due date */}
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Date d'échéance
                  </label>
                  <DatePicker
                    value={storyDetail?.dueDate ? new Date(storyDetail.dueDate) : null}
                    onChange={handleDueDateChange}
                    placeholder="Pas de date"
                  />
                </div>

                {/* Requester */}
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground flex items-center gap-1">
                    <User className="h-3 w-3" />
                    Demandeur
                  </label>
                  <div className="text-sm">
                    {storyDetail?.author ? (
                      <div className="flex items-center gap-2">
                        <UserAvatar name={storyDetail.author.name} email={storyDetail.author.email} avatarUrl={storyDetail.author.avatarUrl} size="xs" />
                        <span>{storyDetail.author.name || storyDetail.author.email}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </div>
                </div>

                {/* Created */}
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Créée le
                  </label>
                  <div className="text-sm">
                    {storyDetail?.createdAt ? formatDate(storyDetail.createdAt) : "-"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Archive Confirmation Dialog */}
        <Dialog open={showArchiveConfirm} onOpenChange={setShowArchiveConfirm}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Archiver cette story ?</DialogTitle>
              <DialogDescription>
                La story <strong>{displayStory?.type}-{displayStory?.storyNumber}</strong> sera archivée. Vous pourrez la restaurer depuis l'onglet "Archivées".
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setShowArchiveConfirm(false)}
                disabled={isArchiving}
              >
                Annuler
              </Button>
              <Button
                variant="destructive"
                onClick={async () => {
                  if (!story?.id) return;
                  setIsArchiving(true);
                  try {
                    const response = await fetch(`/api/projects/${projectId}/stories/${story.id}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ status: "ARCHIVED" }),
                    });
                    if (response.ok) {
                      setShowArchiveConfirm(false);
                      onOpenChange(false);
                      mutateStory();
                    }
                  } catch {
                    // silently fail — user can retry
                  } finally {
                    setIsArchiving(false);
                  }
                }}
                disabled={isArchiving}
              >
                {isArchiving ? "Archivage..." : "Archiver"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Restore Confirmation Dialog */}
        <Dialog open={showRestoreConfirm} onOpenChange={setShowRestoreConfirm}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Restaurer cette story ?</DialogTitle>
              <DialogDescription>
                La story <strong>{displayStory?.type}-{displayStory?.storyNumber}</strong> sera restaurée dans le backlog.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setShowRestoreConfirm(false)}
                disabled={isRestoring}
              >
                Annuler
              </Button>
              <Button
                onClick={async () => {
                  if (!story?.id) return;
                  setIsRestoring(true);
                  try {
                    const response = await fetch(`/api/projects/${projectId}/stories/${story.id}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ status: "BACKLOG" }),
                    });
                    if (response.ok) {
                      setShowRestoreConfirm(false);
                      onOpenChange(false);
                      mutateStory();
                    }
                  } catch {
                    // silently fail — user can retry
                  } finally {
                    setIsRestoring(false);
                  }
                }}
                disabled={isRestoring}
              >
                {isRestoring ? "Restauration..." : "Restaurer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}
