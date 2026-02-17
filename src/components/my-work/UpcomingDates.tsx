"use client";

import { Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function UpcomingDates() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold">
          Upcoming Due Dates
        </CardTitle>
        <select className="rounded-md border px-2 py-1 text-sm">
          <option>Everything</option>
          <option>This Week</option>
        </select>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center py-8 text-center">
        <Calendar className="mb-4 h-12 w-12 text-muted-foreground" />
        <p className="text-sm font-medium">Tout est OK</p>
        <p className="text-xs text-muted-foreground">
          Rien n'est prévu dans les 30 prochains jours.
        </p>
      </CardContent>
    </Card>
  );
}
