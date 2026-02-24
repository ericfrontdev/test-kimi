"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, CheckSquare, Link2, Paperclip, ListChecks, GitBranch, Clock, User, Flag, Calendar, Tag, FolderOpen, X } from "lucide-react";
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
import type { ProjectUser, Label } from "@/components/project/kanban/types";
import { DatePicker } from "@/components/ui/date-picker";
import { LabelSelector } from "@/components/project/LabelSelector";
import { useProjectStore } from "@/stores/project";

interface CreateStoryDialogProps {
  projectId: string;
  variant?: "button" | "icon";
  onSuccess?: () => void;
}

const statusOptions = [
  { id: "BACKLOG", label: "Backlog", color: "bg-slate-400" },
  { id: "TODO", label: "À faire", color: "bg-slate-400" },
  { id: "IN_PROGRESS", label: "En cours", color: "bg-blue-500" },
  { id: "IN_REVIEW", label: "En révision", color: "bg-amber-500" },
  { id: "DONE", label: "Terminé", color: "bg-emerald-500" },
];

const typeOptions = [
  { id: "FEATURE", label: "Feature", icon: "✨", color: "bg-purple-500" },
  { id: "FIX", label: "Fix", icon: "🐛", color: "bg-red-500" },
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
}: CreateStoryDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("BACKLOG");
  const [type, setType] = useState<"FEATURE" | "FIX">("FEATURE");
  const [priority, setPriority] = useState(2);
  const [assigneeId, setAssigneeId] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [selectedLabels, setSelectedLabels] = useState<Label[]>([]);
  const [showChecklist, setShowChecklist] = useState(false);
  const [localChecklistItems, setLocalChecklistItems] = useState<{ id: string; title: string; status: "TODO" | "IN_PROGRESS" | "DONE" }[]>([]);
  const [isAddingLocalItem, setIsAddingLocalItem] = useState(false);
  const [newLocalItemTitle, setNewLocalItemTitle] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createAnother, setCreateAnother] = useState(false);

  const isAdmin = useProjectStore((s) => s.userRole) !== "MEMBER";

  const { data: projectUsers = [] } = useSWR<ProjectUser[]>(
    open ? `/api/projects/${projectId}/members` : null,
    fetcher
  );

  const { data: projectLabels = [], mutate: mutateLabels } = useSWR<Label[]>(
    open ? `/api/projects/${projectId}/labels` : null,
    fetcher
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Le titre est requis");
      return;
    }

    setIsLoading(true);
    try {
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
        // Reset form but keep dialog open
        setTitle("");
        setDescription("");
        setStatus("BACKLOG");
        setType("FEATURE");
        setPriority(2);
        setAssigneeId(null);
        setDueDate(null);
        setSelectedLabels([]);
        setShowChecklist(false);
        setLocalChecklistItems([]);
      } else {
        // Close dialog and reset
        setTitle("");
        setDescription("");
        setStatus("BACKLOG");
        setType("FEATURE");
        setPriority(2);
        setAssigneeId(null);
        setDueDate(null);
        setSelectedLabels([]);
        setShowChecklist(false);
        setLocalChecklistItems([]);
        setOpen(false);
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
    setTitle("");
    setDescription("");
    setStatus("BACKLOG");
    setType("FEATURE");
    setPriority(2);
    setAssigneeId(null);
    setDueDate(null);
    setSelectedLabels([]);
    setShowChecklist(false);
    setLocalChecklistItems([]);
    setOpen(false);
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

  const currentStatus = statusOptions.find((s) => s.id === status);
  const currentType = typeOptions.find((t) => t.id === type);
  const currentPriority = priorityOptions.find((p) => p.id === priority);
  const currentAssignee = projectUsers.find((u) => u.id === assigneeId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
      <DialogContent className="!max-w-none w-[60vw] h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="text-lg font-semibold">
            Créer une Story
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
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
                <div className="flex items-center gap-2">
                  <CheckSquare className="h-4 w-4 text-muted-foreground" />
                  <FormLabel className="text-sm">Sous-tâches</FormLabel>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-muted-foreground"
                  disabled
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Sub-task
                </Button>
                <p className="text-xs text-muted-foreground">
                  Les sous-tâches peuvent être ajoutées après la création de la story.
                </p>
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
                  <Button type="button" variant="outline" size="sm" className="text-xs" disabled>
                    <GitBranch className="h-3 w-3 mr-1" />
                    Relationships
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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="w-full justify-start h-auto py-1.5 px-2 -ml-2 font-normal">
                      <span className="mr-2">{currentType?.icon}</span>
                      {currentType?.label}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48">
                    {typeOptions.map((t) => (
                      <DropdownMenuItem key={t.id} onClick={() => setType(t.id as "FEATURE" | "FIX")}>
                        <span className="mr-2">{t.icon}</span>
                        {t.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
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
                    <FolderOpen className="h-3 w-3" />
                    Epic
                  </label>
                  <Button variant="ghost" className="w-full justify-start h-auto py-1.5 px-2 -ml-2 font-normal text-muted-foreground" disabled>
                    Aucun
                  </Button>
                </div>

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
                Annuler le brouillon
              </Button>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createAnother}
                    onChange={(e) => setCreateAnother(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  Créer une autre
                </label>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Création..." : "Créer une Story"}
                </Button>
              </div>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
