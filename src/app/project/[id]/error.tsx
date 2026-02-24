"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ProjectError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[ProjectError]", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-20 text-center">
      <AlertCircle className="h-10 w-10 text-destructive" />
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Impossible de charger ce projet</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          {error.message || "Une erreur inattendue est survenue. Veuillez réessayer."}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="outline" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour au dashboard
          </Link>
        </Button>
        <Button onClick={reset}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Réessayer
        </Button>
      </div>
    </div>
  );
}
