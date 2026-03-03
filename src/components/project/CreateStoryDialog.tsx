"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, CheckSquare, Link2, Paperclip, ListChecks, Clock, User, Flag, Calendar, Tag, X, Circle, Check, MoreHorizontal, Trash2, ExternalLink, FileText, FileImage, File as FileIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label as FormLabel } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { cn, getInitials } from "@/lib/utils";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { Loader2 } from "lucide-react";
import type { ProjectUser, Label } from "@/components/project/kanban/types";
import { DatePicker } from "@/components/ui/date-picker";
import { LabelSelector } from "@/components/project/LabelSelector";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useProjectStore } from "@/stores/project";
import { Dropzone, formatFileSize } from "@/components/ui/dropzone";

interface CreateStoryDialogProps {
  projectId: string;
  variant?: "button" | "icon";
  onSuccess?: () => void;
  // Edit mode — when provided the dialog is controlled externally
  storyId?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const statusOptions = [
  { id: "BACKLOG", label: "Backlog", color: "bg-slate-400" },
  { id: "TODO", label: "À faire", color: "bg-slate-400" },
  { id: "IN_PROGRESS", label: "En cours", color: "bg-blue-500" },
  { id: "IN_REVIEW", label: "En révision", color: "bg-amber-500" },
  { id: "DONE", label: "Terminé", color: "bg-emerald-500" },
];

const typeOptions = [
  { id: "FEATURE", label: "Feature", color: "bg-purple-500" },
  { id: "FIX", label: "Fix", color: "bg-red-500" },
];

const priorityOptions = [
  { id: 0, label: "P0 - Critique", color: "bg-red-500" },
  { id: 1, label: "P1 - Haute", color: "bg-orange-500" },
  { id: 2, label: "P2 - Normale", color: "bg-blue-500" },
  { id: 3, label: "P3 - Basse", color: "bg-gray-400" },
];

export function CreateStoryDialog({
  projectId,
  variant = "button",
  onSuccess,
  storyId,
  open: openProp,
  onOpenChange: onOpenChangeProp,
}: CreateStoryDialogProps) {
  const router = useRouter();
  const isEditMode = !!storyId;

  const [openInternal, setOpenInternal] = useState(false);
  const dialogOpen = isEditMode ? (openProp ?? false) : openInternal;
  const setDialogOpen = isEditMode ? (onOpenChangeProp ?? (() => {})) : setOpenInternal;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("BACKLOG");
  const [type, setType] = useState<"FEATURE" | "FIX">("FEATURE");
  const [priority, setPriority] = useState(2);
  const [assigneeId, setAssigneeId] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [selectedLabels, setSelectedLabels] = useState<Label[]>([]);
  const [originalLabels, setOriginalLabels] = useState<Label[]>([]);
  const [showChecklist, setShowChecklist] = useState(false);
  const [localChecklistItems, setLocalChecklistItems] = useState<{ id: string; title: string; status: "TODO" | "IN_PROGRESS" | "DONE" }[]>([]);
  const [isAddingLocalItem, setIsAddingLocalItem] = useState(false);
  const [newLocalItemTitle, setNewLocalItemTitle] = useState("");
  // Subtasks — local list for create mode, SWR cache for edit mode (single source of truth)
  const [localSubtasks, setLocalSubtasks] = useState<{ id: string; title: string }[]>([]);
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  // Links — local list for create mode, live API for edit mode
  const [showLinks, setShowLinks] = useState(false);
  const [localLinks, setLocalLinks] = useState<{ id: string; title: string; url: string }[]>([]);
  const [editLinks, setEditLinks] = useState<{ id: string; title: string; url: string }[]>([]);
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [newLinkTitle, setNewLinkTitle] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");
  // Attachments — local File objects for create mode, DB records for edit mode
  const [showAttachments, setShowAttachments] = useState(false);
  const [localFiles, setLocalFiles] = useState<{ id: string; file: File }[]>([]);
  const [editAttachments, setEditAttachments] = useState<{ id: string; filename: string; url: string; size: number; mimeType: string }[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createAnother, setCreateAnother] = useState(false);

  // Fetch story data when in edit mode
  const { data: editStoryData, isLoading: isLoadingStory, mutate: mutateEditStory } = useSWR<{
    id: string; title: string; description?: string | null; status: string;
    type: "FEATURE" | "FIX"; priority: number; assigneeId?: string | null;
    dueDate?: string | null; labels?: Label[];
    tasks?: { id: string; taskNumber: number; title: string; status: string; assignee?: { id: string; name: string | null; email: string; avatarUrl?: string | null } | null }[];
    links?: { id: string; title: string; url: string }[];
    attachments?: { id: string; filename: string; url: string; size: number; mimeType: string }[];
  }>(
    isEditMode && dialogOpen ? `/api/projects/${projectId}/stories/${storyId}` : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  // Populate form fields when story data loads
  useEffect(() => {
    if (editStoryData && isEditMode) {
      setTitle(editStoryData.title);
      setDescription(editStoryData.description ?? "");
      setStatus(editStoryData.status);
      setType(editStoryData.type);
      setPriority(editStoryData.priority);
      setAssigneeId(editStoryData.assigneeId ?? null);
      setDueDate(editStoryData.dueDate ? new Date(editStoryData.dueDate) : null);
      setSelectedLabels(editStoryData.labels ?? []);
      setOriginalLabels(editStoryData.labels ?? []);
      setEditLinks(editStoryData.links ?? []);
      if ((editStoryData.links ?? []).length > 0) setShowLinks(true);
      setEditAttachments(editStoryData.attachments ?? []);
      if ((editStoryData.attachments ?? []).length > 0) setShowAttachments(true);
    }
  }, [editStoryData, isEditMode]);

  const isAdmin = useProjectStore((s) => s.userRole) !== "MEMBER";

  const { data: projectUsers = [] } = useSWR<ProjectUser[]>(
    dialogOpen ? `/api/projects/${projectId}/members` : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  const { data: projectLabels = [], mutate: mutateLabels } = useSWR<Label[]>(
    dialogOpen ? `/api/projects/${projectId}/labels` : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  // Derived from SWR cache — single source of truth shared with StoryDetailDialog
  const editTasks = editStoryData?.tasks ?? [];

  function resetForm() {
    setTitle("");
    setDescription("");
    setStatus("BACKLOG");
    setType("FEATURE");
    setPriority(2);
    setAssigneeId(null);
    setDueDate(null);
    setSelectedLabels([]);
    setOriginalLabels([]);
    setShowChecklist(false);
    setLocalChecklistItems([]);
    setLocalSubtasks([]);
    setIsAddingSubtask(false);
    setNewSubtaskTitle("");
    setShowLinks(false);
    setLocalLinks([]);
    setEditLinks([]);
    setIsAddingLink(false);
    setNewLinkTitle("");
    setNewLinkUrl("");
    setShowAttachments(false);
    setLocalFiles([]);
    setEditAttachments([]);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Le titre est requis");
      return;
    }

    setIsLoading(true);
    try {
      if (isEditMode && storyId) {
        // ── Edit mode: PATCH story fields ──
        const res = await fetch(`/api/projects/${projectId}/stories/${storyId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            description: description.trim() || null,
            status,
            priority,
            assignee: assigneeId,
            dueDate: dueDate?.toISOString() ?? null,
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Échec de la mise à jour");
        }

        // Sync labels: toggle any label that changed
        const labelsToSync = [
          ...selectedLabels.filter((l) => !originalLabels.find((ol) => ol.id === l.id)),
          ...originalLabels.filter((ol) => !selectedLabels.find((l) => l.id === ol.id)),
        ];
        await Promise.all(
          labelsToSync.map((label) =>
            fetch(`/api/projects/${projectId}/stories/${storyId}/labels`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ labelId: label.id }),
            })
          )
        );

        setDialogOpen(false);
        resetForm();
      } else {
        // ── Create mode: POST ──
        const response = await fetch(`/api/projects/${projectId}/stories`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            description: description.trim() || undefined,
            status,
            type,
            priority,
            assigneeId: assigneeId ?? undefined,
            dueDate: dueDate?.toISOString() ?? undefined,
            labelIds: selectedLabels.map((l) => l.id),
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Échec de la création");
        }

        const storyData = await response.json();

        // Create subtasks sequentially (sequential to avoid taskNumber race condition)
        for (const subtask of localSubtasks) {
          await fetch(`/api/projects/${projectId}/stories/${storyData.id}/tasks`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: subtask.title }),
          });
        }

        // Create links
        await Promise.all(
          localLinks.map((link) =>
            fetch(`/api/projects/${projectId}/stories/${storyData.id}/links`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ title: link.title, url: link.url }),
            })
          )
        );

        // Upload local attachments
        for (const { file } of localFiles) {
          const fd = new FormData();
          fd.append("file", file);
          await fetch(`/api/projects/${projectId}/stories/${storyData.id}/attachments`, {
            method: "POST",
            body: fd,
          });
        }

        // Create checklist with local items if any
        if (localChecklistItems.length > 0) {
          const clRes = await fetch(`/api/projects/${projectId}/stories/${storyData.id}/checklists`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
          });
          if (clRes.ok) {
            const checklist = await clRes.json();
            await Promise.all(
              localChecklistItems.map((item) =>
                fetch(`/api/projects/${projectId}/stories/${storyData.id}/checklists/${checklist.id}/items`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ title: item.title, status: item.status }),
                })
              )
            );
          }
        }

        if (createAnother) {
          resetForm();
        } else {
          resetForm();
          setDialogOpen(false);
        }
      }

      router.refresh();
      onSuccess?.();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }

  function handleDiscard() {
    resetForm();
    setDialogOpen(false);
  }

  function handleToggleLabel(label: Label) {
    setSelectedLabels((prev) =>
      prev.some((l) => l.id === label.id)
        ? prev.filter((l) => l.id !== label.id)
        : [...prev, label]
    );
  }

  async function handleCreateAndToggleLabel(name: string, color: string) {
    const res = await fetch(`/api/projects/${projectId}/labels`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, color }),
    });
    if (res.ok) {
      const newLabel: Label = await res.json();
      mutateLabels((prev) => [...(prev ?? []), newLabel], false);
      setSelectedLabels((prev) => [...prev, newLabel]);
    }
  }

  async function handleDeleteLabel(labelId: string) {
    mutateLabels((prev) => prev?.filter((l) => l.id !== labelId), false);
    setSelectedLabels((prev) => prev.filter((l) => l.id !== labelId));
    await fetch(`/api/projects/${projectId}/labels/${labelId}`, { method: "DELETE" });
  }

  async function handleToggleSubtaskStatus(taskId: string, currentStatus: string) {
    if (!isEditMode || !storyId) return;
    const newStatus = currentStatus === "DONE" ? "TODO" : "DONE";
    mutateEditStory(
      (current) => current ? { ...current, tasks: (current.tasks ?? []).map((t) => t.id === taskId ? { ...t, status: newStatus } : t) } : current,
      false
    );
    await fetch(`/api/projects/${projectId}/stories/${storyId}/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
  }

  async function handleAssignSubtask(taskId: string, userId: string | null) {
    if (!isEditMode || !storyId) return;
    const user = userId ? projectUsers.find((u) => u.id === userId) ?? null : null;
    const assignee = user ? { id: user.id, name: user.name ?? null, email: user.email, avatarUrl: user.avatarUrl } : null;
    mutateEditStory(
      (current) => current ? { ...current, tasks: (current.tasks ?? []).map((t) => t.id === taskId ? { ...t, assignee } : t) } : current,
      false
    );
    await fetch(`/api/projects/${projectId}/stories/${storyId}/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assigneeId: userId }),
    });
  }

  async function handleAddSubtask() {
    const trimmed = newSubtaskTitle.trim();
    if (!trimmed) return;

    if (isEditMode && storyId) {
      // Edit mode: POST immediately
      const res = await fetch(`/api/projects/${projectId}/stories/${storyId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: trimmed }),
      });
      if (res.ok) {
        const task = await res.json();
        mutateEditStory(
          (current) => current ? { ...current, tasks: [...(current.tasks ?? []), task] } : current,
          false
        );
      }
    } else {
      // Create mode: add locally
      setLocalSubtasks((prev) => [...prev, { id: crypto.randomUUID(), title: trimmed }]);
    }
    setNewSubtaskTitle("");
    setIsAddingSubtask(false);
  }

  async function handleDeleteSubtask(id: string) {
    if (isEditMode && storyId) {
      mutateEditStory(
        (current) => current ? { ...current, tasks: (current.tasks ?? []).filter((t) => t.id !== id) } : current,
        false
      );
      await fetch(`/api/projects/${projectId}/stories/${storyId}/tasks/${id}`, { method: "DELETE" });
    } else {
      setLocalSubtasks((prev) => prev.filter((s) => s.id !== id));
    }
  }

  async function handleAddLink() {
    const trimmedTitle = newLinkTitle.trim();
    const trimmedUrl = newLinkUrl.trim();
    if (!trimmedTitle || !trimmedUrl) return;

    if (isEditMode && storyId) {
      // Edit mode: POST immediately
      const res = await fetch(`/api/projects/${projectId}/stories/${storyId}/links`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: trimmedTitle, url: trimmedUrl }),
      });
      if (res.ok) {
        const link = await res.json();
        setEditLinks((prev) => [...prev, link]);
      }
    } else {
      // Create mode: add locally
      setLocalLinks((prev) => [...prev, { id: crypto.randomUUID(), title: trimmedTitle, url: trimmedUrl }]);
    }
    setNewLinkTitle("");
    setNewLinkUrl("");
    setIsAddingLink(false);
  }

