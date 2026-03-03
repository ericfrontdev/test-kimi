"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface ProjectTabsProps {
  children: React.ReactNode;
  defaultTab?: string;
}

const tabs = [
  { id: "description", label: "Description" },
  { id: "backlog", label: "Backlog" },
  { id: "board", label: "Board" },
];

export function ProjectTabs({ children, defaultTab = "description" }: ProjectTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);

  return (
    <div className="space-y-6">
      {/* Tabs Navigation */}
      <div className="border-b">
        <nav className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "relative pb-3 text-sm font-medium transition-colors cursor-pointer",
                activeTab === tab.id
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>{children}</div>
    </div>
  );
}

export { tabs };
