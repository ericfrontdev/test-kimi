import { Search, Command, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NotificationBell } from "./NotificationBell";
import { UserMenu } from "./UserMenu";

export function Header() {
  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-4">
      {/* Left side - Search only */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            className="w-80 pl-9"
          />
          <kbd className="absolute right-3 top-1/2 hidden -translate-y-1/2 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs text-muted-foreground lg:flex">
            <Command size={12} />
            <span>K</span>
          </kbd>
        </div>
      </div>

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
