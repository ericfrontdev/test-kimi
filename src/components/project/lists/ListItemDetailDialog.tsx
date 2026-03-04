"use client";

import { useState, useEffect, useRef } from "react";
import { Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { cn } from "@/lib/utils";
import { useProjectListStore, type ListItem } from "@/stores/project-list";

interface ListItemDetailDialogProps {
  item: ListItem | null;
  listId: string;
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ListItemDetailDialog({
  item,
  listId,
  projectId,
  open,
  onOpenChange,
}: ListItemDetailDialogProps) {
  const updateListItem = useProjectListStore((s) => s.updateListItem);
  const removeListItem = useProjectListStore((s) => s.removeListItem);

  const [titleValue, setTitleValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open && item) {
      setTitleValue(item.title);
      setTimeout(() => textareaRef.current?.select(), 0);
    }
  }, [open, item]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [titleValue]);

  async function handleSave() {
    if (!item || !titleValue.trim() || titleValue.trim() === item.title) return;
    const newTitle = titleValue.trim();
    updateListItem(listId, item.id, { title: newTitle });
    try {
      await fetch(`/api/projects/${projectId}/lists/${listId}/items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle }),
      });
    } catch {
      updateListItem(listId, item.id, { title: item.title });
    }
  }

  async function handleToggleStatus() {
    if (!item) return;
    const newStatus = item.status === "DONE" ? "TODO" : "DONE";
    updateListItem(listId, item.id, { status: newStatus });
    try {
      await fetch(`/api/projects/${projectId}/lists/${listId}/items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch {
      updateListItem(listId, item.id, { status: item.status });
    }
  }

  async function handleDelete() {
    if (!item) return;
    removeListItem(listId, item.id);
    onOpenChange(false);
    await fetch(`/api/projects/${projectId}/lists/${listId}/items/${item.id}`, {
      method: "DELETE",
    });
  }

  function handleOpenChange(newOpen: boolean) {
    if (!newOpen) handleSave();
    onOpenChange(newOpen);
  }

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <VisuallyHidden>
          <DialogTitle>Détail de l&apos;item</DialogTitle>
        </VisuallyHidden>

        <div className="space-y-4 pt-2">
          {/* Status + textarea */}
          <div className="flex items-start gap-3">
            <Checkbox
              checked={item.status === "DONE"}
              onCheckedChange={handleToggleStatus}
              className="mt-1.5 flex-shrink-0"
            />
            <textarea
              ref={textareaRef}
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => { setIsFocused(false); handleSave(); }}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setTitleValue(item.title);
                  onOpenChange(false);
                }
              }}
              className={cn(
                "flex-1 resize-none overflow-hidden bg-transparent text-sm font-medium leading-relaxed outline-none placeholder:text-muted-foreground",
                item.status === "DONE" && "line-through text-muted-foreground"
              )}
              placeholder="Titre de l'item..."
              rows={1}
              autoFocus
            />
          </div>

          {/* Footer */}
          <div className={cn("flex justify-end border-t pt-3 transition-colors", isFocused && "border-purple-500")}>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleDelete}
            >
              <Trash2 size={14} className="mr-1.5" />
              Supprimer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
