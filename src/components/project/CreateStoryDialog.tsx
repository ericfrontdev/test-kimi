"use client";

import { useState } from "react";
import { Plus, X, CheckSquare, Link2, Paperclip, ListChecks, GitBranch, Clock, User, Flag, Calendar, Tag, FolderOpen, MoreHorizontal } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { cn } from "@/lib/utils";

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
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("BACKLOG");
  const [type, setType] = useState<"FEATURE" | "FIX">("FEATURE");
  const [priority, setPriority] = useState(2);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createAnother, setCreateAnother] = useState(false);

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
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Échec de la création");
      }

      if (createAnother) {
        // Reset form but keep dialog open
        setTitle("");
        setDescription("");
        setStatus("BACKLOG");
        setType("FEATURE");
        setPriority(2);
      } else {
        // Close dialog and reset
        setTitle("");
        setDescription("");
        setStatus("BACKLOG");
        setType("FEATURE");
        setPriority(2);
        setOpen(false);
      }
      
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
    setOpen(false);
  }

  const currentStatus = statusOptions.find((s) => s.id === status);
  const currentType = typeOptions.find((t) => t.id === type);
  const currentPriority = priorityOptions.find((p) => p.id === priority);

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
        <DialogHeader className="px-6 py-4 border-b flex flex-row items-center justify-between">
          <DialogTitle className="text-lg font-semibold">
            Créer une Story
          </DialogTitle>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex flex-1 overflow-hidden">
            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm text-muted-foreground">
                  Titre de la Story
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Entrez le titre de la story..."
                  className="text-lg font-medium border-0 border-b rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary"
                  autoFocus
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">
                  Description <span className="text-muted-foreground/60">Optionnel</span>
                </Label>
                <RichTextEditor
                  value={description}
                  onChange={setDescription}
                  placeholder="Décrivez la story..."
                />
              </div>

              {/* Sous-tâches Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckSquare className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-sm">Sous-tâches</Label>
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
                <Label className="text-sm text-muted-foreground">Add to Story</Label>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm" className="text-xs" disabled>
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
                    Propriétaire
                  </label>
                  <Button variant="ghost" className="w-full justify-start h-auto py-1.5 px-2 -ml-2 font-normal text-muted-foreground" disabled>
                    Personne
                  </Button>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Date d'échéance
                  </label>
                  <Button variant="ghost" className="w-full justify-start h-auto py-1.5 px-2 -ml-2 font-normal text-muted-foreground" disabled>
                    Pas de date
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Labels */}
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Labels</label>
                <Button variant="outline" size="sm" className="text-xs w-full" disabled>
                  Ajouter des labels
                </Button>
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
