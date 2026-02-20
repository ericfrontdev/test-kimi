"use client";

import { useState, useEffect } from "react";
import { X, UserPlus, Loader2, Check, Copy } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

interface Project {
  id: string;
  name: string;
  color?: string | null;
}

interface InvitationResult {
  email: string;
  status: string;
  inviteLink?: string;
  emailSent?: boolean;
  emailError?: string;
}

interface InviteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteUserDialog({ open, onOpenChange }: InviteUserDialogProps) {
  const [emails, setEmails] = useState<string[]>([]);
  const [currentEmail, setCurrentEmail] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<InvitationResult[] | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchProjects();
      resetForm();
    }
  }, [open]);

  function resetForm() {
    setEmails([]);
    setCurrentEmail("");
    setSelectedProjects([]);
    setError(null);
    setResults(null);
  }

  async function fetchProjects() {
    setIsLoading(true);
    try {
      const response = await fetch("/api/projects");
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setIsLoading(false);
    }
  }

  function handleAddEmail() {
    const email = currentEmail.trim().toLowerCase();
    if (!email) return;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Email invalide");
      return;
    }
    
    if (emails.includes(email)) {
      setError("Cet email est déjà ajouté");
      return;
    }
    
    setEmails([...emails, email]);
    setCurrentEmail("");
    setError(null);
  }

  function handleRemoveEmail(email: string) {
    setEmails(emails.filter((e) => e !== email));
  }

  function toggleProject(projectId: string) {
    setSelectedProjects((prev) =>
      prev.includes(projectId)
        ? prev.filter((id) => id !== projectId)
        : [...prev, projectId]
    );
  }

  async function handleSubmit() {
    if (emails.length === 0) {
      setError("Ajoutez au moins un email");
      return;
    }
    if (selectedProjects.length === 0) {
      setError("Sélectionnez au moins un projet");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      console.log("Sending invitation request:", { emails, projectIds: selectedProjects });
      
      const response = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emails,
          projectIds: selectedProjects,
        }),
      });

      const text = await response.text();
      console.log("Raw response:", text);
      
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = { error: "Réponse invalide du serveur" };
      }

      if (response.ok) {
        setResults(data.results);
      } else {
        setError(data.error || data.details || `Erreur ${response.status}`);
      }
    } catch (error: any) {
      console.error("Error:", error);
      setError(`Erreur: ${error?.message || "Erreur réseau"}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function copyLink(link: string) {
    try {
      await navigator.clipboard.writeText(link);
      setCopiedLink(link);
      setTimeout(() => setCopiedLink(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = link;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopiedLink(link);
      setTimeout(() => setCopiedLink(null), 2000);
    }
  }

  function closeAndReset() {
    onOpenChange(false);
    resetForm();
  }

  // Show results view
  if (results) {
    const allSent = results.every(r => r.emailSent);
    const hasErrors = results.some(r => !r.emailSent);
    
    return (
      <Dialog open={open} onOpenChange={closeAndReset}>
        <DialogContent className="max-w-md">
          <DialogHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <DialogTitle>Les invitations ont bien été envoyées</DialogTitle>
            <DialogDescription>
              {results.length} invitation{results.length > 1 && 's'} envoyée{results.length > 1 && 's'} par email
            </DialogDescription>
          </DialogHeader>

          {hasErrors && (
            <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
              Certaines invitations n&apos;ont pas pu être envoyées par email. 
              Les liens sont disponibles ci-dessous.
            </div>
          )}

          <div className="space-y-2 py-2 max-h-48 overflow-y-auto">
            {results.map((result) => (
              <div key={result.email} className="flex items-center justify-between rounded-lg border p-3">
                <span className="text-sm">{result.email}</span>
                <div className="flex items-center gap-2">
                  {!result.emailSent && result.inviteLink && (
                    <Button
                      size="sm"
                      variant={copiedLink === result.inviteLink ? "default" : "ghost"}
                      onClick={() => copyLink(result.inviteLink!)}
                      className={copiedLink === result.inviteLink ? "bg-green-100 text-green-700 hover:bg-green-200" : ""}
                    >
                      {copiedLink === result.inviteLink ? (
                        <>
                          <Check size={14} className="mr-1" />
                          Copié
                        </>
                      ) : (
                        <Copy size={14} />
                      )}
                    </Button>
                  )}
                  <Badge 
                    variant={result.emailSent ? "default" : "secondary"}
                    className={result.emailSent ? "bg-green-100 text-green-700 hover:bg-green-100" : ""}
                  >
                    {result.emailSent ? "Envoyé" : "Lien copiable"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center">
            <Button onClick={closeAndReset}>Fermer</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus size={20} />
            Ajouter un nouvel utilisateur
          </DialogTitle>
          <DialogDescription>
            Invitez des utilisateurs à rejoindre vos projets
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Emails */}
          <div className="space-y-2">
            <Label>Adresses email</Label>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="exemple@email.com"
                value={currentEmail}
                onChange={(e) => setCurrentEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddEmail();
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAddEmail}
                disabled={!currentEmail.trim()}
              >
                Ajouter
              </Button>
            </div>
            
            {emails.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {emails.map((email) => (
                  <Badge
                    key={email}
                    variant="secondary"
                    className="cursor-pointer hover:bg-destructive/20"
                    onClick={() => handleRemoveEmail(email)}
                  >
                    {email}
                    <X size={12} className="ml-1" />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Projects */}
          <div className="space-y-2">
            <Label>Projets ({selectedProjects.length} sélectionné{selectedProjects.length !== 1 && 's'})</Label>
            {isLoading ? (
              <div className="text-sm text-muted-foreground">Chargement...</div>
            ) : projects.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                Aucun projet disponible
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-2">
                {projects.map((project) => (
                  <label
                    key={project.id}
                    className="flex items-center gap-3 p-2 hover:bg-muted rounded cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedProjects.includes(project.id)}
                      onCheckedChange={() => toggleProject(project.id)}
                    />
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: project.color || "#6366f1" }}
                    />
                    <span className="flex-1 text-sm">{project.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
              {error}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <span className="text-xs text-muted-foreground self-center mr-auto">
            {emails.length} email(s), {selectedProjects.length} projet(s)
          </span>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || emails.length === 0 || selectedProjects.length === 0}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="mr-1 animate-spin" />
                Création...
              </>
            ) : (
              `Créer les invitations`
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
