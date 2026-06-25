import { useState } from "react";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useNodeNotes } from "../hooks/useNodeNotes";
import type { Note } from "../types";

interface CourseNotesProps {
  courseId: string;
  nodeId: string;
}

const formatTimestamp = (iso: string): string =>
  new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

interface NoteCardProps {
  note: Note;
  onSave: (id: string, text: string) => void;
  onRemove: (id: string) => void;
}

const NoteCard = ({ note, onSave, onRemove }: NoteCardProps) => {
  const [editing, setEditing] = useState<boolean>(false);
  const [draft, setDraft] = useState<string>(note.text);

  const startEdit = () => {
    setDraft(note.text);
    setEditing(true);
  };

  const commit = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    onSave(note.id, trimmed);
    setEditing(false);
  };

  if (editing) {
    return (
      <li className="bg-muted/40 flex flex-col gap-2 rounded-lg border p-2.5">
        <Textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          rows={3}
          autoFocus
          className="min-h-16 text-sm"
        />
        <div className="flex justify-end gap-1.5">
          <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
            <X className="size-3.5" />
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={commit}
            disabled={draft.trim().length === 0}
          >
            <Check className="size-3.5" />
            Save
          </Button>
        </div>
      </li>
    );
  }

  return (
    <li className="bg-muted/40 group flex flex-col gap-1.5 rounded-lg border p-2.5">
      <p className="text-sm break-words whitespace-pre-wrap">{note.text}</p>
      <div className="flex items-center justify-between gap-2">
        <span className="text-muted-foreground text-xs">
          {note.updatedAt
            ? `Edited ${formatTimestamp(note.updatedAt)}`
            : formatTimestamp(note.createdAt)}
        </span>
        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={startEdit}
            aria-label="Edit note"
            className="text-muted-foreground hover:text-foreground"
          >
            <Pencil className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onRemove(note.id)}
            aria-label="Delete note"
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>
    </li>
  );
};

/**
 * Author and manage free-text notes for a single course node. Renders a
 * composer plus the list of saved notes, each editable in place.
 */
export const CourseNotes = ({ courseId, nodeId }: CourseNotesProps) => {
  const { notes, addNote, updateNote, removeNote } = useNodeNotes(
    courseId,
    nodeId
  );
  const [draft, setDraft] = useState<string>("");

  const submit = () => {
    if (draft.trim().length === 0) return;
    addNote(draft);
    setDraft("");
  };

  // Cmd/Ctrl + Enter saves, matching common note-taking shortcuts.
  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      submit();
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <Textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          rows={3}
          placeholder="Write a note…"
          className="min-h-16 text-sm"
        />
        <Button
          size="sm"
          onClick={submit}
          disabled={draft.trim().length === 0}
          className="self-end"
        >
          <Plus className="size-3.5" />
          Add note
        </Button>
      </div>

      {notes.length > 0 && (
        <ul className="flex flex-col gap-2">
          {notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onSave={updateNote}
              onRemove={removeNote}
            />
          ))}
        </ul>
      )}
    </div>
  );
};
