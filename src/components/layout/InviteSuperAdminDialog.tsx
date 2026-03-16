"use client";

import { useState } from "react";
import { Shield, X, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface InviteResult {
  email: string;
  status: "invited" | "promoted" | "already_pending" | "error";
  inviteLink?: string;
  emailSent?: boolean;
  error?: string;
}

interface InviteSuperAdminDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteSuperAdminDialog({ open, onOpenChange }: InviteSuperAdminDialogProps) {
  const [email, setEmail] = useState("");
  const [emails, setEmails] = useState<string[]>([]);
  const [results, setResults] = useState<InviteResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  function handleAddEmail() {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return;
    if (emails.includes(trimmed)) return;
    setEmails((prev) => [...prev, trimmed]);
    setEmail("");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddEmail();
    }
  }

  function removeEmail(em: string) {
    setEmails((prev) => prev.filter((e) => e !== em));
  }

  async function handleSubmit() {
    if (emails.length === 0) return;
    setLoading(true);

    const newResults: InviteResult[] = [];
    for (const em of emails) {
      try {
        const res = await fetch("/api/super-admin-invitations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: em }),
        });
        const data = await res.json();
        if (!res.ok) {
          newResults.push({ email: em, status: "error", error: data.error });
        } else {
          newResults.push({ email: em, status: data.status, inviteLink: data.inviteLink, emailSent: data.emailSent });
        }
      } catch {
        newResults.push({ email: em, status: "error", error: "Erreur réseau" });
      }
    }

    setResults(newResults);
    setEmails([]);
    setLoading(false);
  }

  function copyLink(link: string) {
    navigator.clipboard.writeText(link);
    setCopiedLink(link);
    setTimeout(() => setCopiedLink(null), 2000);
  }

  function handleClose() {
    setEmail("");
    setEmails([]);
    setResults([]);
    setCopiedLink(null);
    onOpenChange(false);
  }

  const statusLabel = (r: InviteResult) => {
    if (r.status === "promoted") return <span className="text-emerald-600 text-sm font-medium">Promu super admin ✓</span>;
    if (r.status === "already_pending") return <span className="text-amber-600 text-sm">Invitation déjà en cours</span>;
    if (r.status === "error") return <span className="text-destructive text-sm">{r.error}</span>;
    if (r.emailSent) return <span className="text-emerald-600 text-sm">Email envoyé ✓</span>;
    return <span className="text-amber-600 text-sm">Email non envoyé — lien disponible</span>;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Shield size={20} className="text-primary" />
            <DialogTitle>Inviter un super admin</DialogTitle>
          </div>
          <DialogDescription>
            Invitez une personne à rejoindre la plateforme en tant que super admin.
          </DialogDescription>
        </DialogHeader>

        {results.length === 0 ? (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Adresse email</Label>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="exemple@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1"
                />
                <Button type="button" variant="outline" onClick={handleAddEmail}>
                  Ajouter
                </Button>
              </div>
            </div>

            {emails.length > 0 && (
              <div className="space-y-1">
                {emails.map((em) => (
                  <div key={em} className="flex items-center justify-between rounded-md border px-3 py-1.5 text-sm">
                    <span>{em}</span>
                    <button onClick={() => removeEmail(em)} className="text-muted-foreground hover:text-foreground">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={handleClose}>Annuler</Button>
              <Button onClick={handleSubmit} disabled={emails.length === 0 || loading}>
                {loading ? "Envoi..." : `Envoyer ${emails.length > 0 ? `(${emails.length})` : ""}`}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3 py-2">
            {results.map((r) => (
              <div key={r.email} className="rounded-md border p-3 space-y-1">
                <p className="text-sm font-medium">{r.email}</p>
                {statusLabel(r)}
                {r.inviteLink && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1.5 text-xs text-muted-foreground px-2"
                    onClick={() => copyLink(r.inviteLink!)}
                  >
                    {copiedLink === r.inviteLink ? <Check size={12} /> : <Copy size={12} />}
                    {copiedLink === r.inviteLink ? "Copié" : "Copier le lien"}
                  </Button>
                )}
              </div>
            ))}
            <div className="flex justify-end pt-2">
              <Button onClick={handleClose}>Fermer</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
