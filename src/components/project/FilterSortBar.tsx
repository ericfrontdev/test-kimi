"use client";

import { Filter, ArrowUpDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import type { ProjectUser } from "./kanban/types";

export interface FilterState {
  assigneeIds: string[]; // empty = tous ; "unassigned" = sans assigné
  statuses: string[]; // empty = tous
}

export interface SortState {
  field: "priority" | "dueDate" | null;
  direction: "asc" | "desc";
}

export const DEFAULT_FILTER: FilterState = { assigneeIds: [], statuses: [] };
export const DEFAULT_SORT: SortState = { field: null, direction: "asc" };

const STATUS_OPTIONS: { id: string; label: string }[] = [
  { id: "BACKLOG", label: "Backlog" },
  { id: "TODO", label: "À faire" },
  { id: "IN_PROGRESS", label: "En cours" },
  { id: "IN_REVIEW", label: "En révision" },
  { id: "DONE", label: "Terminé" },
];

const SORT_OPTIONS: { value: string; label: string; field: "priority" | "dueDate"; direction: "asc" | "desc" }[] = [
  { value: "priority-asc", label: "Priorité : Critique d'abord", field: "priority", direction: "asc" },
  { value: "priority-desc", label: "Priorité : Basse d'abord", field: "priority", direction: "desc" },
  { value: "dueDate-asc", label: "Échéance : Proche d'abord", field: "dueDate", direction: "asc" },
  { value: "dueDate-desc", label: "Échéance : Éloignée d'abord", field: "dueDate", direction: "desc" },
];

interface FilterSortBarProps {
  projectUsers: ProjectUser[];
  filter: FilterState;
  sort: SortState;
  availableStatuses?: string[];
  onFilterChange: (f: FilterState) => void;
  onSortChange: (s: SortState) => void;
}

export function FilterSortBar({
  projectUsers,
  filter,
  sort,
  availableStatuses,
  onFilterChange,
  onSortChange,
}: FilterSortBarProps) {
  const statusOptions = availableStatuses
    ? STATUS_OPTIONS.filter((s) => availableStatuses.includes(s.id))
    : STATUS_OPTIONS;

  const activeFilterCount = filter.assigneeIds.length + filter.statuses.length;
  const activeSortValue = sort.field ? `${sort.field}-${sort.direction}` : "";

  function toggleAssignee(id: string) {
    const next = filter.assigneeIds.includes(id)
      ? filter.assigneeIds.filter((a) => a !== id)
      : [...filter.assigneeIds, id];
    onFilterChange({ ...filter, assigneeIds: next });
  }

  function toggleStatus(id: string) {
    const next = filter.statuses.includes(id)
      ? filter.statuses.filter((s) => s !== id)
      : [...filter.statuses, id];
    onFilterChange({ ...filter, statuses: next });
  }

  function handleSortChange(value: string) {
    if (value === "") {
      onSortChange(DEFAULT_SORT);
      return;
    }
    const opt = SORT_OPTIONS.find((o) => o.value === value);
    if (opt) onSortChange({ field: opt.field, direction: opt.direction });
  }

  function resetFilters() {
    onFilterChange(DEFAULT_FILTER);
  }

  const activeSortLabel = SORT_OPTIONS.find((o) => o.value === activeSortValue)?.label;

  return (
    <div className="flex items-center gap-2">
      {/* Filtrer */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 gap-1.5">
            <Filter className="h-3.5 w-3.5" />
            Filtrer
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="h-4 min-w-4 px-1 text-xs">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-52">
          <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
            Assigné
          </DropdownMenuLabel>
          <DropdownMenuCheckboxItem
            checked={filter.assigneeIds.includes("unassigned")}
            onCheckedChange={() => toggleAssignee("unassigned")}
            onSelect={(e) => e.preventDefault()}
          >
            Non assigné
          </DropdownMenuCheckboxItem>
          {projectUsers.map((user) => (
            <DropdownMenuCheckboxItem
              key={user.id}
              checked={filter.assigneeIds.includes(user.id)}
              onCheckedChange={() => toggleAssignee(user.id)}
              onSelect={(e) => e.preventDefault()}
            >
              {user.name ?? user.email}
            </DropdownMenuCheckboxItem>
          ))}

          <DropdownMenuSeparator />

          <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
            Statut
          </DropdownMenuLabel>
          {statusOptions.map((s) => (
            <DropdownMenuCheckboxItem
              key={s.id}
              checked={filter.statuses.includes(s.id)}
              onCheckedChange={() => toggleStatus(s.id)}
              onSelect={(e) => e.preventDefault()}
            >
              {s.label}
            </DropdownMenuCheckboxItem>
          ))}

          {activeFilterCount > 0 && (
            <>
              <DropdownMenuSeparator />
              <button
                onClick={resetFilters}
                className="flex w-full items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
                Réinitialiser les filtres
              </button>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Trier */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 gap-1.5">
            <ArrowUpDown className="h-3.5 w-3.5" />
            {activeSortLabel ?? "Trier"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuRadioGroup value={activeSortValue} onValueChange={handleSortChange}>
            <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
              Priorité
            </DropdownMenuLabel>
            <DropdownMenuRadioItem value="priority-asc">Critique d&apos;abord</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="priority-desc">Basse d&apos;abord</DropdownMenuRadioItem>

            <DropdownMenuSeparator />

            <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
              Date d&apos;échéance
            </DropdownMenuLabel>
            <DropdownMenuRadioItem value="dueDate-asc">Proche d&apos;abord</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="dueDate-desc">Éloignée d&apos;abord</DropdownMenuRadioItem>

            {activeSortValue && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuRadioItem value="">Aucun tri</DropdownMenuRadioItem>
              </>
            )}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

type FilterableStory = { id: string; assigneeId?: string | null; status: string; priority: number; dueDate?: string | null };

export function applyFiltersAndSort<T extends FilterableStory>(
  stories: T[],
  filter: FilterState,
  sort: SortState
): T[] {
  let result = [...stories];

  // Filtre assigné
  if (filter.assigneeIds.length > 0) {
    result = result.filter((s) => {
      const hasUnassigned = filter.assigneeIds.includes("unassigned");
      const isUnassigned = !s.assigneeId;
      if (hasUnassigned && isUnassigned) return true;
      if (s.assigneeId && filter.assigneeIds.includes(s.assigneeId)) return true;
      return false;
    });
  }

  // Filtre statut
  if (filter.statuses.length > 0) {
    result = result.filter((s) => filter.statuses.includes(s.status));
  }

  // Tri
  if (sort.field) {
    result.sort((a, b) => {
      if (sort.field === "priority") {
        // 0 = critique, 3 = basse → asc = critique d'abord
        return sort.direction === "asc"
          ? a.priority - b.priority
          : b.priority - a.priority;
      }
      if (sort.field === "dueDate") {
        // nulls en dernier dans les deux sens
        const aTime = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const bTime = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        return sort.direction === "asc" ? aTime - bTime : bTime - aTime;
      }
      return 0;
    });
  }

  return result;
}
