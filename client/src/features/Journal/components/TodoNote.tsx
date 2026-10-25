import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft,
  Loader2,
  Mic,
  Plus,
  Sparkles,
  Square,
  Trash2,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { formatDateKey } from "@/lib/dates";
import { useJournalEntry } from "../hooks/useJournalEntry";
import { useRecorder } from "../hooks/useRecorder";
import { useTodoNote } from "../hooks/useTodoNote";
import { splitChecklist } from "../lib/checklist";
import {
  deleteTodo,
  fixEntry,
  todoNotesPath,
  transcribeAudio,
} from "../services/journalApi";
import type { SaveStatus, TodoTask } from "../types";
import { JournalEditor } from "./JournalEditor";

const STATUS_LABEL: Record<SaveStatus, string> = {
  idle: "",
  saving: "Saving…",
  saved: "Saved",
  error: "Couldn't save — keep this tab open and retry by editing",
};
// The note's two saves (tasks/title, Remember) shown as one status.
const STATUS_PRIORITY: SaveStatus[] = ["error", "saving", "saved"];

type AiTask = "transcribing" | "fixing" | "deleting";

const AI_LABEL: Record<AiTask, string> = {
  transcribing: "Transcribing…",
  fixing: "Fixing…",
  deleting: "Deleting…",
};

