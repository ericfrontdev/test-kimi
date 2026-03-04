"use client";

import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "./NotificationBell";
import { UserMenu } from "./UserMenu";
import { SearchTrigger } from "@/components/search/SearchDialog";

export function Header() {
  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-4">
      {/* Left side - Search */}
      <SearchTrigger />

      {/* Right side */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="text-muted-foreground">
          <HelpCircle size={18} />
        </Button>
        <NotificationBell />
        <UserMenu />
      </div>
    </header>
  );
}
