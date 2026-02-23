"use client";

import useSWR from "swr";
import { useState } from "react";
import { Users, UserPlus, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/user-avatar";
import { AddMemberDialog } from "./AddMemberDialog";
import { fetcher } from "@/lib/fetcher";

interface Member {
  id: string;
  name: string | null;
  email: string;
  avatarUrl?: string | null;
}

interface ProjectMembersCardProps {
  projectId: string;
}

export function ProjectMembersCard({ projectId }: ProjectMembersCardProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);

  const {
    data: members,
    error,
    isLoading,
    mutate,
  } = useSWR<Member[]>(`/api/projects/${projectId}/members`, fetcher);

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
          <Button variant="ghost" size="sm" onClick={() => setShowAddDialog(true)}>
            <UserPlus size={16} className="mr-1" />
            Ajouter
          </Button>
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
            <div className="flex flex-wrap gap-2">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-2 px-2 py-1 rounded-full bg-muted"
                  title={member.email}
                >
                  <UserAvatar name={member.name} email={member.email} avatarUrl={member.avatarUrl} size="sm" />
                  <span className="text-sm truncate max-w-[120px]">
                    {member.name || member.email}
                  </span>
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
