"use client";

import { useState } from "react";
import { Plus, LayoutList, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useProjectsStore } from "@/stores/projects";

type ProjectType = "STORY" | "LIST";

export function CreateProjectDialog() {
  const [open, setOpen] = useState(false);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setFormError(null);
      setName("");
      setDescription("");
      setProjectType("STORY");
    }
  };

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [projectType, setProjectType] = useState<ProjectType>("STORY");
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const createProject = useProjectsStore((state) => state.createProject);
  const storeError = useProjectsStore((state) => state.error);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError("Le nom du projet est requis");
      return;
    }

    setIsLoading(true);
    const project = await createProject({
      name: name.trim(),
      description: description.trim() || undefined,
      type: projectType,
    });
    setIsLoading(false);

    if (project) {
      setName("");
      setDescription("");
      setProjectType("STORY");
      setOpen(false);
    } else {
      setFormError(storeError || "Échec de la création du projet");
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-5 w-5" aria-label="Nouveau projet">
          <Plus size={14} />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Créer un Projet</DialogTitle>
          <DialogDescription>
            Créez un nouveau projet pour organiser votre travail.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom du projet *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Mon super projet"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brève description..."
              />
            </div>

            <div className="space-y-2">
              <Label>Type de projet</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setProjectType("STORY")}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-lg border p-3 text-sm transition-colors",
                    projectType === "STORY"
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/40"
                  )}
                >
                  <Layers size={20} />
                  <span className="font-medium">Story-based</span>
                  <span className="text-xs text-center leading-tight">
                    Kanban, backlog, stories et sous-tâches
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setProjectType("LIST")}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-lg border p-3 text-sm transition-colors",
                    projectType === "LIST"
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/40"
                  )}
                >
                  <LayoutList size={20} />
                  <span className="font-medium">List-based</span>
                  <span className="text-xs text-center leading-tight">
                    Listes de tâches avec items à cocher
                  </span>
                </button>
              </div>
            </div>

            {formError && (
              <p className="text-sm text-destructive">{formError}</p>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Création..." : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
