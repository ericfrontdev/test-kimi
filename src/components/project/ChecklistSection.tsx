"use client";

import { useState, useRef, useEffect } from "react";
import { Pencil, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { Checklist, ChecklistItem } from "@/components/project/kanban/types";

interface ChecklistSectionProps {
  checklist: Checklist;
  projectId: string;
  storyId: string;
  onUpdate: (updater: (prev: Checklist[]) => Checklist[]) => void;
  onDelete: (checklistId: string) => void;
}

export function ChecklistSection({
  checklist,
  projectId,
  storyId,
  onUpdate,
  onDelete,
}: ChecklistSectionProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(checklist.title);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState("");
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingItemTitle, setEditingItemTitle] = useState("");
  const addInputRef = useRef<HTMLInputElement>(null);

  const base = `/api/projects/${projectId}/stories/${storyId}/checklists/${checklist.id}`;

  const checkedCount = checklist.items.filter((i) => i.checked).length;
  const totalCount = checklist.items.length;

  useEffect(() => {
    if (isAddingItem) addInputRef.current?.focus();
  }, [isAddingItem]);

  function patchChecklist(patch: Partial<Checklist>) {
    onUpdate((prev) =>
      prev.map((c) => (c.id === checklist.id ? { ...c, ...patch } : c))
    );
  }

  function patchItem(itemId: string, patch: Partial<ChecklistItem>) {
    patchChecklist({
      items: checklist.items.map((i) => (i.id === itemId ? { ...i, ...patch } : i)),
    });
  }

  function removeItem(itemId: string) {
    patchChecklist({ items: checklist.items.filter((i) => i.id !== itemId) });
  }

  async function handleSaveTitle() {
    if (!editedTitle.trim() || editedTitle === checklist.title) {
      setEditedTitle(checklist.title);
      setIsEditingTitle(false);
      return;
    }
    patchChecklist({ title: editedTitle.trim() });
    setIsEditingTitle(false);
    await fetch(base, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: editedTitle.trim() }),
    });
  }

  async function handleToggleItem(item: ChecklistItem) {
    patchItem(item.id, { checked: !item.checked });
    await fetch(`${base}/items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checked: !item.checked }),
    });
  }

  async function handleDeleteItem(itemId: string) {
    removeItem(itemId);
    await fetch(`${base}/items/${itemId}`, { method: "DELETE" });
  }

  async function handleAddItem() {
    const title = newItemTitle.trim();
    if (!title) return;
    setNewItemTitle("");
    // Optimistic: add with temp id
    const tempId = `temp-${Date.now()}`;
    patchChecklist({
      items: [...checklist.items, { id: tempId, title, checked: false, position: checklist.items.length }],
    });
    const res = await fetch(`${base}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    if (res.ok) {
      const created: ChecklistItem = await res.json();
      patchChecklist({
        items: checklist.items
          .filter((i) => i.id !== tempId)
          .concat({ ...created }),
      });
    } else {
      removeItem(tempId);
    }
  }

  async function handleSaveItemTitle(item: ChecklistItem) {
    const title = editingItemTitle.trim();
    setEditingItemId(null);
    if (!title || title === item.title) return;
    patchItem(item.id, { title });
    await fetch(`${base}/items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
  }

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="group/header flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isEditingTitle ? (
            <Input
              autoFocus
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              onBlur={handleSaveTitle}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveTitle();
                if (e.key === "Escape") { setEditedTitle(checklist.title); setIsEditingTitle(false); }
              }}
              className="h-7 text-sm font-medium w-48"
            />
          ) : (
            <span className="text-sm font-medium">{checklist.title}</span>
          )}
          <span className="text-xs text-muted-foreground">
            {checkedCount}/{totalCount}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            title="Renommer"
            onClick={() => { setEditedTitle(checklist.title); setIsEditingTitle(true); }}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            title="Supprimer la checklist"
            onClick={() => onDelete(checklist.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Items */}
      <div className="space-y-1">
        {checklist.items.map((item) => (
          <div key={item.id} className="flex items-center gap-2 py-1 rounded-md hover:bg-muted/40 px-1">
            <Checkbox
              checked={item.checked}
              onCheckedChange={() => handleToggleItem(item)}
              className="flex-shrink-0"
            />
            {editingItemId === item.id ? (
              <Input
                autoFocus
                value={editingItemTitle}
                onChange={(e) => setEditingItemTitle(e.target.value)}
                onBlur={() => handleSaveItemTitle(item)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveItemTitle(item);
                  if (e.key === "Escape") setEditingItemId(null);
                }}
                className="h-7 text-sm flex-1"
              />
            ) : (
              <span
                className={cn(
                  "flex-1 text-sm cursor-pointer",
                  item.checked && "line-through text-muted-foreground"
                )}
                onClick={() => { setEditingItemId(item.id); setEditingItemTitle(item.title); }}
              >
                {item.title}
              </span>
            )}
            <button
              type="button"
              onClick={() => handleDeleteItem(item.id)}
              className="flex-shrink-0 text-muted-foreground hover:text-destructive"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Add item */}
      {isAddingItem ? (
        <div className="space-y-2 pl-1">
          <Input
            ref={addInputRef}
            placeholder="Nouvel item..."
            value={newItemTitle}
            onChange={(e) => setNewItemTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddItem();
              if (e.key === "Escape") { setIsAddingItem(false); setNewItemTitle(""); }
            }}
            className="h-8 text-sm"
          />
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              className="h-7 text-xs"
              onClick={handleAddItem}
              disabled={!newItemTitle.trim()}
            >
              Créer
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={() => { setIsAddingItem(false); setNewItemTitle(""); }}
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
          className="h-7 text-xs text-muted-foreground pl-7"
          onClick={() => setIsAddingItem(true)}
        >
          + Ajouter un item
        </Button>
      )}
    </div>
  );
}
