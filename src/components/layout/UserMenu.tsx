"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogOut, User, UserPlus, Sun, Check, Monitor, Moon } from "lucide-react";
import { UserAvatar } from "@/components/ui/user-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import { InviteUserDialog } from "./InviteUserDialog";
import { ProfileDialog } from "./ProfileDialog";
import { useTheme } from "next-themes";

type Theme = "system" | "light" | "dark";

const themes: { value: Theme; label: string; icon: typeof Monitor }[] = [
  { value: "system", label: "Système", icon: Monitor },
  { value: "light", label: "Clair", icon: Sun },
  { value: "dark", label: "Sombre", icon: Moon },
];

export function UserMenu() {
  const router = useRouter();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null);
  const { theme, setTheme } = useTheme();
  const [themeOpen, setThemeOpen] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    fetch("/api/users/me")
      .then((r) => r.json())
      .then((data) => {
        const name = data.name || data.email?.split("@")[0] || "?";
        setUserName(name);
        setUserAvatarUrl(data.avatarUrl ?? null);
      })
      .catch(() => {});
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const currentTheme = themes.find((t) => t.value === theme) || themes[0];

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="hover:opacity-90 transition-opacity cursor-pointer"
            title={userName || "Utilisateur"}
            aria-label={userName || "Utilisateur"}
          >
            <UserAvatar name={userName} avatarUrl={userAvatarUrl} size="md" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={() => setProfileOpen(true)} className="gap-2 cursor-pointer">
            <User size={16} />
            <span>Profil</span>
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => setInviteOpen(true)} 
            className="gap-2 cursor-pointer"
          >
            <UserPlus size={16} />
            <span>Ajouter un utilisateur</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          
          {/* Theme Selector - Style Shortcut */}
          <div className="px-1 py-1">
            <div className="flex items-center justify-between px-2 py-1.5 rounded-sm hover:bg-accent cursor-pointer group">
              <div className="flex items-center gap-2">
                <Sun size={16} className="text-muted-foreground" />
                <span className="text-sm">Thème</span>
              </div>
              <DropdownMenu open={themeOpen} onOpenChange={setThemeOpen}>
                <DropdownMenuTrigger asChild>
                  <button 
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors bg-muted/50 hover:bg-muted px-2 py-0.5 rounded border"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {currentTheme.label}
                    <span className="text-[10px]">▼</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="end" 
                  side="right" 
                  sideOffset={8}
                  className="min-w-[140px]"
                  onCloseAutoFocus={(e) => e.preventDefault()}
                >
                  {themes.map((t) => (
                    <DropdownMenuItem
                      key={t.value}
                      onClick={() => {
                        setTheme(t.value);
                        setThemeOpen(false);
                      }}
                      className="flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <t.icon size={14} />
                        <span className="text-sm">{t.label}</span>
                      </div>
                      {theme === t.value && <Check size={14} className="text-primary" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="gap-2 text-destructive cursor-pointer">
            <LogOut size={16} />
            <span>Déconnexion</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <InviteUserDialog open={inviteOpen} onOpenChange={setInviteOpen} />
      <ProfileDialog
        open={profileOpen}
        onOpenChange={setProfileOpen}
        onNameUpdated={(newName) => {
          setUserName(newName);
        }}
      />
    </>
  );
}
