"use client";

import { useState, useRef, useCallback } from "react";
import { Bold, Italic, List, ListOrdered, CheckSquare, Quote, Code, Link, Heading1, Heading2, Heading3, Eye, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sanitizeHtml } from "@/lib/sanitize";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onConvertToSubtasks?: (items: string[]) => void;
  storyType?: "FEATURE" | "FIX";
}

export function MarkdownEditor({ 
  value, 
  onChange, 
  placeholder,
  onConvertToSubtasks,
  storyType = "FEATURE"
}: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [selectedText, setSelectedText] = useState("");
  const [selectionRange, setSelectionRange] = useState<{ start: number; end: number } | null>(null);

  const insertText = useCallback((before: string, after: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    
    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end);
    onChange(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  }, [value, onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Tab") {
      e.preventDefault();
      insertText("  ");
    }
  }, [insertText]);

  const handleSelectionChange = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.substring(start, end);
    
    setSelectedText(selected);
    setSelectionRange({ start, end });
  }, [value]);

  const toolbarItems = [
    { icon: Bold, action: () => insertText("**", "**"), title: "Gras" },
    { icon: Italic, action: () => insertText("*", "*"), title: "Italique" },
    { icon: Heading1, action: () => insertText("# "), title: "Titre 1" },
    { icon: Heading2, action: () => insertText("## "), title: "Titre 2" },
    { icon: Heading3, action: () => insertText("### "), title: "Titre 3" },
    null,
    { icon: List, action: () => insertText("- "), title: "Liste à puces" },
    { icon: ListOrdered, action: () => insertText("1. "), title: "Liste numérotée" },
    { icon: CheckSquare, action: () => insertText("- [ ] "), title: "Checklist" },
    null,
    { icon: Quote, action: () => insertText("> "), title: "Citation" },
    { icon: Code, action: () => insertText("`", "`"), title: "Code" },
    { icon: Link, action: () => insertText("[", "](url)"), title: "Lien" },
  ];

  const renderMarkdown = (text: string) => {
    // Simple markdown rendering - in production, use a proper markdown library
    return text
      .replace(/^### (.*$)/gim, "<h3 class=\"text-lg font-semibold mt-4 mb-2\">$1</h3>")
      .replace(/^## (.*$)/gim, "<h2 class=\"text-xl font-semibold mt-4 mb-2\">$1</h2>")
      .replace(/^# (.*$)/gim, "<h1 class=\"text-2xl font-bold mt-4 mb-2\">$1</h1>")
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/`(.*?)`/g, "<code class=\"bg-muted px-1 py-0.5 rounded text-sm\">$1</code>")
      .replace(/^- \[ \] (.*$)/gim, '<div class="flex items-center gap-2 my-1"><input type="checkbox" disabled class="rounded" /> <span>$1</span></div>')
      .replace(/^- \[x\] (.*$)/gim, '<div class="flex items-center gap-2 my-1"><input type="checkbox" checked disabled class="rounded" /> <span class="line-through opacity-50">$1</span></div>')
      .replace(/^- (.*$)/gim, "<li class=\"ml-4 list-disc\">$1</li>")
      .replace(/^\d+\. (.*$)/gim, "<li class=\"ml-4 list-decimal\">$1</li>")
      .replace(/^> (.*$)/gim, "<blockquote class=\"border-l-4 border-muted pl-4 italic my-2\">$1</blockquote>")
      .replace(/\n/g, "<br />");
  };

  return (
    <Tabs defaultValue="write" className="w-full">
      <div className="flex items-center justify-between border-b border-input">
        <TabsList className="h-9 bg-transparent p-0">
          <TabsTrigger value="write" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-3 py-2">
            <Edit3 size={14} className="mr-1.5" />
            Écrire
          </TabsTrigger>
          <TabsTrigger value="preview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-3 py-2">
            <Eye size={14} className="mr-1.5" />
            Aperçu
          </TabsTrigger>
        </TabsList>

        <div className="flex items-center gap-0.5 px-2">
          {toolbarItems.map((item, index) => (
            item ? (
              <Button
                key={index}
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={item.action}
                title={item.title}
              >
                <item.icon size={14} />
              </Button>
            ) : (
              <div key={index} className="w-px h-4 bg-border mx-1" />
            )
          ))}
        </div>
      </div>

      <TabsContent value="write" className="mt-0 relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onMouseUp={handleSelectionChange}
          onKeyUp={handleSelectionChange}
          placeholder={placeholder}
          className="w-full h-[300px] p-4 resize-none border-0 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm leading-relaxed"
          style={{ outline: "none" }}
        />
        
        {/* Floating convert button for bulleted list items */}
        {onConvertToSubtasks && selectedText && (() => {
          const lines = selectedText.split("\n").filter(line => line.trim().startsWith("- "));
          if (lines.length === 0) return null;
          
          return (
            <div className="absolute bottom-4 right-4 bg-popover border rounded-lg shadow-lg p-2 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
              <span className="text-xs text-muted-foreground">{lines.length} items sélectionnés</span>
              <Button
                size="sm"
                className="h-7 text-xs"
                onClick={() => {
                  const items = lines.map(line => line.replace(/^- \[?\s*\]?\s*/, "").trim());
                  onConvertToSubtasks(items);
                  // Clear selection
                  setSelectedText("");
                }}
              >
                Convertir en subtasks
              </Button>
            </div>
          );
        })()}
      </TabsContent>

      <TabsContent value="preview" className="mt-0">
        <div 
          className="w-full h-[300px] p-4 prose prose-sm max-w-none overflow-y-auto"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(renderMarkdown(value)) || `<span class="text-muted-foreground italic">Rien à afficher</span>` }}
        />
      </TabsContent>
    </Tabs>
  );
}
