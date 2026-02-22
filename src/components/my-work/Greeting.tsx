"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getGreetingFr } from "@/lib/my-work/mock-data";

export function Greeting() {
  const greeting = getGreetingFr();
  const [name, setName] = useState<string>("");
  const [initial, setInitial] = useState<string>("");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      const fullName =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email ||
        "";
      setName(fullName);
      setInitial(fullName.charAt(0).toUpperCase());
    });
  }, []);

  return (
    <div className="flex items-center gap-2">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-xs font-medium text-white">
        {initial}
      </span>
      <h1 className="text-xl font-semibold">
        {greeting}{name ? `, ${name}` : ""}
      </h1>
    </div>
  );
}
