"use client";

import Image from "next/image";
import { getInitials } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  name?: string | null;
  email?: string;
  avatarUrl?: string | null;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  xs: "h-5 w-5 text-[10px]",
  sm: "h-6 w-6 text-[10px]",
  md: "h-8 w-8 text-xs",
  lg: "h-16 w-16 text-xl",
};

export function UserAvatar({ name, email, avatarUrl, size = "sm", className }: UserAvatarProps) {
  const displayName = name || email?.split("@")[0] || "?";
  const initials = getInitials(displayName);

  return (
    <div
      className={cn(
        "rounded-full flex-shrink-0 overflow-hidden bg-primary flex items-center justify-center font-medium text-primary-foreground",
        sizeClasses[size],
        className
      )}
    >
      {avatarUrl ? (
        <Image
          src={avatarUrl}
          alt={displayName}
          width={64}
          height={64}
          className="h-full w-full object-cover"
          loading="lazy"
          unoptimized={!avatarUrl.includes(".supabase.co")}
        />
      ) : (
        initials
      )}
    </div>
  );
}
