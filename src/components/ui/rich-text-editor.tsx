"use client";

import { useEditor, EditorContent, Editor } from "@tiptap/react";
import { BubbleMenu as BubbleMenuComponent } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Link from "@tiptap/extension-link";
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Code,
  Link as LinkIcon,
  Undo,
  Redo,
  Strikethrough,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCallback } from "react";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onConvertToSubtasks?: (items: string[]) => void;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Écrivez quelque chose...",
  onConvertToSubtasks,
}: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Link.configure({
        openOnClick: false,
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL du lien", previousUrl);
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }
  }, [editor]);

  const getSelectedListItems = useCallback(() => {
    if (!editor) return [];
    const { from, to } = editor.state.selection;
    const items: string[] = [];
    
    editor.state.doc.nodesBetween(from, to, (node) => {
      if (node.isText) {
        const text = node.textContent.trim();
        if (text) items.push(text);
      } else if (node.type.name === "paragraph" || node.type.name === "listItem") {
        const text = node.textContent.trim();
        if (text && !items.includes(text)) items.push(text);
      }
    });
    
    return items;
  }, [editor]);

  if (!editor) return null;

  const ToolbarButton = ({
    onClick,
    isActive,
    icon: Icon,
    title,
  }: {
    onClick: () => void;
    isActive?: boolean;
    icon: typeof Bold;
    title: string;
  }) => (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={cn(
        "h-8 w-8 p-0 hover:bg-muted",
        isActive && "bg-muted text-primary"
      )}
      onClick={onClick}
      title={title}
    >
      <Icon size={16} />
    </Button>
  );

  const Divider = () => <div className="w-px h-4 bg-border mx-1" />;

  return (
    <div className="border rounded-md bg-background">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b bg-muted/30">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive("bold")}
          icon={Bold}
          title="Gras"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive("italic")}
          icon={Italic}
          title="Italique"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive("strike")}
          icon={Strikethrough}
          title="Barré"
        />
        <Divider />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={editor.isActive("heading", { level: 1 })}
          icon={Heading1}
          title="Titre 1"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive("heading", { level: 2 })}
          icon={Heading2}
          title="Titre 2"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          isActive={editor.isActive("heading", { level: 3 })}
          icon={Heading3}
          title="Titre 3"
        />
        <Divider />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive("bulletList")}
          icon={List}
          title="Liste à puces"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive("orderedList")}
          icon={ListOrdered}
          title="Liste numérotée"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          isActive={editor.isActive("taskList")}
          icon={CheckSquare}
          title="Checklist"
        />
        <Divider />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive("blockquote")}
          icon={Quote}
          title="Citation"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          isActive={editor.isActive("code")}
          icon={Code}
          title="Code"
        />
        <ToolbarButton
          onClick={setLink}
          isActive={editor.isActive("link")}
          icon={LinkIcon}
          title="Lien"
        />
        <div className="flex-1" />
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          icon={Undo}
          title="Annuler"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          icon={Redo}
          title="Rétablir"
        />
      </div>

      {/* Editor */}
      <div className="relative">
        <EditorContent
          editor={editor}
          className="prose prose-sm max-w-none p-4 min-h-[300px] focus:outline-none"
        />

        {/* Bubble menu for convert to subtasks */}
        {onConvertToSubtasks && (
          <BubbleMenuComponent
            editor={editor}
            pluginKey="bubbleMenu"
            shouldShow={({ editor }: { editor: Editor }) => {
              const { from, to } = editor.state.selection;
              if (from === to) return false;
              
              // Check if selection contains list items
              let hasListItems = false;
              editor.state.doc.nodesBetween(from, to, (node) => {
                if (node.type.name === "bulletList" || node.type.name === "orderedList") {
                  hasListItems = true;
                }
              });
              
              return hasListItems;
            }}
            className="bg-popover border shadow-lg rounded-lg p-2 flex items-center gap-2"
          >
            <span className="text-xs text-muted-foreground">Liste détectée</span>
            <Button
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                const items = getSelectedListItems();
                if (items.length > 0) {
                  onConvertToSubtasks(items);
                  editor.commands.blur();
                }
              }}
            >
              Convertir en sous-tâches
            </Button>
          </BubbleMenuComponent>
        )}
      </div>
    </div>
  );
}
