import { LayoutDashboard, Folder, Plus, Settings, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/components/auth/LogoutButton";

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}

function NavItem({ href, icon, label, active }: NavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
        active
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      )}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-background">
      {/* Logo */}
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-primary text-sm font-bold text-primary-foreground">
            S
          </div>
          <span className="font-semibold">StoryFirst</span>
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-auto py-4">
        <nav className="space-y-1 px-3">
          <NavItem
            href="/"
            icon={<LayoutDashboard size={18} />}
            label="My Work"
            active={pathname === "/"}
          />
        </nav>

        {/* Projects Section */}
        <div className="mt-6 px-3">
          <div className="mb-2 flex items-center justify-between px-3">
            <span className="text-xs font-medium text-muted-foreground">
              Projects
            </span>
            <Button variant="ghost" size="icon" className="h-5 w-5">
              <Plus size={14} />
            </Button>
          </div>
          
          {/* Project list will go here */}
          <div className="space-y-1">
            <NavItem
              href="/project/demo"
              icon={<Folder size={18} />}
              label="Demo Project"
              active={pathname.startsWith("/project/demo")}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t py-4">
        <nav className="space-y-1 px-3">
          <NavItem
            href="/settings"
            icon={<Settings size={18} />}
            label="Settings"
            active={pathname === "/settings"}
          />
          <LogoutButton />
        </nav>
      </div>
    </aside>
  );
}
