"use client";

import { useState, useEffect } from "react";
import { X, UserPlus, Loader2, Search, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn, getInitials } from "@/lib/utils";

interface User {
  id: string;
  name: string | null;
  email: string;
  avatarUrl?: string | null;
}

interface AddMemberDialogProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMemberAdded?: () => void;
}

export function AddMemberDialog({ 
  projectId, 
  open, 
  onOpenChange,
  onMemberAdded 
}: AddMemberDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [existingMembers, setExistingMembers] = useState<string[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Fetch existing members when dialog opens
  useEffect(() => {
    if (open && projectId) {
      fetchExistingMembers();
      setSearchQuery("");
      setUsers([]);
      setSelectedUserId(null);
      setError(null);
      setSuccess(false);
    }
  }, [open, projectId]);

  async function fetchExistingMembers() {
    try {
      const response = await fetch(`/api/projects/${projectId}/members`);
      if (response.ok) {
        const data = await response.json();
        setExistingMembers(data.map((m: User) => m.id));
      }
    } catch (error) {
      console.error("Error fetching existing members:", error);
    }
  }

  async function searchUsers() {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setError(null);
    
    try {
      // Search users via API
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`);
      if (response.ok) {
        const data = await response.json();
        // Filter out existing members
        const filtered = data.filter((u: User) => !existingMembers.includes(u.id));
        setUsers(filtered);
      } else {
        setError("Erreur lors de la recherche");
      }
    } catch (error) {
      console.error("Error searching users:", error);
      setError("Erreur réseau");
    } finally {
      setIsSearching(false);
    }
  }

  async function addMember() {
    if (!selectedUserId) return;
    
    setIsAdding(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/projects/${projectId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUserId,
          role: "MEMBER",
        }),
      });
      
      if (response.ok) {
        setSuccess(true);
        onMemberAdded?.();
        setTimeout(() => {
          onOpenChange(false);
        }, 1500);
      } else {
        const data = await response.json();
        setError(data.error || "Erreur lors de l'ajout");
      }
    } catch (error) {
      console.error("Error adding member:", error);
      setError("Erreur réseau");
    } finally {
      setIsAdding(false);
    }
  }

  // Handle Enter key in search
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      searchUsers();
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus size={20} />
            Ajouter un membre
          </DialogTitle>
          <DialogDescription>
            Recherchez un utilisateur existant pour l'ajouter au projet
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Search */}
          <div className="flex gap-2">
            <Input
              placeholder="Nom, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isAdding || success}
            />
            <Button
              variant="outline"
              onClick={searchUsers}
              disabled={!searchQuery.trim() || isSearching || isAdding || success}
            >
              {isSearching ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Search size={16} />
              )}
            </Button>
          </div>

          {/* Results */}
          {users.length > 0 && !success && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {users.length} utilisateur(s) trouvé(s)
              </p>
              <div className="max-h-48 overflow-y-auto border rounded-md divide-y">
                {users.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => setSelectedUserId(user.id)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 text-left hover:bg-muted transition-colors",
                      selectedUserId === user.id && "bg-primary/10"
                    )}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                        {getInitials(user.name || user.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {user.name || "Sans nom"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user.email}
                      </p>
                    </div>
                    {selectedUserId === user.id && (
                      <Check size={16} className="text-primary" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* No results */}
          {searchQuery && !isSearching && users.length === 0 && !success && (
            <div className="text-center py-4 text-muted-foreground">
              <p className="text-sm">Aucun utilisateur trouvé</p>
              <p className="text-xs mt-1">
                L'utilisateur doit avoir un compte pour être ajouté
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
              {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="flex items-center justify-center gap-2 py-4 text-green-600">
              <Check size={20} />
              <span>Membre ajouté avec succès !</span>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isAdding}
          >
            Annuler
          </Button>
          <Button
            onClick={addMember}
            disabled={!selectedUserId || isAdding || success}
          >
            {isAdding ? (
              <>
                <Loader2 size={16} className="mr-1 animate-spin" />
                Ajout...
              </>
            ) : (
              "Ajouter au projet"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
