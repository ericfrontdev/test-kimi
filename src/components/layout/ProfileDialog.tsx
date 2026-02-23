"use client";

import { useState, useEffect, useRef } from "react";
import { Loader2, Camera, ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { getInitials } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface Project {
  id: string;
  name: string;
  color: string | null;
  role: "OWNER" | "MEMBER";
}

interface ProfileData {
  id: string;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
  createdAt: string | null;
  projects: Project[];
}

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNameUpdated?: (name: string) => void;
}

export function ProfileDialog({ open, onOpenChange, onNameUpdated }: ProfileDialogProps) {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Name edit
  const [name, setName] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);

  // Password change
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSaved, setPasswordSaved] = useState(false);

  // Avatar upload
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setIsLoading(true);
    fetch("/api/users/me")
      .then((r) => r.json())
      .then((data: ProfileData) => {
        setProfile(data);
        setName(data.name ?? "");
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [open]);

  async function handleSaveName() {
    if (!name.trim() || name.trim() === profile?.name) return;
    setIsSavingName(true);
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (res.ok) {
        const updated = await res.json();
        setProfile((prev) => prev ? { ...prev, name: updated.name } : prev);
        setNameSaved(true);
        setTimeout(() => setNameSaved(false), 3000);
        onNameUpdated?.(updated.name);
        router.refresh();
      }
    } finally {
      setIsSavingName(false);
    }
  }

  async function handleSavePassword() {
    setPasswordError(null);
    if (newPassword.length < 6) {
      setPasswordError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Les mots de passe ne correspondent pas.");
      return;
    }
    setIsSavingPassword(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        setPasswordError(error.message);
      } else {
        setPasswordSaved(true);
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => setPasswordSaved(false), 3000);
      }
    } finally {
      setIsSavingPassword(false);
    }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    setIsUploadingAvatar(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop();
      const path = `${profile.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);

      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: publicUrl }),
      });
      if (res.ok) {
        setProfile((prev) => prev ? { ...prev, avatarUrl: publicUrl } : prev);
        router.refresh();
      }
    } catch {
      // silently fail — storage may not be configured
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const displayName = profile?.name ?? profile?.email ?? "?";
  const initials = getInitials(displayName);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Mon profil</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : profile ? (
          <div className="space-y-6">
            {/* Avatar + identité */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="h-16 w-16 rounded-full overflow-hidden bg-primary flex items-center justify-center text-xl font-semibold text-primary-foreground">
                  {profile.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={profile.avatarUrl} alt={displayName} className="h-full w-full object-cover" />
                  ) : (
                    initials
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                  className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-background border flex items-center justify-center hover:bg-muted transition-colors"
                  title="Changer la photo"
                >
                  {isUploadingAvatar ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Camera className="h-3 w-3" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>
              <div>
                <p className="font-semibold">{displayName}</p>
                <p className="text-sm text-muted-foreground">{profile.email}</p>
                {profile.createdAt && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Membre depuis {new Date(profile.createdAt).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
                  </p>
                )}
              </div>
            </div>

            <Separator />

            {/* Modifier le nom */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Nom d&apos;affichage</h3>
              <div className="flex gap-2">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Votre nom"
                  onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                />
                <Button
                  size="sm"
                  onClick={handleSaveName}
                  disabled={isSavingName || !name.trim() || name.trim() === profile.name}
                >
                  {isSavingName ? <Loader2 className="h-4 w-4 animate-spin" /> : nameSaved ? "Sauvegardé ✓" : "Sauvegarder"}
                </Button>
              </div>
            </div>

            <Separator />

            {/* Changer le mot de passe */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Mot de passe</h3>
              <div className="space-y-2">
                <div className="space-y-1">
                  <Label htmlFor="new-password" className="text-xs text-muted-foreground">Nouveau mot de passe</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="6 caractères minimum"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="confirm-password" className="text-xs text-muted-foreground">Confirmer</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Répéter le mot de passe"
                    onKeyDown={(e) => e.key === "Enter" && handleSavePassword()}
                  />
                </div>
                {passwordError && (
                  <p className="text-xs text-destructive">{passwordError}</p>
                )}
                <Button
                  size="sm"
                  onClick={handleSavePassword}
                  disabled={isSavingPassword || !newPassword || !confirmPassword}
                >
                  {isSavingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : passwordSaved ? "Modifié ✓" : "Changer le mot de passe"}
                </Button>
              </div>
            </div>

            <Separator />

            {/* Projets */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium">
                Mes projets
                <span className="ml-2 text-muted-foreground font-normal">({profile.projects.length})</span>
              </h3>
              {profile.projects.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun projet</p>
              ) : (
                <div className="space-y-2">
                  {profile.projects.map((project) => (
                    <div
                      key={project.id}
                      className="flex items-center justify-between rounded-md border px-3 py-2 hover:bg-muted/50 transition-colors cursor-pointer group"
                      onClick={() => { router.push(`/project/${project.id}`); onOpenChange(false); }}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: project.color ?? "#6366f1" }}
                        />
                        <span className="text-sm font-medium">{project.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={project.role === "OWNER" ? "default" : "secondary"} className="text-xs">
                          {project.role === "OWNER" ? "Propriétaire" : "Membre"}
                        </Badge>
                        <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
