"use client";

import { useState, useEffect } from "react";
import { Users, UserPlus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { AddMemberDialog } from "./AddMemberDialog";

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
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, [projectId]);

  async function fetchMembers() {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/members`);
      if (response.ok) {
        const data = await response.json();
        setMembers(data);
      }
    } catch (error) {
      console.error("Error fetching members:", error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users size={18} />
            Membres
            <span className="text-sm font-normal text-muted-foreground">
              ({members.length})
            </span>
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setShowAddDialog(true)}>
            <UserPlus size={16} className="mr-1" />
            Ajouter
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Chargement...</p>
          ) : members.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">
              Aucun membre
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-2 px-2 py-1 rounded-full bg-muted"
                  title={member.email}
                >
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-[10px] bg-primary text-primary-foreground">
                      {getInitials(member.name || member.email)}
                    </AvatarFallback>
                  </Avatar>
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
        onMemberAdded={fetchMembers}
      />
    </>
  );
}
