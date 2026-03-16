"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface InvitationData {
  email: string;
  invitedBy: { name: string | null; email: string };
}

export default function SuperAdminInvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    params.then(({ token }) => {
      setToken(token);
      fetch(`/api/super-admin-invitations/${token}`)
        .then(async (r) => {
          const data = await r.json();
          if (!r.ok) throw new Error(data.error || "Invitation invalide");
          setInvitation(data);
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    });
  }, [params]);

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

  const inviterName = invitation?.invitedBy.name || invitation?.invitedBy.email;

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-muted/30">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Invitation Super Admin</CardTitle>
          <CardDescription>
            <strong>{inviterName}</strong> vous invite à rejoindre l&apos;équipe de gestion de la plateforme Projet 360.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-3 text-center">
            <span className="text-sm text-muted-foreground">Invité en tant que</span>
            <p className="font-medium">{invitation?.email}</p>
          </div>

          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm text-center text-primary font-medium">
            Accès Super Admin — tous les projets de la plateforme
          </div>

          <div className="space-y-2 pt-2">
            <Button
              onClick={() => router.push(`/register?superadmin=${token}`)}
              className="w-full"
            >
              Créer un compte
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push(`/login?superadmin=${token}`)}
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
