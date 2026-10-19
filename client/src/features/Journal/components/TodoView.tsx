import { useState } from "react";
import { Loader2, Mic, Sparkles, Square } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useJournalEntry } from "../hooks/useJournalEntry";
import { useRecorder } from "../hooks/useRecorder";
import { fixEntry, TODOS_PATH, transcribeAudio } from "../services/journalApi";
import type { SaveStatus } from "../types";
import { JournalEditor } from "./JournalEditor";

const STATUS_LABEL: Record<SaveStatus, string> = {
  idle: "",
  saving: "Saving…",
  saved: "Saved",
  error: "Couldn't save — keep this tab open and retry by editing",
};

type AiTask = "transcribing" | "fixing";

const formatElapsed = (s: number): string =>
  `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

/** One undated checklist of things to do — study, projects, ideas. */
export const TodoView = () => {
  const { markdown, setMarkdown, loading, error, status } =
    useJournalEntry(TODOS_PATH);
  const recorder = useRecorder();
  const [aiTask, setAiTask] = useState<AiTask | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  // Lock the editor while recording or waiting on AI so the result can't
  // clobber text typed in the meantime.
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
      const text = await transcribeAudio(audio, "todo");
      return markdown.trim() ? `${markdown.trimEnd()}\n\n${text}` : text;
    });
  };

  const fixWithAi = () =>
    runAi("fixing", async () => (await fixEntry(markdown)).markdown);

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
      <div>
        <h2 className="text-xl font-semibold">To do</h2>
        <p className="text-muted-foreground text-sm">
          Study, projects, ideas — type them as a checklist or just say them.
        </p>
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
          value={markdown}
          onChange={setMarkdown}
          disabled={busy}
        />
      )}
    </section>
  );
};
