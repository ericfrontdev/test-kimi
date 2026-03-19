"use client";

import { LayoutDashboard } from "lucide-react";
import Image from "next/image";
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

// Contenu partagé entre la sidebar desktop et le drawer mobile
export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col" onClick={onNavigate}>
      {/* Logo */}
      <div className="flex h-14 items-center border-b px-4 shrink-0">
        <Link href="/">
          <Image src="/projet360-logo.png" alt="Projet 360" width={120} height={32} className="h-8 w-auto" priority />
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

      {/* Footer */}
      <div className="border-t py-4 px-3 shrink-0">
        <LogoutButton />
      </div>
    </div>
  );
}

// Sidebar desktop — cachée sur mobile
export function Sidebar() {
  return (
    <aside className="hidden md:flex h-screen w-64 flex-col border-r bg-background">
      <SidebarContent />
    </aside>
  );
}
