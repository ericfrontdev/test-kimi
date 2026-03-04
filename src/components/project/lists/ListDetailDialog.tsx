"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, Loader2, User, Flag, AlignLeft } from "lucide-react";
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
import { ListItemDetailDialog } from "./ListItemDetailDialog";
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
  const [selectedItem, setSelectedItem] = useState<ListItem | null>(null);
  const [isItemDetailOpen, setIsItemDetailOpen] = useState(false);
  const newItemTextareaRef = useRef<HTMLTextAreaElement>(null);

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

  // Auto-resize new item textarea
  useEffect(() => {
    const el = newItemTextareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [newItemTitle]);

  async function handleAddItem(e?: React.FormEvent) {
    e?.preventDefault();
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
        if (newItemTextareaRef.current) {
          newItemTextareaRef.current.style.height = "auto";
        }
      }
    } finally {
      setIsAddingItem(false);
      newItemTextareaRef.current?.focus();
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
    <>
    <ListItemDetailDialog
      item={selectedItem}
      listId={list.id}
      projectId={projectId}
      open={isItemDetailOpen}
      onOpenChange={setIsItemDetailOpen}
    />
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
                    className="flex items-start gap-3 rounded-md px-2 py-1.5 hover:bg-muted/40 group"
                  >
                    <Checkbox
                      checked={item.status === "DONE"}
                      onCheckedChange={() => handleToggleItem(item)}
                      className="flex-shrink-0 mt-0.5"
                    />
                    <span
                      className={cn(
                        "flex-1 text-sm cursor-pointer hover:underline decoration-muted-foreground/50 whitespace-pre-wrap break-words",
                        item.status === "DONE" && "line-through text-muted-foreground"
                      )}
                      onClick={() => { setSelectedItem(item); setIsItemDetailOpen(true); }}
                    >
                      {item.title}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5"
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
            <div className="flex gap-2 mt-3 items-start">
              <textarea
                ref={newItemTextareaRef}
                value={newItemTitle}
                onChange={(e) => setNewItemTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleAddItem();
                  }
                }}
                placeholder="Ajouter un item... (Entrée pour valider, Maj+Entrée pour sauter une ligne)"
                rows={1}
                className="flex-1 resize-none overflow-hidden rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 placeholder:text-muted-foreground min-h-[2.25rem] transition-colors"
              />
              <Button
                size="sm"
                disabled={isAddingItem || !newItemTitle.trim()}
                onClick={() => handleAddItem()}
                className="flex-shrink-0"
              >
                {isAddingItem ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus size={16} />}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
