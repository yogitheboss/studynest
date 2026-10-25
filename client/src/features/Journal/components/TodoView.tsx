import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { CalendarDays, CircleCheck, Loader2, Plus, Search } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDateKey, todayKey } from "@/lib/dates";
import { prefetchDoc } from "../hooks/useJournalEntry";
import { useTodoList } from "../hooks/useTodoList";
import { createTodo, entryPath } from "../services/journalApi";
import type { TodoSummary } from "../types";
import { TodoNote } from "./TodoNote";

const displayTitle = (note: TodoSummary): string =>
  note.title.trim() || (note.date ? formatDateKey(note.date) : "Untitled");

interface NoteGroupProps {
  label: string;
  notes: TodoSummary[];
  selectedId?: string;
}

const NoteGroup = ({ label, notes, selectedId }: NoteGroupProps) =>
  notes.length > 0 && (
    <div>
      <h3 className="text-muted-foreground mb-1 text-xs font-semibold uppercase">
        {label}
      </h3>
      <ul className="flex flex-col gap-1">
        {notes.map((note) => {
          const finished = note.total > 0 && note.done === note.total;
          return (
            <li key={note.id}>
              <Link
                to={`/todos/${note.id}`}
                className={cn(
                  "hover:bg-muted block rounded-md border p-2",
                  note.id === selectedId && "border-primary bg-muted"
                )}
              >
                <span
                  className={cn(
                    "flex items-center gap-1 text-sm font-medium",
                    finished && "text-muted-foreground"
                  )}
                >
                  {finished && <CircleCheck className="size-4 shrink-0" />}
                  <span className="truncate">{displayTitle(note)}</span>
                </span>
                <span className="text-muted-foreground flex gap-2 text-xs">
                  {/* The date is already the title when there's no title. */}
                  {note.date && note.title.trim() && (
                    <span>{formatDateKey(note.date)}</span>
                  )}
                  {note.total > 0 && (
                    <span>
                      {note.done}/{note.total} done
                    </span>
                  )}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );

/**
 * Todo notes: titled lists for later ("someday") and dated daily lists, each
 * with tasks and things to remember. List and open note side by side on
 * desktop; one at a time on mobile.
 */
export const TodoView = () => {
  const { noteId } = useParams<{ noteId: string }>();
  const navigate = useNavigate();
  const [version, setVersion] = useState<number>(0);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);
  const { notes, error } = useTodoList(version);
  const [query, setQuery] = useState<string>("");
  const [creating, setCreating] = useState<boolean>(false);
  const [createError, setCreateError] = useState<string | null>(null);
  // Warm today's journal so switching to it doesn't wait on the network.
  useEffect(() => prefetchDoc(entryPath(todayKey())), []);

  const create = async (fields: { date?: string }) => {
    setCreating(true);
    setCreateError(null);
    try {
      const note = await createTodo(fields);
      refresh();
      navigate(`/todos/${note.id}`);
    } catch (err) {
      setCreateError((err as Error).message);
    } finally {
      setCreating(false);
    }
  };

  // Today's note if there is one, otherwise a new one dated today.
  const openToday = () => {
    const today = todayKey();
    const existing = notes?.find((n) => n.date === today);
    if (existing) navigate(`/todos/${existing.id}`);
    else void create({ date: today });
  };

  const onDeleted = useCallback(() => {
    refresh();
    navigate("/todos");
  }, [refresh, navigate]);

  const q = query.trim().toLowerCase();
  const visible = (notes ?? []).filter((n) =>
    displayTitle(n).toLowerCase().includes(q)
  );
  // Server order is newest edit first; dated notes read better by date.
  const dated = visible
    .filter((n) => n.date)
    .sort((a, b) => b.date!.localeCompare(a.date!));
  const someday = visible.filter((n) => !n.date);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 md:flex-row">
      <aside
        className={cn(
          "flex flex-col gap-3 md:w-64 md:shrink-0",
          noteId && "hidden md:flex"
        )}
      >
        <div>
          <h2 className="text-xl font-semibold">To do</h2>
          <p className="text-muted-foreground text-sm">
            Daily lists and notes for later.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            className="h-11 flex-1 md:h-9"
            disabled={creating}
            onClick={() => void create({})}
          >
            <Plus className="size-4" />
            New note
          </Button>
          <Button
            variant="outline"
            className="h-11 flex-1 md:h-9"
            // Wait for the list so Today can't create a duplicate.
            disabled={creating || !notes}
            onClick={openToday}
          >
            <CalendarDays className="size-4" />
            Today
          </Button>
        </div>
        {(error || createError) && (
          <p className="text-destructive text-sm">{createError ?? error}</p>
        )}
        {notes === null ? (
          !error && (
            <div className="text-muted-foreground flex justify-center py-6">
              <Loader2 className="size-5 animate-spin" />
            </div>
          )
        ) : notes.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No notes yet. Start a new note for something to do later, or a list
            for today.
          </p>
        ) : (
          <>
            <div className="relative">
              <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
              <Input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search titles"
                aria-label="Search notes by title"
                className="h-11 pl-8 md:h-9"
              />
            </div>
            <NoteGroup label="Dated" notes={dated} selectedId={noteId} />
            <NoteGroup label="Someday" notes={someday} selectedId={noteId} />
            {visible.length === 0 && (
              <p className="text-muted-foreground text-sm">No matches.</p>
            )}
          </>
        )}
      </aside>

      {noteId ? (
        <TodoNote
          key={noteId}
          id={noteId}
          onChanged={refresh}
          onDeleted={onDeleted}
        />
      ) : (
        <p className="text-muted-foreground hidden flex-1 items-center justify-center text-sm md:flex">
          Pick a note, or start a new one.
        </p>
      )}
    </div>
  );
};
