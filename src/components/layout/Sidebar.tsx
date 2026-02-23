"use client";

import { LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { ProjectList } from "@/components/projects/ProjectList";

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
            P
          </div>
          <span className="font-semibold">Projet 360</span>
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-auto py-4">
        <nav className="space-y-1 px-3">
          <NavItem
            href="/"
            icon={<LayoutDashboard size={18} />}
            label="Mon Travail"
            active={pathname === "/"}
          />
        </nav>

        {/* Projects Section */}
        <div className="mt-6">
          <ProjectList />
        </div>
      </div>

      {/* Footer - Logout only */}
      <div className="border-t py-4 px-3">
        <LogoutButton />
      </div>
    </aside>
  );
}
