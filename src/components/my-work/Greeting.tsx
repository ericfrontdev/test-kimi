"use client";

import { mockUser, getGreetingFr } from "@/lib/my-work/mock-data";

export function Greeting() {
  const greeting = getGreetingFr();

  return (
    <div className="flex items-center gap-2">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-xs font-medium text-white">
        E
      </span>
      <h1 className="text-xl font-semibold">
        {greeting}, {mockUser.name} 👋
      </h1>
    </div>
  );
}
