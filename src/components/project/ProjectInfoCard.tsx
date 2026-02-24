"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Folder, Pencil, Check, X, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useProjectStore } from "@/stores/project";

export function ProjectInfoCard() {
  const router = useRouter();
  const projectId = useProjectStore((s) => s.projectId) ?? "";
  const name = useProjectStore((s) => s.projectName) ?? "";
  const description = useProjectStore((s) => s.projectDescription);
  const updateProjectMeta = useProjectStore((s) => s.updateProjectMeta);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editName, setEditName] = useState(name);
  const [editDescription, setEditDescription] = useState(description || "");

  async function handleSave() {
    if (!editName.trim()) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          description: editDescription.trim() || null,
        }),
      });

      if (response.ok) {
        updateProjectMeta(editName.trim(), editDescription.trim() || null);
        setIsEditing(false);
        router.refresh();
      }
    } catch {
      // silently fail
    } finally {
      setIsSaving(false);
    }
  }

  function handleCancel() {
    setEditName(name);
    setEditDescription(description || "");
    setIsEditing(false);
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base">
          <Folder size={18} />
          Informations du projet
        </CardTitle>
        {!isEditing && (
          <Button variant="ghost" size="sm" onClick={() => { setEditName(name); setEditDescription(description || ""); setIsEditing(true); }}>
            <Pencil size={16} className="mr-1" />
            Modifier
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {isEditing ? (
          <>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Nom</label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Nom du projet"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Description</label>
              <Textarea
                value={editDescription}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditDescription(e.target.value)}
                placeholder="Description du projet"
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={isSaving || !editName.trim()}>
                {isSaving ? <Loader2 size={16} className="mr-1 animate-spin" /> : <Check size={16} className="mr-1" />}
                Enregistrer
              </Button>
              <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                <X size={16} className="mr-1" />
                Annuler
              </Button>
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Nom</label>
              <p className="text-lg font-semibold">{name}</p>
            </div>
            {description ? (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Description</label>
                <p className="text-sm">{description}</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">Aucune description</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
