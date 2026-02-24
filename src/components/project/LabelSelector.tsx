"use client";

import { useState } from "react";
import { Check, Plus, Tag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { Label } from "@/components/project/kanban/types";

const PRESET_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#14b8a6", "#3b82f6", "#8b5cf6", "#ec4899",
  "#6b7280", "#6366f1",
];

interface LabelSelectorProps {
  projectId: string;
  selectedLabels: Label[];
  projectLabels: Label[];
  onToggle: (label: Label) => void;
  onCreateAndToggle?: (name: string, color: string) => Promise<void>;
  onDelete?: (labelId: string) => Promise<void>;
}

export function LabelSelector({
  projectId: _projectId,
  selectedLabels,
  projectLabels,
  onToggle,
  onCreateAndToggle,
  onDelete,
}: LabelSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(PRESET_COLORS[5]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filtered = projectLabels.filter((l) =>
    l.name.toLowerCase().includes(search.toLowerCase())
  );

  async function handleCreate() {
    if (!newName.trim() || !onCreateAndToggle) return;
    setIsSubmitting(true);
    try {
      await onCreateAndToggle(newName.trim(), newColor);
      setNewName("");
      setNewColor(PRESET_COLORS[5]);
      setIsCreating(false);
      setSearch("");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-start h-auto py-1.5 px-2 -ml-2 font-normal flex-wrap gap-1 min-h-[32px]"
        >
          {selectedLabels.length > 0 ? (
            selectedLabels.map((l) => (
              <span
                key={l.id}
                className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full text-white font-medium"
                style={{ backgroundColor: l.color }}
              >
                {l.name}
              </span>
            ))
          ) : (
            <span className="text-muted-foreground text-sm">Aucun label</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="start">
        <Input
          placeholder="Rechercher..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 text-sm mb-2"
        />

        <div className="max-h-48 overflow-y-auto space-y-0.5">
          {filtered.length === 0 && !isCreating && (
            <p className="text-xs text-muted-foreground text-center py-2">Aucun label trouvé</p>
          )}
          {filtered.map((label) => {
            const selected = selectedLabels.some((l) => l.id === label.id);
            return (
              <div
                key={label.id}
                className="group flex items-center gap-2 px-2 py-1.5 rounded-sm hover:bg-accent text-sm"
              >
                <button
                  type="button"
                  onClick={() => onToggle(label)}
                  className="flex items-center gap-2 flex-1 min-w-0 text-left"
                >
                  <span
                    className="h-3 w-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: label.color }}
                  />
                  <span className="flex-1 truncate">{label.name}</span>
                  {selected && <Check className="h-3 w-3 flex-shrink-0" />}
                </button>
                {onDelete && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(label.id);
                    }}
                    className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {onCreateAndToggle && (
          <>
            <Separator className="my-2" />

            {isCreating ? (
              <div className="space-y-2">
                <Input
                  placeholder="Nom du label"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="h-8 text-sm"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreate();
                    if (e.key === "Escape") setIsCreating(false);
                  }}
                />
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_COLORS.map((c) => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setNewColor(c)}
                      className={cn(
                        "h-5 w-5 rounded-full border-2 transition-transform hover:scale-110",
                        newColor === c ? "border-foreground scale-110" : "border-transparent"
                      )}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button type="button" size="sm" className="h-7 text-xs flex-1" onClick={handleCreate} disabled={isSubmitting || !newName.trim()}>
                    {isSubmitting ? "Création..." : "Créer"}
                  </Button>
                  <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={() => setIsCreating(false)}>
                    Annuler
                  </Button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsCreating(true)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-sm hover:bg-accent text-sm text-muted-foreground"
              >
                <Plus className="h-3 w-3" />
                Créer un label
              </button>
            )}
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
