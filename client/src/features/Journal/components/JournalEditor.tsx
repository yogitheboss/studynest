import { useEffect } from "react";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "@tiptap/markdown";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import {
  Bold,
  Heading2,
  Italic,
  List,
  ListChecks,
  ListOrdered,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface JournalEditorProps {
  /** Markdown source of truth. External changes (append, AI fix) are applied. */
  value: string;
  onChange: (markdown: string) => void;
  disabled?: boolean;
}

interface ToolbarAction {
  label: string;
  icon: LucideIcon;
  isActive: boolean;
  run: () => void;
}

export const JournalEditor = ({
  value,
  onChange,
  disabled = false,
}: JournalEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      TaskList,
      TaskItem.configure({ nested: true }),
      Markdown,
    ],
    content: value,
    contentType: "markdown",
    editorProps: {
      attributes: {
        class: "journal-editor min-h-[50vh] px-4 py-3 outline-none",
      },
    },
    onUpdate: ({ editor: e }) => onChange(e.getMarkdown()),
  });

  // Sync markdown pushed in from outside (transcription append, AI fix).
  useEffect(() => {
    if (editor && value !== editor.getMarkdown()) {
      editor.commands.setContent(value, { contentType: "markdown" });
    }
  }, [editor, value]);

  useEffect(() => {
    editor?.setEditable(!disabled);
  }, [editor, disabled]);

  const active = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e?.isActive("bold") ?? false,
      italic: e?.isActive("italic") ?? false,
      heading: e?.isActive("heading", { level: 2 }) ?? false,
      bullet: e?.isActive("bulletList") ?? false,
      ordered: e?.isActive("orderedList") ?? false,
      task: e?.isActive("taskList") ?? false,
    }),
  });

  if (!editor) return null;

  const chain = () => editor.chain().focus();
  const actions: ToolbarAction[] = [
    {
      label: "Bold",
      icon: Bold,
      isActive: active?.bold ?? false,
      run: () => chain().toggleBold().run(),
    },
    {
      label: "Italic",
      icon: Italic,
      isActive: active?.italic ?? false,
      run: () => chain().toggleItalic().run(),
    },
    {
      label: "Heading",
      icon: Heading2,
      isActive: active?.heading ?? false,
      run: () => chain().toggleHeading({ level: 2 }).run(),
    },
    {
      label: "Bullet list",
      icon: List,
      isActive: active?.bullet ?? false,
      run: () => chain().toggleBulletList().run(),
    },
    {
      label: "Numbered list",
      icon: ListOrdered,
      isActive: active?.ordered ?? false,
      run: () => chain().toggleOrderedList().run(),
    },
    {
      label: "Checklist",
      icon: ListChecks,
      isActive: active?.task ?? false,
      run: () => chain().toggleTaskList().run(),
    },
  ];

  return (
    <div className="bg-card flex min-h-0 flex-1 flex-col rounded-lg border">
      <div className="flex gap-1 overflow-x-auto border-b p-1">
        {actions.map(({ label, icon: Icon, isActive, run }) => (
          <Button
            key={label}
            type="button"
            variant="ghost"
            size="icon"
            aria-label={label}
            aria-pressed={isActive}
            disabled={disabled}
            onClick={run}
            className={cn(
              "size-11 shrink-0 md:size-8",
              isActive && "bg-accent text-accent-foreground"
            )}
          >
            <Icon className="size-4" />
          </Button>
        ))}
      </div>
      <EditorContent
        editor={editor}
        className="min-h-0 flex-1 overflow-y-auto"
      />
    </div>
  );
};
