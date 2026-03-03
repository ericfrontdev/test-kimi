"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, Check, Loader2, User, Flag, AlignLeft } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useProjectListStore, type ProjectList, type ListItem } from "@/stores/project-list";
import { useProjectStore } from "@/stores/project";
import type { ProjectUser } from "@/components/project/kanban/types";

const PRIORITY_LABELS: Record<number, string> = {
  0: "P0 - Critique",
  1: "P1 - Haute",
  2: "P2 - Normale",
  3: "P3 - Basse",
};

const STATUS_LABELS: Record<string, string> = {
  BACKLOG: "Backlog",
  TODO: "À faire",
  IN_PROGRESS: "En cours",
  DONE: "Terminé",
};

interface ListDetailDialogProps {
  list: ProjectList | null;
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ListDetailDialog({ list, projectId, open, onOpenChange }: ListDetailDialogProps) {
  const listItems = useProjectListStore((s) => s.listItems);
  const setListItemsCache = useProjectListStore((s) => s.setListItemsCache);
  const addListItem = useProjectListStore((s) => s.addListItem);
  const removeListItem = useProjectListStore((s) => s.removeListItem);
  const updateListItem = useProjectListStore((s) => s.updateListItem);
  const updateListFields = useProjectListStore((s) => s.updateListFields);
  const projectUsers = useProjectStore((s) => s.projectUsers);

  const [items, setItemsLocal] = useState<ListItem[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState("");
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState("");
  const [editingDesc, setEditingDesc] = useState(false);
  const [descValue, setDescValue] = useState("");
  const newItemRef = useRef<HTMLInputElement>(null);

  // Fetch items when dialog opens
  useEffect(() => {
    if (!open || !list) return;

    setTitleValue(list.title);
    setDescValue(list.description ?? "");

    if (listItems[list.id]) {
      setItemsLocal(listItems[list.id]);
      return;
    }

    setIsLoadingItems(true);
    fetch(`/api/projects/${projectId}/lists/${list.id}`)
      .then((r) => r.json())
      .then((data) => {
        const fetched: ListItem[] = data.items ?? [];
        setListItemsCache(list.id, fetched);
        setItemsLocal(fetched);
      })
      .catch(() => {})
      .finally(() => setIsLoadingItems(false));
  }, [open, list, projectId]);

  // Keep local items in sync with store cache
  useEffect(() => {
    if (!list) return;
    const cached = listItems[list.id];
    if (cached) setItemsLocal(cached);
  }, [listItems, list]);

  async function handleToggleItem(item: ListItem) {
    if (!list) return;
    const newStatus = item.status === "DONE" ? "TODO" : "DONE";
    updateListItem(list.id, item.id, { status: newStatus });

    await fetch(`/api/projects/${projectId}/lists/${list.id}/items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
  }

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    if (!list || !newItemTitle.trim()) return;

    setIsAddingItem(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/lists/${list.id}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newItemTitle.trim() }),
      });
      if (res.ok) {
        const item: ListItem = await res.json();
        addListItem(list.id, item);
        setNewItemTitle("");
      }
    } finally {
      setIsAddingItem(false);
      newItemRef.current?.focus();
    }
  }

  async function handleDeleteItem(item: ListItem) {
    if (!list) return;
    removeListItem(list.id, item.id);
    await fetch(`/api/projects/${projectId}/lists/${list.id}/items/${item.id}`, {
      method: "DELETE",
    });
  }

  async function handleSaveTitle() {
    if (!list || !titleValue.trim()) return;
    setEditingTitle(false);
    updateListFields(list.id, { title: titleValue.trim() });
  }

  async function handleSaveDesc() {
    if (!list) return;
    setEditingDesc(false);
    updateListFields(list.id, { description: descValue || null });
  }

  const doneCount = items.filter((i) => i.status === "DONE").length;

  if (!list) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground">LIST-{list.listNumber}</span>
            <Badge variant="outline" className="text-xs">
              {STATUS_LABELS[list.status] ?? list.status}
            </Badge>
          </div>
          {editingTitle ? (
            <Input
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              onBlur={handleSaveTitle}
              onKeyDown={(e) => { if (e.key === "Enter") handleSaveTitle(); if (e.key === "Escape") setEditingTitle(false); }}
              className="text-lg font-semibold"
              autoFocus
            />
          ) : (
            <DialogTitle
              className="text-lg cursor-pointer hover:text-muted-foreground transition-colors"
              onClick={() => setEditingTitle(true)}
            >
              {list.title}
            </DialogTitle>
          )}
        </DialogHeader>

        <div className="space-y-6">
          {/* Metadata row */}
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Flag size={14} />
              <span>{PRIORITY_LABELS[list.priority] ?? list.priority}</span>
            </div>
            {list.assignee && (
              <div className="flex items-center gap-1.5">
                <User size={14} />
                <span>{list.assignee.name ?? list.assignee.email}</span>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center gap-1.5 mb-2 text-sm font-medium">
              <AlignLeft size={14} />
              Description
            </div>
            {editingDesc ? (
              <Input
                value={descValue}
                onChange={(e) => setDescValue(e.target.value)}
                onBlur={handleSaveDesc}
                onKeyDown={(e) => { if (e.key === "Enter") handleSaveDesc(); if (e.key === "Escape") setEditingDesc(false); }}
                placeholder="Ajouter une description..."
                autoFocus
              />
            ) : (
              <p
                onClick={() => setEditingDesc(true)}
                className={cn(
                  "cursor-pointer rounded px-1 py-0.5 text-sm hover:bg-muted/50 transition-colors min-h-[2rem]",
                  !list.description && "text-muted-foreground italic"
                )}
              >
                {list.description || "Ajouter une description..."}
              </p>
            )}
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium">
                Items
                {items.length > 0 && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    {doneCount}/{items.length} terminés
                  </span>
                )}
              </span>
            </div>

            {isLoadingItems ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-1">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-muted/40 group"
                  >
                    <Checkbox
                      checked={item.status === "DONE"}
                      onCheckedChange={() => handleToggleItem(item)}
                      className="flex-shrink-0"
                    />
                    <span
                      className={cn(
                        "flex-1 text-sm",
                        item.status === "DONE" && "line-through text-muted-foreground"
                      )}
                    >
                      {item.title}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleDeleteItem(item)}
                    >
                      <Trash2 size={12} />
                    </Button>
                  </div>
                ))}

                {items.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Aucun item. Ajoutez-en un ci-dessous.
                  </p>
                )}
              </div>
            )}

            {/* Add item form */}
            <form onSubmit={handleAddItem} className="flex gap-2 mt-3">
              <Input
                ref={newItemRef}
                value={newItemTitle}
                onChange={(e) => setNewItemTitle(e.target.value)}
                placeholder="Ajouter un item..."
                className="flex-1"
              />
              <Button type="submit" size="sm" disabled={isAddingItem || !newItemTitle.trim()}>
                {isAddingItem ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus size={16} />}
              </Button>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