const formatElapsed = (s: number): string =>
  `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

interface TodoNoteProps {
  id: string;
  /** Called after a save, so the notes list can refresh. */
  onChanged: () => void;
  onDeleted: () => void;
}

/** One todo note: title, optional date, a task list and notes to remember. */
export const TodoNote = ({ id, onChanged, onDeleted }: TodoNoteProps) => {
  const { note, loading, error, update, status, savedCount } = useTodoNote(id);
  const remember = useJournalEntry(todoNotesPath(id));
  const recorder = useRecorder();
  const [aiTask, setAiTask] = useState<AiTask | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [newTask, setNewTask] = useState<string>("");
  const addInput = useRef<HTMLInputElement>(null);
  // Lock everything while recording or waiting on AI so the result can't
  // clobber edits made in the meantime.
  const busy = recorder.recording || aiTask !== null;

  useEffect(() => {
    if (savedCount + remember.savedCount > 0) onChanged();
  }, [savedCount, remember.savedCount, onChanged]);

  const tasks = note?.tasks ?? [];
  const setTasks = (next: TodoTask[]) => update({ tasks: next });
  const editTask = (taskId: string, change: Partial<TodoTask>) =>
    setTasks(tasks.map((t) => (t.id === taskId ? { ...t, ...change } : t)));
  const addTasks = (texts: string[]) =>
    setTasks([
      ...tasks,
      ...texts.map((text) => ({ id: crypto.randomUUID(), text, done: false })),
    ]);

  const appendRemember = (text: string) =>
    remember.setMarkdown(
      remember.markdown.trim()
        ? `${remember.markdown.trimEnd()}\n\n${text}`
        : text
    );

  const runAi = async (task: AiTask, work: () => Promise<void>) => {
    setAiTask(task);
    setAiError(null);
    try {
      await work();
    } catch (err) {
      setAiError((err as Error).message);
    } finally {
      setAiTask(null);
    }
  };

  // Spoken checklist items become tasks; anything else goes to Remember.
  const toggleRecording = async () => {
    if (!recorder.recording) return recorder.start();
    const audio = await recorder.stop();
    if (!audio) return;
    await runAi("transcribing", async () => {
      const { tasks: spoken, rest } = splitChecklist(
        await transcribeAudio(audio, "todo")
      );
      if (spoken.length) addTasks(spoken);
      if (rest) appendRemember(rest);
    });
  };

  const fixWithAi = () =>
    runAi("fixing", async () =>
      remember.setMarkdown((await fixEntry(remember.markdown)).markdown)
    );

  const remove = () => {
    if (!window.confirm("Delete this note? This can't be undone.")) return;
    void runAi("deleting", async () => {
      await deleteTodo(id);
      onDeleted();
    });
  };

  const addTask = () => {
    const text = newTask.trim();
    if (!text) return;
    addTasks([text]);
    setNewTask("");
  };

  if (error) return <p className="text-destructive text-sm">{error}</p>;
  if (loading || !note) {
    return (
      <div className="text-muted-foreground flex flex-1 items-center justify-center">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }

  const saveStatus =
    STATUS_PRIORITY.find((s) => s === status || s === remember.status) ??
    "idle";
  const done = tasks.filter((t) => t.done).length;

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4">
      <div className="flex items-center gap-1">
        <Button
          asChild
          variant="ghost"
          size="icon"
          className="size-11 md:hidden"
        >
          <Link to="/todos" aria-label="All notes">
            <ChevronLeft className="size-5" />
          </Link>
        </Button>
        <input
          value={note.title}
          onChange={(e) => update({ title: e.target.value })}
          placeholder={note.date ? formatDateKey(note.date) : "Untitled"}
          aria-label="Title"
          maxLength={200}
          disabled={busy}
          // A brand-new note starts on its title; a daily note doesn't need one.
          autoFocus={!note.title && !note.date}
          className="placeholder:text-muted-foreground/70 min-w-0 flex-1 bg-transparent text-xl font-semibold outline-none"
        />
        <Button
          variant="ghost"
          size="icon"
          aria-label="Delete note"
          className="size-11 md:size-9"
          disabled={busy}
          onClick={remove}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center">
          <input
            type="date"
            aria-label="Date (leave empty for someday)"
            value={note.date ?? ""}
            disabled={busy}
            onChange={(e) => update({ date: e.target.value || null })}
            className="border-input bg-background h-11 rounded-md border px-2 text-sm md:h-9"
          />
          {note.date && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Remove date"
              className="size-11 md:size-9"
              disabled={busy}
              onClick={() => update({ date: null })}
            >
              <X className="size-4" />
            </Button>
          )}
        </div>
        <Button
          variant={recorder.recording ? "destructive" : "default"}
          className="h-11 md:h-9"
          disabled={remember.loading || aiTask !== null}
          onClick={() => void toggleRecording()}
        >
          {recorder.recording ? (
            <>
              <Square className="size-4" />
              Stop {formatElapsed(recorder.elapsed)}
            </>
          ) : (
            <>
              <Mic className="size-4" />
              Record
            </>
          )}
        </Button>
        <span
          className={cn(
            "text-muted-foreground ml-auto text-xs",
            (saveStatus === "error" || aiError || recorder.error) &&
              "text-destructive"
          )}
          aria-live="polite"
        >
          {aiTask ? (
            <span className="flex items-center gap-1">
              <Loader2 className="size-3 animate-spin" />
              {AI_LABEL[aiTask]}
            </span>
          ) : (
            (recorder.error ?? aiError ?? STATUS_LABEL[saveStatus])
          )}
        </span>
      </div>

      <section className="flex flex-col gap-1">
        <h3 className="text-muted-foreground text-xs font-semibold uppercase">
          Tasks{tasks.length > 0 && ` · ${done}/${tasks.length}`}
        </h3>
        <ul className="flex flex-col">
          {tasks.map((task) => (
            <li key={task.id} className="group flex items-center gap-2">
              <input
                type="checkbox"
                checked={task.done}
                aria-label={`Done: ${task.text}`}
                disabled={busy}
                onChange={() => editTask(task.id, { done: !task.done })}
                className="accent-primary size-5 shrink-0"
              />
              <input
                value={task.text}
                aria-label="Task"
                maxLength={500}
                disabled={busy}
                onChange={(e) => editTask(task.id, { text: e.target.value })}
                onKeyDown={(e) =>
                  e.key === "Enter" && addInput.current?.focus()
                }
                className={cn(
                  "min-w-0 flex-1 bg-transparent py-2 text-sm outline-none",
                  task.done && "text-muted-foreground line-through"
                )}
              />
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Delete task: ${task.text}`}
                disabled={busy}
                onClick={() => setTasks(tasks.filter((t) => t.id !== task.id))}
                className="size-9 md:size-7 md:opacity-0 md:group-focus-within:opacity-100 md:group-hover:opacity-100"
              >
                <X className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            addTask();
          }}
        >
          <Plus className="text-muted-foreground size-5 shrink-0" />
          <input
            ref={addInput}
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="Add a task…"
            aria-label="New task"
            maxLength={500}
            disabled={busy}
            className="placeholder:text-muted-foreground min-w-0 flex-1 bg-transparent py-2 text-sm outline-none"
          />
        </form>
      </section>

      <section className="flex min-h-0 flex-1 flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-muted-foreground text-xs font-semibold uppercase">
            Remember
          </h3>
          <Button
            variant="outline"
            size="sm"
            disabled={busy || remember.loading || !remember.markdown.trim()}
            onClick={() => void fixWithAi()}
          >
            <Sparkles className="size-4" />
            AI fix
          </Button>
        </div>
        {remember.error ? (
          <p className="text-destructive text-sm">{remember.error}</p>
        ) : remember.loading ? (
          <div className="text-muted-foreground flex flex-1 items-center justify-center">
            <Loader2 className="size-5 animate-spin" />
          </div>
        ) : (
          <JournalEditor
            key={id}
            value={remember.markdown}
            onChange={remember.setMarkdown}
            disabled={busy}
          />
        )}
      </section>
    </div>
  );
};
