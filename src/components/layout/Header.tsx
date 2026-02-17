import { Plus, Search, Command, HelpCircle, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function Header() {
  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-4">
      {/* Left side */}
      <div className="flex items-center gap-4">
        <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus size={16} />
          <span>Create Story</span>
        </Button>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Type / for search and recents..."
            className="w-80 pl-9"
          />
          <kbd className="absolute right-3 top-1/2 hidden -translate-y-1/2 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs text-muted-foreground lg:flex">
            <Command size={12} />
            <span>K</span>
          </kbd>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" className="hidden md:flex">
          Get Started
        </Button>
        <Button variant="ghost" size="icon" className="text-muted-foreground">
          <HelpCircle size={18} />
        </Button>
        <Button variant="ghost" size="icon" className="relative text-muted-foreground">
          <Bell size={18} />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-destructive" />
        </Button>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
          E
        </div>
      </div>
    </header>
  );
}
