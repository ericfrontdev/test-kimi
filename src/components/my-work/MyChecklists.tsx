"use client";

import { CheckSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function MyChecklists() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold">Mes checklists</CardTitle>
        <select className="rounded-md border px-2 py-1 text-sm">
          <option>En cours</option>
          <option>Toutes</option>
        </select>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center py-8 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
          <CheckSquare className="h-6 w-6 text-blue-600" />
        </div>
        <p className="text-sm font-medium">Vous n'avez aucune checklist active</p>
        <p className="text-xs text-muted-foreground">
          Ajoutez des éléments de checklist à n'importe quelle story.
        </p>
      </CardContent>
    </Card>
  );
}
