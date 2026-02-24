"use client";

import useSWR from "swr";
import { useState } from "react";
import { Users, UserPlus, AlertCircle, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserAvatar } from "@/components/ui/user-avatar";
import { AddMemberDialog } from "./AddMemberDialog";
import { fetcher } from "@/lib/fetcher";
import { useProjectStore } from "@/stores/project";

interface Member {
  id: string;
  name: string | null;
  email: string;
  avatarUrl?: string | null;
  role: "ADMIN" | "MEMBER";
  isOwner: boolean;
}

interface ProjectMembersCardProps {
  projectId: string;
}

export function ProjectMembersCard({ projectId }: ProjectMembersCardProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const userRole = useProjectStore((s) => s.userRole);

  const {
    data: members,
    error,
    isLoading,
    mutate,
  } = useSWR<Member[]>(`/api/projects/${projectId}/members`, fetcher);

  async function handleRoleChange(userId: string, role: "ADMIN" | "MEMBER") {
    mutate(
      (prev) => prev?.map((m) => m.id === userId ? { ...m, role } : m),
      false
    );
    await fetch(`/api/projects/${projectId}/members`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role }),
    });
    mutate();
  }

  async function handleRemove(userId: string) {
    mutate((prev) => prev?.filter((m) => m.id !== userId), false);
    await fetch(`/api/projects/${projectId}/members?userId=${userId}`, {
      method: "DELETE",
    });
    mutate();
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users size={18} />
            Membres
            {members && (
              <span className="text-sm font-normal text-muted-foreground">
                ({members.length})
              </span>
            )}
          </CardTitle>
          {userRole !== "MEMBER" && (
            <Button variant="ghost" size="sm" onClick={() => setShowAddDialog(true)}>
              <UserPlus size={16} className="mr-1" />
              Ajouter
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Chargement...</p>
          ) : error ? (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle size={14} />
              Impossible de charger les membres
            </div>
          ) : !members || members.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">Aucun membre</p>
          ) : (
            <div className="space-y-2">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/50"
                >
                  <UserAvatar name={member.name} email={member.email} avatarUrl={member.avatarUrl} size="sm" />
                  <span className="text-sm truncate flex-1 min-w-0" title={member.email}>
                    {member.name || member.email}
                  </span>

                  {/* Role badge */}
                  {member.isOwner ? (
                    <Badge variant="default" className="text-xs shrink-0">Propriétaire</Badge>
                  ) : member.role === "ADMIN" ? (
                    <Badge variant="secondary" className="text-xs shrink-0">Admin</Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs shrink-0">Membre</Badge>
                  )}

                  {/* Role select — owner only, not for the owner member */}
                  {userRole === "OWNER" && !member.isOwner && (
                    <Select
                      value={member.role}
                      onValueChange={(value) => handleRoleChange(member.id, value as "ADMIN" | "MEMBER")}
                    >
                      <SelectTrigger className="h-7 w-24 text-xs shrink-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                        <SelectItem value="MEMBER">Membre</SelectItem>
                      </SelectContent>
                    </Select>
                  )}

                  {/* Remove button — admin+ only, not for the owner */}
                  {userRole !== "MEMBER" && !member.isOwner && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
                      title="Retirer du projet"
                      onClick={() => handleRemove(member.id)}
                    >
                      <X size={13} />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AddMemberDialog
        projectId={projectId}
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onMemberAdded={() => mutate()}
      />
    </>
  );
}
