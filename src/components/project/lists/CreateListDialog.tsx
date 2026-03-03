"use client";

import { useState, useEffect } from "react";
import { Plus, User, Flag } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn, getInitials } from "@/lib/utils";
import { useProjectStore } from "@/stores/project";
import { useProjectListStore, type ProjectList } from "@/stores/project-list";
import type { ProjectUser } from "@/components/project/kanban/types";

const STATUS_OPTIONS = [
  { value: "BACKLOG", label: "Backlog" },
  { value: "TODO", label: "À faire" },
  { value: "IN_PROGRESS", label: "En cours" },
  { value: "DONE", label: "Terminé" },
] as const;

const PRIORITY_OPTIONS = [
  { value: 0, label: "P0 - Critique" },
  { value: 1, label: "P1 - Haute" },
  { value: 2, label: "P2 - Normale" },
  { value: 3, label: "P3 - Basse" },
] as const;

interface CreateListDialogProps {
  projectId: string;
  variant?: "button" | "icon";
  // Edit mode
  listId?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CreateListDialog({
  projectId,
  variant = "button",
  listId,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: CreateListDialogProps) {
  const isEditMode = !!listId;
  const isControlled = controlledOpen !== undefined;

  const [internalOpen, setInternalOpen] = useState(false);
  const open = isControlled ? controlledOpen : internalOpen;

  function handleOpenChange(val: boolean) {
    if (isControlled) controlledOnOpenChange?.(val);
    else setInternalOpen(val);
  }

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<string>("BACKLOG");
  const [priority, setPriority] = useState<number>(2);
  const [assigneeId, setAssigneeId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const projectUsers = useProjectStore((s) => s.projectUsers);
  const fetchProjectUsers = useProjectStore((s) => s.fetchProjectUsers);
  const addList = useProjectListStore((s) => s.addList);
  const lists = useProjectListStore((s) => s.lists);
  const updateListFields = useProjectListStore((s) => s.updateListFields);
  const updateListStatus = useProjectListStore((s) => s.updateListStatus);
  const updateListPriority = useProjectListStore((s) => s.updateListPriority);
  const updateListAssignee = useProjectListStore((s) => s.updateListAssignee);

  // Fetch users on open
  useEffect(() => {
    if (open) {
      fetchProjectUsers(projectId);
    }
  }, [open, projectId, fetchProjectUsers]);

  // Populate form in edit mode
  useEffect(() => {
    if (open && isEditMode && listId) {
      const list = lists.find((l) => l.id === listId);
      if (list) {
        setTitle(list.title);
        setDescription(list.description ?? "");
        setStatus(list.status);
        setPriority(list.priority);
        setAssigneeId(list.assigneeId ?? null);
      }
    }
    if (!open) {
      if (!isEditMode) {
        setTitle("");
        setDescription("");
        setStatus("BACKLOG");
        setPriority(2);
        setAssigneeId(null);
      }
      setError(null);
    }
  }, [open, isEditMode, listId, lists]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Le titre est requis");
      return;
    }

    setIsLoading(true);
    try {
      if (isEditMode && listId) {
        // Update
        const res = await fetch(`/api/projects/${projectId}/lists/${listId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, description: description || null, status, priority, assigneeId }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.error ?? "Échec de la mise à jour");
          return;
        }
        // Update store optimistically
        updateListFields(listId, { title, description: description || null, status });
        updateListPriority(listId, priority);
        const assignee = assigneeId
          ? (projectUsers.find((u) => u.id === assigneeId) as ProjectList["assignee"])
          : null;
        updateListAssignee(listId, assigneeId, assignee);
        handleOpenChange(false);
      } else {
        // Create
        const res = await fetch(`/api/projects/${projectId}/lists`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, description: description || null, status, priority, assigneeId }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.error ?? "Échec de la création");
          return;
        }
        const list: ProjectList = await res.json();
        addList(list);
        handleOpenChange(false);
      }
    } finally {
      setIsLoading(false);
    }
  }

  const trigger = isControlled ? null : variant === "button" ? (
    <Button>
      <Plus className="mr-2 h-4 w-4" />
      Créer une liste
    </Button>
  ) : (
    <Button variant="ghost" size="icon" className="h-7 w-7">
      <Plus size={14} />
    </Button>
  );

  const content = (
    <DialogContent className="sm:max-w-[480px]">
      <DialogHeader>
        <DialogTitle>{isEditMode ? "Modifier la liste" : "Créer une liste"}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit}>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <FormLabel htmlFor="list-title">Titre *</FormLabel>
            <Input
              id="list-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nom de la liste"
              required
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <FormLabel htmlFor="list-description">Description</FormLabel>
            <Input
              id="list-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description optionnelle..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <FormLabel className="flex items-center gap-1.5 text-sm">
                <Flag size={14} />
                Priorité
              </FormLabel>
              <Select value={String(priority)} onValueChange={(v) => setPriority(Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={String(opt.value)}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <FormLabel className="text-sm">Statut</FormLabel>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <FormLabel className="flex items-center gap-1.5 text-sm">
              <User size={14} />
              Assigné
            </FormLabel>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setAssigneeId(null)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs transition-colors",
                  !assigneeId ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/40"
                )}
              >
                Non assigné
              </button>
              {projectUsers.map((u: ProjectUser) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => setAssigneeId(u.id)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors",
                    assigneeId === u.id ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/40"
                  )}
                >
                  <span className="h-4 w-4 rounded-full bg-muted flex items-center justify-center text-[9px] font-semibold">
                    {getInitials(u.name ?? u.email)}
                  </span>
                  {u.name ?? u.email}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
            Annuler
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (isEditMode ? "Enregistrement..." : "Création...") : (isEditMode ? "Enregistrer" : "Créer")}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );

  if (isControlled) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        {content}
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      {content}
    </Dialog>
  );
}
