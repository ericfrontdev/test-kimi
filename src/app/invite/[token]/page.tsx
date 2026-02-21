"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Mail, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface InvitationData {
  email: string;
  projects: Array<{
    id: string;
    name: string;
    color?: string | null;
  }>;
  invitedBy: {
    name: string | null;
    email: string;
  };
}

export default function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const router = useRouter();
  const [token, setToken] = useState<string>("");
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    params.then(({ token }) => {
      setToken(token);
      fetchInvitation(token);
    });
  }, [params]);

  async function fetchInvitation(token: string) {
    try {
      const response = await fetch(`/api/invitations/${token}`);
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Invitation invalide");
      }
      
      const data = await response.json();
      setInvitation(data);
      
      // Store invitation data in sessionStorage for after auth
      sessionStorage.setItem("pendingInvitation", JSON.stringify({
        token,
        email: data.email,
      }));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Invitation invalide</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/")} className="w-full">
              Retour à l&apos;accueil
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-muted/30">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Vous avez été invité !</CardTitle>
          <CardDescription>
            {invitation?.invitedBy.name || invitation?.invitedBy.email} vous invite à rejoindre des projets sur Projet 360.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Email */}
          <div className="rounded-lg bg-muted p-3 text-center">
            <span className="text-sm text-muted-foreground">Invité en tant que</span>
            <p className="font-medium">{invitation?.email}</p>
          </div>

          {/* Projects */}
          <div className="space-y-2">
            <span className="text-sm text-muted-foreground">Projets :</span>
            <div className="space-y-2">
              {invitation?.projects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center gap-2 rounded-lg border p-2"
                >
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: project.color || "#6366f1" }}
                  />
                  <span className="text-sm font-medium">{project.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2 pt-2">
            <Button 
              onClick={() => router.push(`/register?invite=${token}`)} 
              className="w-full"
            >
              Créer un compte
            </Button>
            <Button 
              variant="outline" 
              onClick={() => router.push(`/login?invite=${token}`)} 
              className="w-full"
            >
              J&apos;ai déjà un compte
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
