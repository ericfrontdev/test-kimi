"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Folder, MoreHorizontal, Pencil, Trash } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useProjectsStore } from "@/stores/projects";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CreateProjectDialog } from "./CreateProjectDialog";

export function ProjectList() {
  const pathname = usePathname();
  const { projects, isLoading, fetchProjects, deleteProject } = useProjectsStore();

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  if (isLoading) {
    return (
      <div className="px-3 py-2 text-sm text-muted-foreground">
        Chargement...
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="px-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">
            Projects
          </span>
          <CreateProjectDialog />
        </div>
        <p className="px-3 text-xs text-muted-foreground">
          Aucun projet. Créez-en un !
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1 px-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          Projects
        </span>
        <CreateProjectDialog />
      </div>
      {projects.map((project) => (
        <div
          key={project.id}
          className="group flex items-center justify-between"
        >
          <Link
            href={`/project/${project.id}`}
            className={cn(
              "flex flex-1 items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
              pathname.startsWith(`/project/${project.id}`)
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Folder size={16} />
            <span className="truncate">{project.name}</span>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-accent rounded">
                <MoreHorizontal size={14} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Pencil size={14} className="mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => deleteProject(project.id)}
              >
                <Trash size={14} className="mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ))}
    </div>
  );
}
