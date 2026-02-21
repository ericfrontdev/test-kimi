"use client";

import { useState, useEffect } from "react";
import { MessageSquare, CheckSquare, Calendar, User, Clock, Loader2, Edit3 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MentionTextarea, extractMentions } from "@/components/ui/mention-textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn, getInitials } from "@/lib/utils";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import type { Task, ProjectUser, TaskStatus } from "./types";
import { TaskStatusDropdown } from "./TaskStatusDropdown";
import { taskStatuses } from "./types";

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    name: string | null;
    email: string;
  };
}

interface SubtaskDetailDialogProps {
  task: Task | null;
  storyId: string;
  storyType: string;
  storyNumber: number;
  projectId: string;
  projectUsers: ProjectUser[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAssigneeChange?: (storyId: string, taskId: string, assigneeId: string | null, assignee?: { name: string | null; email: string } | null) => void;
  onStatusChange?: (storyId: string, taskId: string, status: TaskStatus) => void;
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function SubtaskDetailDialog({
  task,
  storyId,
  storyType,
  storyNumber,
  projectId,
  projectUsers,
  open,
  onOpenChange,
  onAssigneeChange,
  onStatusChange,
}: SubtaskDetailDialogProps) {
  const [description, setDescription] = useState("");
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [isSavingDescription, setIsSavingDescription] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [taskDetail, setTaskDetail] = useState<Task | null>(null);

  useEffect(() => {
    if (open && task) {
      setTaskDetail(task);
      // Use preloaded comments if available, otherwise fetch them
      if (task.comments) {
        setComments(task.comments);
      } else {
        fetchComments();
      }
    }
    if (!open) {
      setIsEditingDescription(false);
      setNewComment("");
    }
  }, [open, task]);

  async function fetchComments() {
    if (!task) return;
    setIsLoadingComments(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/stories/${storyId}/tasks/${task.id}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data);
      }
    } catch {
      // silently fail
    } finally {
      setIsLoadingComments(false);
    }
  }

  async function handleSubmitComment() {
    if (!newComment.trim() || !task) return;
    setIsSubmittingComment(true);
    try {
      // Extract mentions from comment
      const mentions = extractMentions(newComment.trim(), projectUsers);
      
      const response = await fetch(`/api/projects/${projectId}/stories/${storyId}/tasks/${task.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          content: newComment.trim(),
          mentions,
        }),
      });
      if (response.ok) {
        const comment = await response.json();
        setComments((prev) => [...prev, comment]);
        setNewComment("");
      }
    } catch {
      // silently fail
    } finally {
      setIsSubmittingComment(false);
    }
  }

  async function handleSaveDescription() {
    if (!task) return;
    setIsSavingDescription(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/stories/${storyId}/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });
      if (response.ok) {
        setTaskDetail({ ...task, description });
        setIsEditingDescription(false);
      }
    } catch {
      // silently fail
    } finally {
      setIsSavingDescription(false);
    }
  }

  function handleStartEditingDescription() {
    setDescription(taskDetail?.description || "");
    setIsEditingDescription(true);
  }

  function handleStatusChange(newStatus: TaskStatus) {
    if (!task) return;
    onStatusChange?.(storyId, task.id, newStatus);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    e.stopPropagation();
  }

  const displayTask = taskDetail || task;
  if (!displayTask) return null;

  const subtaskId = `${storyType}-${storyNumber}-${displayTask.taskNumber}`;
  const currentStatusConfig = taskStatuses.find((s) => s.id === displayTask.status);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="!w-[60vw] !max-w-[1200px] p-0 gap-0 overflow-hidden"
        onKeyDown={handleKeyDown}
      >
        <DialogTitle className="sr-only">{displayTask.title}</DialogTitle>
        
        <DialogHeader className="px-6 py-4 border-b flex flex-row items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-mono">{storyType}-{storyNumber}</span>
            <span>/</span>
            <Badge variant="secondary" className="text-xs">Sub-task {displayTask.taskNumber}</Badge>
          </div>

        </DialogHeader>

        <div className="flex flex-1 overflow-hidden" style={{ maxHeight: 'calc(90vh - 65px)' }}>
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <h1 className={cn("text-2xl font-semibold", displayTask.status === "DONE" && "line-through text-muted-foreground")}>
              {displayTask.title}
            </h1>

            <div className="space-y-3">
              {isEditingDescription ? (
                <div className="space-y-3">
                  <RichTextEditor
                    value={description}
                    onChange={setDescription}
                    placeholder="Decrivez la sous-tache..."
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
                  {displayTask.description ? (
                    <div 
                      className="text-sm text-muted-foreground prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: displayTask.description }}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground italic">Aucune description</p>
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

            <Separator />

            <div className="space-y-3">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Commentaires
                <span className="text-muted-foreground">({comments.length})</span>
              </h3>
              
              {isLoadingComments ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : comments.length === 0 ? (
                <p className="text-sm text-muted-foreground italic py-2">Aucun commentaire</p>
              ) : (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-xs font-medium text-primary-foreground flex-shrink-0">
                        {getInitials(comment.author.name || comment.author.email)}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{comment.author.name || comment.author.email}</span>
                          <span className="text-xs text-muted-foreground">{formatDate(comment.createdAt)}</span>
                        </div>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="flex items-start gap-3 pt-2">
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-xs font-medium text-primary-foreground flex-shrink-0">
                  EO
                </div>
                <div className="flex-1">
                  <MentionTextarea
                    placeholder="Ajouter un commentaire... Utilisez @ pour mentionner"
                    value={newComment}
                    onChange={setNewComment}
                    users={projectUsers}
                    className="min-h-[80px] resize-none"
                  />
                  <div className="flex justify-end mt-2">
                    <Button 
                      size="sm" 
                      className="text-xs"
                      onClick={handleSubmitComment}
                      disabled={isSubmittingComment || !newComment.trim()}
                    >
                      {isSubmittingComment ? (
                        <><Loader2 className="h-3 w-3 mr-1 animate-spin" />Envoi...</>
                      ) : (
                        "Commenter"
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Activite
              </h3>
              <div className="flex items-start gap-3 text-sm">
                <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-xs font-medium text-primary-foreground">
                  EO
                </div>
                <div>
                  <span className="font-medium">Vous</span> avez cree cette sous-tache
                  <Badge variant="secondary" className="text-xs ml-2">{currentStatusConfig?.title}</Badge>
                  <p className="text-xs text-muted-foreground mt-1">A l'instant</p>
                </div>
              </div>
            </div>
          </div>

          <div className="w-72 border-l bg-muted/20 p-4 space-y-4 overflow-y-auto">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">ID</label>
              <code className="block bg-muted px-2 py-1 rounded text-sm font-mono">{subtaskId}</code>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-muted-foreground flex items-center gap-1">
                <CheckSquare className="h-3 w-3" />
                Statut
              </label>
              <TaskStatusDropdown
                currentStatus={displayTask.status}
                onStatusChange={handleStatusChange}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-muted-foreground flex items-center gap-1">
                <User className="h-3 w-3" />
                Assigne a
              </label>
              <div className="text-sm">
                {displayTask.assignee ? (
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center text-xs font-medium text-primary-foreground">
                      {getInitials(displayTask.assignee.name || displayTask.assignee.email)}
                    </div>
                    <span>{displayTask.assignee.name || displayTask.assignee.email}</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground italic">Non assigne</span>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Date d'echeance
              </label>
              <span className="text-sm text-muted-foreground">Aucune</span>
            </div>

            <Separator />

            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Creee le</label>
              <span className="text-sm">A l'instant</span>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Modifiee le</label>
              <span className="text-sm">A l'instant</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
