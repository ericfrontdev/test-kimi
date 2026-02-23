"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/ui/user-avatar";

const priorities = [
  { value: "0", label: "P0 - Critique", color: "bg-red-500" },
  { value: "1", label: "P1 - Haute", color: "bg-orange-500" },
  { value: "2", label: "P2 - Normale", color: "bg-blue-500" },
  { value: "3", label: "P3 - Basse", color: "bg-slate-400" },
];

const storyStatuses = [
  { value: "BACKLOG", label: "Backlog" },
  { value: "TODO", label: "À faire" },
  { value: "IN_PROGRESS", label: "En cours" },
  { value: "IN_REVIEW", label: "En révision" },
  { value: "DONE", label: "Terminé" },
];

interface User {
  id: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
}

interface StoryMetadataPanelProps {
  type: "FEATURE" | "FIX";
  setType: (type: "FEATURE" | "FIX") => void;
  status: string;
  setStatus: (status: string) => void;
  priority: string;
  setPriority: (priority: string) => void;
  assignee: string;
  setAssignee: (assignee: string) => void;
  dueDate: string;
  setDueDate: (date: string) => void;
  labels: string[];
  setLabels: (labels: string[]) => void;
  newLabel: string;
  setNewLabel: (label: string) => void;
}

export function StoryMetadataPanel({
  type,
  setType,
  status,
  setStatus,
  priority,
  setPriority,
  assignee,
  setAssignee,
  dueDate,
  setDueDate,
  labels,
  setLabels,
  newLabel,
  setNewLabel,
}: StoryMetadataPanelProps) {
  const { data: users = [], isLoading: loading } = useSWR<User[]>("/api/users", fetcher);

  function handleAddLabel() {
    if (!newLabel.trim() || labels.includes(newLabel.trim())) return;
    setLabels([...labels, newLabel.trim()]);
    setNewLabel("");
  }

  function handleRemoveLabel(label: string) {
    setLabels(labels.filter((l) => l !== label));
  }

  const selectedUser = users.find((u) => u.id === assignee);

  return (
    <div className="w-80 border-l bg-muted/30 p-8 space-y-5 overflow-y-auto">
      {/* Type */}
      <div>
        <Label className="text-xs text-muted-foreground uppercase">Type</Label>
        <Select value={type} onValueChange={(v) => setType(v as "FEATURE" | "FIX")}>
          <SelectTrigger className="mt-1 bg-background">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="FEATURE">Feature</SelectItem>
            <SelectItem value="FIX">Fix</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Status */}
      <div>
        <Label className="text-xs text-muted-foreground uppercase">Statut</Label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="mt-1 bg-background">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {storyStatuses.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Priority */}
      <div>
        <Label className="text-xs text-muted-foreground uppercase">Priorité</Label>
        <Select value={priority} onValueChange={setPriority}>
          <SelectTrigger className="mt-1 bg-background">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {priorities.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                <div className="flex items-center gap-2">
                  <span className={cn("w-2 h-2 rounded-full", p.color)} />
                  {p.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Assignee */}
      <div>
        <Label className="text-xs text-muted-foreground uppercase">Assignée à</Label>
        <Select value={assignee || "unassigned"} onValueChange={(v) => setAssignee(v === "unassigned" ? "" : v)}>
          <SelectTrigger className="mt-1 bg-background">
            <SelectValue placeholder="Non assignée" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="unassigned">Non assignée</SelectItem>
            {loading ? (
              <SelectItem value="loading" disabled>Chargement...</SelectItem>
            ) : (
              users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  <div className="flex items-center gap-2">
                    <UserAvatar name={user.name} email={user.email} avatarUrl={user.avatarUrl} size="xs" />
                    <span>{user.name || user.email}</span>
                  </div>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Due Date */}
      <div>
        <Label className="text-xs text-muted-foreground uppercase">Date d'échéance</Label>
        <Input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="mt-1 bg-background"
        />
      </div>

      {/* Labels */}
      <div>
        <Label className="text-xs text-muted-foreground uppercase">Labels</Label>
        <div className="mt-1 space-y-2">
          <div className="flex flex-wrap gap-1">
            {labels.map((label) => (
              <Badge
                key={label}
                variant="secondary"
                className="cursor-pointer hover:bg-destructive/20"
                onClick={() => handleRemoveLabel(label)}
              >
                {label} <X size={12} className="ml-1" />
              </Badge>
            ))}
          </div>
          <div className="flex gap-1">
            <Input
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Nouveau label"
              className="h-8 text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddLabel();
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 px-2"
              onClick={handleAddLabel}
            >
              <Plus size={14} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