  async function handleDeleteLink(id: string) {
    if (isEditMode && storyId) {
      setEditLinks((prev) => prev.filter((l) => l.id !== id));
      await fetch(`/api/projects/${projectId}/stories/${storyId}/links/${id}`, { method: "DELETE" });
    } else {
      setLocalLinks((prev) => prev.filter((l) => l.id !== id));
    }
  }

  async function handleFilesAdded(files: File[]) {
    if (isEditMode && storyId) {
      // Edit mode: upload immediately
      setIsUploading(true);
      for (const file of files) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch(`/api/projects/${projectId}/stories/${storyId}/attachments`, {
          method: "POST",
          body: fd,
        });
        if (res.ok) {
          const att = await res.json();
          setEditAttachments((prev) => [...prev, att]);
        }
      }
      setIsUploading(false);
    } else {
      // Create mode: store locally
      setLocalFiles((prev) => [...prev, ...files.map((file) => ({ id: crypto.randomUUID(), file }))]);
    }
  }

  function handleDeleteLocalFile(id: string) {
    setLocalFiles((prev) => {
      const next = prev.filter((f) => f.id !== id);
      if (next.length === 0) setShowAttachments(false);
      return next;
    });
  }

  async function handleDeleteAttachment(id: string) {
    if (!isEditMode || !storyId) return;
    setEditAttachments((prev) => {
      const next = prev.filter((a) => a.id !== id);
      if (next.length === 0) setShowAttachments(false);
      return next;
    });
    await fetch(`/api/projects/${projectId}/stories/${storyId}/attachments/${id}`, { method: "DELETE" });
  }

  function getFileIcon(mimeType: string) {
    if (mimeType.startsWith("image/")) return <FileImage className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />;
    if (mimeType === "application/pdf") return <FileText className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />;
    return <FileIcon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />;
  }

  const currentStatus = statusOptions.find((s) => s.id === status);
  const currentType = typeOptions.find((t) => t.id === type);
  const currentPriority = priorityOptions.find((p) => p.id === priority);
  const currentAssignee = projectUsers.find((u) => u.id === assigneeId);

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      {!isEditMode && (
        <DialogTrigger asChild>
          {variant === "button" ? (
            <Button className="gap-2">
              <Plus size={16} />
              Créer une Story
            </Button>
          ) : (
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Plus size={16} />
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="!max-w-none w-[60vw] h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="text-lg font-semibold">
            {isEditMode ? "Modifier la Story" : "Créer une Story"}
          </DialogTitle>
        </DialogHeader>

        {isEditMode && isLoadingStory ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className={cn("flex flex-col flex-1 overflow-hidden", isEditMode && isLoadingStory && "hidden")}>
          <div className="flex flex-1 overflow-hidden">
            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <FormLabel htmlFor="title" className="text-sm text-muted-foreground">
                  Titre de la Story
                </FormLabel>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Entrez le titre de la story..."
                  className="text-lg font-medium border-0 border-b rounded-none px-0 shadow-none focus-visible:ring-0 focus-visible:border-primary"
                  autoFocus
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <FormLabel className="text-sm text-muted-foreground">
                  Description <span className="text-muted-foreground/60">Optionnel</span>
                </FormLabel>
                <RichTextEditor
                  value={description}
                  onChange={setDescription}
                  placeholder="Décrivez la story..."
                  variant="borderless"
                />
              </div>

              {/* Checklist Section */}
              {showChecklist && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    <ListChecks className="h-4 w-4" />
                    Checklist
                    <span className="text-xs text-muted-foreground font-normal">
                      {localChecklistItems.length} item{localChecklistItems.length !== 1 ? "s" : ""}
                    </span>
                  </h3>
                  <div className="space-y-1">
                    {localChecklistItems.map((item) => (
                      <div key={item.id} className="flex items-center gap-2 py-1 px-1 rounded hover:bg-muted/40">
                        <Checkbox
                          checked={item.status === "DONE" ? true : item.status === "IN_PROGRESS" ? "indeterminate" : false}
                          onCheckedChange={() =>
                            setLocalChecklistItems((prev) =>
                              prev.map((i) => i.id === item.id ? {
                                ...i,
                                status: i.status === "TODO" ? "IN_PROGRESS" : i.status === "IN_PROGRESS" ? "DONE" : "TODO"
                              } as typeof i : i)
                            )
                          }
                        />
                        <span className={cn("flex-1 text-sm", item.status === "DONE" && "line-through text-muted-foreground")}>{item.title}</span>
                        <button
                          type="button"
                          onClick={() => setLocalChecklistItems((prev) => prev.filter((i) => i.id !== item.id))}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  {isAddingLocalItem ? (
                    <div className="space-y-2 pl-1">
                      <Input
                        autoFocus
                        placeholder="Nouvel item..."
                        value={newLocalItemTitle}
                        onChange={(e) => setNewLocalItemTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && newLocalItemTitle.trim()) {
                            setLocalChecklistItems((prev) => [...prev, { id: crypto.randomUUID(), title: newLocalItemTitle.trim(), status: "TODO" as const }]);
                            setNewLocalItemTitle("");
                          }
                          if (e.key === "Escape") { setIsAddingLocalItem(false); setNewLocalItemTitle(""); }
                        }}
                        className="h-8 text-sm"
                      />
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          className="h-7 text-xs"
                          disabled={!newLocalItemTitle.trim()}
                          onClick={() => {
                            if (!newLocalItemTitle.trim()) return;
                            setLocalChecklistItems((prev) => [...prev, { id: crypto.randomUUID(), title: newLocalItemTitle.trim(), status: "TODO" as const }]);
                            setNewLocalItemTitle("");
                          }}
                        >
                          Créer
                        </Button>
                        <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={() => { setIsAddingLocalItem(false); setNewLocalItemTitle(""); }}>
                          Annuler
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button type="button" variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground" onClick={() => setIsAddingLocalItem(true)}>
                      + Ajouter un item
                    </Button>
                  )}
                </div>
              )}

              {/* Sous-tâches Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    <CheckSquare className="h-4 w-4" />
                    Sous-tâches
                    {isEditMode ? (
                      <span className="text-muted-foreground">
                        {editTasks.filter((t) => t.status === "DONE").length}/{editTasks.length}
                      </span>
                    ) : localSubtasks.length > 0 && (
                      <span className="text-muted-foreground">{localSubtasks.length}</span>
                    )}
                  </h3>
                </div>

                <div className="space-y-1">
                  {/* Edit mode rows */}
                  {isEditMode && editTasks.map((task, index) => (
                    <div key={task.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 group">
                      <span className="text-xs text-muted-foreground font-mono w-6">{index + 1}</span>
                      <button
                        type="button"
                        className="flex-shrink-0 cursor-pointer"
                        onClick={() => handleToggleSubtaskStatus(task.id, task.status)}
                      >
                        {task.status === "DONE"
                          ? <Check className="h-4 w-4 text-emerald-500" />
                          : task.status === "IN_PROGRESS"
                          ? <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                          : <Circle className="h-4 w-4 text-slate-400" />}
                      </button>
                      <span className={cn("flex-1 text-sm", task.status === "DONE" && "line-through text-muted-foreground")}>
                        {task.title}
                      </span>
                      <div className="flex items-center gap-1">
                        {/* Assignee */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              title={task.assignee ? `Assigné à ${task.assignee.name || task.assignee.email}` : "Assigner"}
                            >
                              {task.assignee
                                ? <UserAvatar name={task.assignee.name} email={task.assignee.email} avatarUrl={task.assignee.avatarUrl} size="xs" />
                                : <User className="h-3.5 w-3.5" />}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuItem onClick={() => handleAssignSubtask(task.id, null)}>
                              <Circle className="h-4 w-4 mr-2 text-slate-400" />
                              Non assigné
                            </DropdownMenuItem>
                            <Separator className="my-1" />
                            {projectUsers.map((u) => (
                              <DropdownMenuItem
                                key={u.id}
                                onClick={() => handleAssignSubtask(task.id, u.id)}
                                className={cn(task.assignee?.id === u.id && "bg-accent")}
                              >
                                <UserAvatar name={u.name} email={u.email} avatarUrl={u.avatarUrl} size="xs" className="mr-2" />
                                {u.name || u.email}
                                {task.assignee?.id === u.id && <Check className="h-3 w-3 ml-auto" />}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                        {/* Delete */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button type="button" variant="ghost" size="icon" className="h-7 w-7">
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteSubtask(task.id)}>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}

                  {/* Create mode rows */}
                  {!isEditMode && localSubtasks.map((task, index) => (
                    <div key={task.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 group">
                      <span className="text-xs text-muted-foreground font-mono w-6">{index + 1}</span>
                      <Circle className="h-4 w-4 text-slate-400 flex-shrink-0" />
                      <span className="flex-1 text-sm">{task.title}</span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button type="button" variant="ghost" size="icon" className="h-7 w-7">
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteSubtask(task.id)}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}

                  {/* Empty state */}
                  {(isEditMode ? editTasks : localSubtasks).length === 0 && !isAddingSubtask && (
                    <p className="text-sm text-muted-foreground italic py-2">Aucune sous-tâche</p>
                  )}
                </div>

                {/* Inline add form — same layout as StoryDetailDialog */}
                {isAddingSubtask ? (
                  <div className="flex items-center gap-2 p-2">
                    <span className="text-xs text-muted-foreground font-mono w-6">
                      {(isEditMode ? editTasks : localSubtasks).length + 1}
                    </span>
                    <Circle className="h-4 w-4 text-slate-400 flex-shrink-0" />
                    <Input
                      autoFocus
                      placeholder="Nouvelle sous-tâche..."
                      value={newSubtaskTitle}
                      onChange={(e) => setNewSubtaskTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") { e.preventDefault(); handleAddSubtask(); }
                        if (e.key === "Escape") { setIsAddingSubtask(false); setNewSubtaskTitle(""); }
                      }}
                      className="flex-1 h-8 text-sm"
                    />
                    <Button type="button" size="sm" onClick={handleAddSubtask} disabled={!newSubtaskTitle.trim()}>
                      Ajouter
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => { setIsAddingSubtask(false); setNewSubtaskTitle(""); }}>
                      Annuler
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => setIsAddingSubtask(true)}
                  >
                    + Sous-tâche
                  </Button>
                )}
              </div>

              {/* Ajouter à la Story */}
              <div className="space-y-3">
                <FormLabel className="text-sm text-muted-foreground">Add to Story</FormLabel>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className={cn("text-xs", showChecklist && "border-primary text-primary")}
                    onClick={() => setShowChecklist((v) => !v)}
                  >
                    <ListChecks className="h-3 w-3 mr-1" />
                    Checklist
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className={cn("text-xs", showLinks && "border-primary text-primary")}
                    onClick={() => { setShowLinks((v) => !v); if (!showLinks) setIsAddingLink(false); }}
                  >
                    <Link2 className="h-3 w-3 mr-1" />
                    Liens externes
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className={cn("text-xs", showAttachments && "border-primary text-primary")}
                    onClick={() => setShowAttachments((v) => !v)}
                  >
                    <Paperclip className="h-3 w-3 mr-1" />
                    Pièces jointes
                  </Button>
                </div>
              </div>

              {/* Pièces jointes Section */}
              {showAttachments && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    <Paperclip className="h-4 w-4" />
                    Pièces jointes
                    {(isEditMode ? editAttachments : localFiles).length > 0 && (
                      <span className="text-xs text-muted-foreground font-normal">
                        {(isEditMode ? editAttachments : localFiles).length}
                      </span>
                    )}
                    {isUploading && <span className="text-xs text-muted-foreground animate-pulse">Envoi...</span>}
                  </h3>
                  <div className="space-y-1">
                    {isEditMode
                      ? editAttachments.map((att) => (
                          <div key={att.id} className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-muted/40">
                            {getFileIcon(att.mimeType)}
                            <a
                              href={att.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 text-sm truncate hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {att.filename}
                            </a>
                            <span className="text-xs text-muted-foreground flex-shrink-0">{formatFileSize(att.size)}</span>
                            <button
                              type="button"
                              onClick={() => handleDeleteAttachment(att.id)}
                              className="text-muted-foreground hover:text-destructive cursor-pointer"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))
                      : localFiles.map(({ id, file }) => (
                          <div key={id} className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-muted/40">
                            {getFileIcon(file.type)}
                            <span className="flex-1 text-sm truncate">{file.name}</span>
                            <span className="text-xs text-muted-foreground flex-shrink-0">{formatFileSize(file.size)}</span>
                            <button
                              type="button"
                              onClick={() => handleDeleteLocalFile(id)}
                              className="text-muted-foreground hover:text-destructive cursor-pointer"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                  </div>
                  <Dropzone onFilesAdded={handleFilesAdded} maxSize={10 * 1024 * 1024} disabled={isUploading} />
                </div>
              )}

              {/* Liens externes Section */}
              {showLinks && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    <Link2 className="h-4 w-4" />
                    Liens externes
                    {(isEditMode ? editLinks : localLinks).length > 0 && (
                      <span className="text-xs text-muted-foreground font-normal">
                        {(isEditMode ? editLinks : localLinks).length}
                      </span>
                    )}
                  </h3>
                  <div className="space-y-1">
                    {(isEditMode ? editLinks : localLinks).map((link) => (
                      <div key={link.id} className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-muted/40 group">
                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 text-sm text-primary hover:underline truncate"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {link.title}
                        </a>
                        <button
                          type="button"
                          onClick={() => handleDeleteLink(link.id)}
                          className="text-muted-foreground hover:text-destructive cursor-pointer"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  {isAddingLink ? (
                    <div className="space-y-2 pl-1">
                      <Input
                        autoFocus
                        placeholder="Titre du lien..."
                        value={newLinkTitle}
                        onChange={(e) => setNewLinkTitle(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Escape") { setIsAddingLink(false); setNewLinkTitle(""); setNewLinkUrl(""); } }}
                        className="h-8 text-sm"
                      />
                      <Input
                        placeholder="https://..."
                        value={newLinkUrl}
                        onChange={(e) => setNewLinkUrl(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") { e.preventDefault(); handleAddLink(); }
                          if (e.key === "Escape") { setIsAddingLink(false); setNewLinkTitle(""); setNewLinkUrl(""); }
                        }}
                        className="h-8 text-sm"
                      />
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          className="h-7 text-xs"
                          disabled={!newLinkTitle.trim() || !newLinkUrl.trim()}
                          onClick={handleAddLink}
                        >
                          Ajouter
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => { setIsAddingLink(false); setNewLinkTitle(""); setNewLinkUrl(""); }}
                        >
                          Annuler
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-muted-foreground"
                      onClick={() => setIsAddingLink(true)}
                    >
                      + Ajouter un lien
                    </Button>
                  )}
                </div>
              )}

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </div>

            {/* Sidebar */}
            <div className="w-72 border-l bg-muted/20 p-4 space-y-4 overflow-y-auto">
              {/* Status */}
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  State
                </label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="w-full justify-start h-auto py-1.5 px-2 -ml-2 font-normal">
                      <div className={cn("w-2 h-2 rounded-full mr-2", currentStatus?.color)} />
                      {currentStatus?.label}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48">
                    {statusOptions.map((s) => (
                      <DropdownMenuItem key={s.id} onClick={() => setStatus(s.id)}>
                        <div className={cn("w-2 h-2 rounded-full mr-2", s.color)} />
                        {s.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Type */}
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Tag className="h-3 w-3" />
                  Type
                </label>
                {isEditMode ? (
                  <div className="flex items-center py-1.5 px-2 text-sm text-muted-foreground">
                    {currentType?.label}
                  </div>
                ) : (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="w-full justify-start h-auto py-1.5 px-2 -ml-2 font-normal">
                        {currentType?.label}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-48">
                      {typeOptions.map((t) => (
                        <DropdownMenuItem key={t.id} onClick={() => setType(t.id as "FEATURE" | "FIX")}>
                          {t.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              {/* Priority */}
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Flag className="h-3 w-3" />
                  Priority
                </label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="w-full justify-start h-auto py-1.5 px-2 -ml-2 font-normal">
                      <div className={cn("w-2 h-2 rounded-full mr-2", currentPriority?.color)} />
                      {currentPriority?.label}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48">
                    {priorityOptions.map((p) => (
                      <DropdownMenuItem key={p.id} onClick={() => setPriority(p.id)}>
                        <div className={cn("w-2 h-2 rounded-full mr-2", p.color)} />
                        {p.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <Separator />

              {/* Placeholder sections matching the design */}
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground flex items-center gap-1">
                    <User className="h-3 w-3" />
                    Assigné à
                  </label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="w-full justify-start h-auto py-1.5 px-2 -ml-2 font-normal">
                        {currentAssignee ? (
                          <div className="flex items-center gap-2">
                            <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center text-xs font-medium text-primary-foreground flex-shrink-0">
                              {getInitials(currentAssignee.name || currentAssignee.email)}
                            </div>
                            <span>{currentAssignee.name || currentAssignee.email}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Personne</span>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56">
                      <DropdownMenuItem onClick={() => setAssigneeId(null)}>
                        <span className="text-muted-foreground">Personne</span>
                      </DropdownMenuItem>
                      {projectUsers.map((u) => (
                        <DropdownMenuItem key={u.id} onClick={() => setAssigneeId(u.id)}>
                          <div className="flex items-center gap-2">
                            <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center text-xs font-medium text-primary-foreground flex-shrink-0">
                              {getInitials(u.name || u.email)}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm">{u.name || u.email}</span>
                              {u.name && <span className="text-xs text-muted-foreground">{u.email}</span>}
                            </div>
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Date d'échéance
                  </label>
                  <DatePicker
                    value={dueDate}
                    onChange={setDueDate}
                    placeholder="Pas de date"
                  />
                </div>
              </div>

              <Separator />

              {/* Labels */}
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Tag className="h-3 w-3" />
                  Labels
                </label>
                <LabelSelector
                  projectId={projectId}
                  selectedLabels={selectedLabels}
                  projectLabels={projectLabels}
                  onToggle={handleToggleLabel}
                  onCreateAndToggle={isAdmin ? handleCreateAndToggleLabel : undefined}
                  onDelete={isAdmin ? handleDeleteLabel : undefined}
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <DialogFooter className="px-6 py-4 border-t bg-background shrink-0">
            <div className="flex items-center justify-between w-full">
              <Button
                type="button"
                variant="outline"
                onClick={handleDiscard}
                disabled={isLoading}
              >
                {isEditMode ? "Annuler" : "Annuler le brouillon"}
              </Button>
              <div className="flex items-center gap-3">
                {!isEditMode && (
                  <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={createAnother}
                      onChange={(e) => setCreateAnother(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    Créer une autre
                  </label>
                )}
                <Button type="submit" disabled={isLoading}>
                  {isLoading
                    ? isEditMode ? "Enregistrement..." : "Création..."
                    : isEditMode ? "Enregistrer" : "Créer la Story"}
                </Button>
              </div>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
