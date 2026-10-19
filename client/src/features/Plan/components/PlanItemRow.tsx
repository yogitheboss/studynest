import { useState } from "react";
import { CalendarClock, ChevronDown, Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatDateKey } from "@/lib/dates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { PlanActions } from "../hooks/usePlan";
import type { PlanItem } from "../types";

interface PlanItemRowProps {
  item: PlanItem;
  today: string;
  /** For revisions: the notes taken while learning the subject. */
  sourceNotes?: string;
  showDate?: boolean;
  actions: PlanActions;
  onError: (message: string) => void;
}

export const PlanItemRow = ({
  item,
  today,
  sourceNotes,
  showDate,
  actions,
  onError,
}: PlanItemRowProps) => {
  const [open, setOpen] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>(item.notes);
  const [solvedNow, setSolvedNow] = useState<string>("");
  const isDone = item.status === "done";
  const isRevision = item.type === "revise";

  const act = (work: Promise<void>) =>
    void work.catch((err: Error) => onError(err.message));

  const logSolved = () => {
    const count = Number(solvedNow);
    if (!count) return;
    act(actions.setSolved(item, Math.max(0, item.solved + count)));
    setSolvedNow("");
  };

  return (
    <li className="bg-card rounded-lg border">
      <div className="flex items-center gap-3 p-3">
        <input
          type="checkbox"
          checked={isDone}
          onChange={() => act(actions.toggleDone(item))}
          aria-label={
            isDone ? `Mark ${item.title} not done` : `Mark ${item.title} done`
          }
          className="accent-primary size-5 shrink-0"
        />
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          <span className="min-w-0 flex-1">
            <span
              className={cn(
                "block truncate font-medium",
                isDone && "text-muted-foreground line-through"
              )}
            >
              {item.title}
            </span>
            <span className="text-muted-foreground flex flex-wrap gap-x-2 text-xs">
              {isRevision && (
                <span className="bg-secondary text-secondary-foreground rounded px-1.5">
                  Revise
                </span>
              )}
              {item.target !== null && (
                <span className="tabular-nums">
                  {item.solved}/{item.target} questions
                </span>
              )}
              {showDate && <span>{formatDateKey(item.date)}</span>}
            </span>
          </span>
          <ChevronDown
            className={cn(
              "text-muted-foreground size-4 shrink-0 transition-transform",
              open && "rotate-180"
            )}
          />
        </button>
      </div>

      {open && (
        <div className="flex flex-col gap-3 border-t p-3">
          {isRevision ? (
            <p className="text-muted-foreground text-sm whitespace-pre-wrap">
              {sourceNotes?.trim() ||
                "No concept notes were taken for this subject."}
            </p>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  inputMode="numeric"
                  value={solvedNow}
                  onChange={(e) => setSolvedNow(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && logSolved()}
                  placeholder="Solved just now"
                  aria-label="Questions solved just now"
                  className="h-11 flex-1 md:h-9"
                />
                <Button
                  variant="secondary"
                  className="h-11 md:h-9"
                  disabled={!Number(solvedNow)}
                  onClick={logSolved}
                >
                  Log
                </Button>
              </div>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={() =>
                  notes !== item.notes && act(actions.saveNotes(item, notes))
                }
                placeholder="Concepts from the questions, related topics to look up…"
                rows={4}
              />
            </>
          )}

          <div className="flex flex-wrap gap-2">
            {!isDone && item.date < today && (
              <Button
                variant="outline"
                className="h-11 md:h-9"
                onClick={() => act(actions.moveToToday(item))}
              >
                <CalendarClock />
                Move to today
              </Button>
            )}
            <Button
              variant="ghost"
              className="text-destructive h-11 md:h-9"
              onClick={() =>
                window.confirm(
                  isRevision
                    ? "Delete this revision?"
                    : "Delete this subject and its revisions?"
                ) && act(actions.remove(item))
              }
            >
              <Trash2 />
              Delete
            </Button>
          </div>
        </div>
      )}
    </li>
  );
};
