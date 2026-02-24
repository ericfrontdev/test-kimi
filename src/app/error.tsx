"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 text-center">
      <AlertCircle className="h-12 w-12 text-destructive" />
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Une erreur inattendue est survenue</h2>
        <p className="text-sm text-muted-foreground max-w-md">
          {error.message || "Quelque chose s'est mal passé. Veuillez réessayer."}
        </p>
      </div>
      <Button onClick={reset}>
        <RefreshCw className="h-4 w-4 mr-2" />
        Réessayer
      </Button>
    </div>
  );
}
