import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  Mic,
  Sparkles,
  Square,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useJournalEntry } from "../hooks/useJournalEntry";
import { useJournalList } from "../hooks/useJournalList";
import { useRecorder } from "../hooks/useRecorder";
import { entryPath, fixEntry, transcribeAudio } from "../services/journalApi";
import { formatDateKey, shiftDateKey, todayKey } from "@/lib/dates";
import type { SaveStatus } from "../types";
import { JournalEditor } from "./JournalEditor";

const STATUS_LABEL: Record<SaveStatus, string> = {
  idle: "",
  saving: "Saving…",
  saved: "Saved",
  error: "Couldn't save — keep this tab open and retry by editing",
};

const downloadMarkdown = (date: string, markdown: string): void => {
  const url = URL.createObjectURL(
    new Blob([markdown], { type: "text/markdown" })
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = `journal-${date}.md`;
  a.click();
  URL.revokeObjectURL(url);
};

type AiTask = "transcribing" | "fixing";

const formatElapsed = (s: number): string =>
  `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

export const JournalView = () => {
  const [date, setDate] = useState<string>(todayKey);
  const { markdown, setMarkdown, loading, error, status, savedCount } =
    useJournalEntry(entryPath(date));
  const pastDays = useJournalList(savedCount);
  const isToday = date === todayKey();
  const recorder = useRecorder();
  const [aiTask, setAiTask] = useState<AiTask | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  // Lock date + editor while recording or waiting on Gemini, so the result
  // lands on the right day and can't clobber text typed in the meantime.
  const busy = recorder.recording || aiTask !== null;

  const runAi = async (task: AiTask, work: () => Promise<string>) => {
    setAiTask(task);
    setAiError(null);
    try {
      setMarkdown(await work());
    } catch (err) {
      setAiError((err as Error).message);
    } finally {
      setAiTask(null);
    }
  };

  const toggleRecording = async () => {
    if (!recorder.recording) return recorder.start();
    const audio = await recorder.stop();
    if (!audio) return;
    await runAi("transcribing", async () => {
      const text = await transcribeAudio(audio);
      return markdown.trim() ? `${markdown.trimEnd()}\n\n${text}` : text;
    });
  };

  const fixWithAi = () =>
    runAi("fixing", async () => (await fixEntry(markdown)).markdown);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 md:flex-row">
      <section className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-semibold">
              {isToday ? "Studied today" : "Study journal"}
            </h2>
            <p className="text-muted-foreground text-sm">
              {formatDateKey(date)}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              aria-label="Previous day"
              className="size-11 md:size-9"
              disabled={busy}
              onClick={() => setDate((d) => shiftDateKey(d, -1))}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <input
              type="date"
              aria-label="Pick a date"
              value={date}
              max={todayKey()}
              disabled={busy}
              onChange={(e) => e.target.value && setDate(e.target.value)}
              className="border-input bg-background h-11 rounded-md border px-2 text-sm md:h-9"
            />
            <Button
              variant="outline"
              size="icon"
              aria-label="Next day"
              className="size-11 md:size-9"
              disabled={isToday || busy}
              onClick={() => setDate((d) => shiftDateKey(d, 1))}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={recorder.recording ? "destructive" : "default"}
            className="h-11 md:h-9"
            disabled={loading || !!error || aiTask !== null}
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
          <Button
            variant="outline"
            className="h-11 md:h-9"
            disabled={busy || loading || !markdown.trim()}
            onClick={() => void fixWithAi()}
          >
            <Sparkles className="size-4" />
            AI fix
          </Button>
          <Button
            variant="outline"
            className="h-11 md:h-9"
            aria-label="Download as markdown"
            disabled={!markdown.trim()}
            onClick={() => downloadMarkdown(date, markdown)}
          >
            <Download className="size-4" />
            .md
          </Button>
          <span
            className={cn(
              "text-muted-foreground ml-auto text-xs",
              (status === "error" || aiError || recorder.error) &&
                "text-destructive"
            )}
            aria-live="polite"
          >
            {aiTask ? (
              <span className="flex items-center gap-1">
                <Loader2 className="size-3 animate-spin" />
                {aiTask === "transcribing" ? "Transcribing…" : "Fixing…"}
              </span>
            ) : (
              (recorder.error ?? aiError ?? STATUS_LABEL[status])
            )}
          </span>
        </div>

        {error ? (
          <p className="text-destructive text-sm">{error}</p>
        ) : loading ? (
          <div className="text-muted-foreground flex flex-1 items-center justify-center">
            <Loader2 className="size-5 animate-spin" />
          </div>
        ) : (
          <JournalEditor
            key={date}
            value={markdown}
            onChange={setMarkdown}
            disabled={busy}
          />
        )}
      </section>

      {pastDays.length > 0 && (
        <aside className="md:w-56 md:shrink-0">
          <h3 className="text-muted-foreground mb-2 text-xs font-semibold uppercase">
            Past days
          </h3>
          <ul className="flex gap-2 overflow-x-auto pb-1 md:flex-col md:overflow-visible">
            {pastDays.map((entry) => (
              <li key={entry.date} className="shrink-0 md:shrink">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setDate(entry.date)}
                  className={cn(
                    "hover:bg-muted w-44 rounded-md border p-2 text-left disabled:opacity-50 md:w-full",
                    entry.date === date && "border-primary bg-muted"
                  )}
                >
                  <span className="block text-sm font-medium">
                    {formatDateKey(entry.date)}
                  </span>
                  <span className="text-muted-foreground line-clamp-2 text-xs">
                    {entry.preview}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </aside>
      )}
    </div>
  );
};
