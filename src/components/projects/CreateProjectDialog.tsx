"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
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
import { useProjectsStore } from "@/stores/projects";

export function CreateProjectDialog() {
  const [open, setOpen] = useState(false);
  
  // Reset form error when dialog opens/closes
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setFormError(null);
      setName("");
      setDescription("");
    }
  };
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  
  const createProject = useProjectsStore((state) => state.createProject);
  const storeError = useProjectsStore((state) => state.error);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    
    if (!name.trim()) {
      setFormError("Project name is required");
      return;
    }

    setIsLoading(true);
    const project = await createProject({
      name: name.trim(),
      description: description.trim() || undefined,
    });
    setIsLoading(false);

    if (project) {
      setName("");
      setDescription("");
      setOpen(false);
    } else {
      setFormError(storeError || "Failed to create project");
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-5 w-5">
          <Plus size={14} />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Créer un Projet</DialogTitle>
          <DialogDescription>
            Créez un nouveau projet pour organiser vos stories.
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
