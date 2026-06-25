import type { Note } from "../types";

const formatTimestamp = (iso: string): string =>
  new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

/** Read-only list of a node's notes, used in the public course viewer. */
export const ReadOnlyNotes = ({ notes }: { notes: Note[] }) => {
  if (notes.length === 0) {
    return <p className="text-muted-foreground text-sm">No notes.</p>;
  }
  return (
    <ul className="flex flex-col gap-2">
      {notes.map((note) => (
        <li
          key={note.id}
          className="bg-muted/40 flex flex-col gap-1.5 rounded-lg border p-2.5"
        >
          <p className="text-sm break-words whitespace-pre-wrap">{note.text}</p>
          <span className="text-muted-foreground text-xs">
            {note.updatedAt
              ? `Edited ${formatTimestamp(note.updatedAt)}`
              : formatTimestamp(note.createdAt)}
          </span>
        </li>
      ))}
    </ul>
  );
};
