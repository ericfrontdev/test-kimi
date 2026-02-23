"use client";

import { useState, useRef, useCallback } from "react";
import { cn, getInitials } from "@/lib/utils";

interface User {
  id: string;
  name: string | null;
  email: string;
}

interface MentionTextareaProps {
  value: string;
  onChange: (value: string) => void;
  users: User[];
  placeholder?: string;
  className?: string;
}

export function MentionTextarea({
  value,
  onChange,
  users,
  placeholder = "Ajouter un commentaire...",
  className,
}: MentionTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionIndex, setMentionIndex] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);

  const filteredUsers = users.filter(
    (user) =>
      user.name?.toLowerCase().includes(mentionQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  const handleInput = useCallback(
    (e: React.FormEvent<HTMLTextAreaElement>) => {
      const textarea = e.currentTarget;
      const text = textarea.value;
      const cursor = textarea.selectionStart;
      
      onChange(text);
      setCursorPosition(cursor);

      // Check if we're typing a mention
      const textBeforeCursor = text.slice(0, cursor);
      const lastAtIndex = textBeforeCursor.lastIndexOf("@");
      
      if (lastAtIndex !== -1) {
        const afterAt = textBeforeCursor.slice(lastAtIndex + 1);
        const hasSpaceAfterAt = afterAt.includes(" ");
        
        if (!hasSpaceAfterAt && afterAt.length >= 0) {
          setMentionQuery(afterAt);
          setShowMentions(true);
          setMentionIndex(0);
        } else {
          setShowMentions(false);
        }
      } else {
        setShowMentions(false);
      }
    },
    [onChange]
  );

  const insertMention = useCallback(
    (user: User) => {
      if (!textareaRef.current) return;

      const beforeCursor = value.slice(0, cursorPosition);
      const afterCursor = value.slice(cursorPosition);
      const lastAtIndex = beforeCursor.lastIndexOf("@");
      
      const newValue =
        beforeCursor.slice(0, lastAtIndex) +
        `@${user.name || user.email} ` +
        afterCursor;
      
      onChange(newValue);
      setShowMentions(false);
      
      // Focus back to textarea
      setTimeout(() => {
        textareaRef.current?.focus();
        const newCursorPos = lastAtIndex + (user.name || user.email).length + 2;
        textareaRef.current?.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    },
    [value, cursorPosition, onChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (!showMentions || filteredUsers.length === 0) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setMentionIndex((prev) =>
            prev < filteredUsers.length - 1 ? prev + 1 : prev
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setMentionIndex((prev) => (prev > 0 ? prev - 1 : 0));
          break;
        case "Enter":
          e.preventDefault();
          insertMention(filteredUsers[mentionIndex]);
          break;
        case "Escape":
          setShowMentions(false);
          break;
      }
    },
    [showMentions, filteredUsers, mentionIndex, insertMention]
  );

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={cn(
          "w-full min-h-[80px] p-3 text-sm border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-ring",
          className
        )}
      />
      
      {showMentions && filteredUsers.length > 0 && (
        <div className="absolute bottom-full left-0 mb-1 w-64 bg-popover border rounded-md shadow-lg max-h-48 overflow-y-auto z-50">
          <div className="py-1">
            <div className="px-2 py-1 text-xs text-muted-foreground">
              Mentionner un membre
            </div>
            {filteredUsers.map((user, index) => (
              <button
                key={user.id}
                onClick={() => insertMention(user)}
                className={cn(
                  "w-full px-2 py-1.5 flex items-center gap-2 text-left text-sm hover:bg-accent transition-colors",
                  index === mentionIndex && "bg-accent"
                )}
              >
                <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-[10px] font-medium text-primary-foreground">
                  {getInitials(user.name || user.email)}
                </div>
                <span className="truncate">{user.name || user.email}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function to extract mentions from text
export function extractMentions(text: string, users: User[]): string[] {
  const mentionedUserIds: string[] = [];

  for (const user of users) {
    const displayName = user.name || user.email;
    if (text.includes(`@${displayName}`)) {
      mentionedUserIds.push(user.id);
    }
  }

  return [...new Set(mentionedUserIds)]; // Remove duplicates
}
