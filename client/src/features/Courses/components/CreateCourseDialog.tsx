import { useCallback, useRef, useState } from "react";
import { AlertCircle, Check, Copy, FileUp, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Course } from "../types";
import { parseCourseJson } from "../lib/parseCourse";
import { buildCoursePrompt, SAMPLE_COURSE_JSON } from "../lib/coursePrompt";

interface CreateCourseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (course: Course) => void;
}

export const CreateCourseDialog = ({
  open,
  onOpenChange,
  onCreated,
}: CreateCourseDialogProps) => {
  const [subject, setSubject] = useState<string>("");
  const [jsonText, setJsonText] = useState<string>("");
  const [errors, setErrors] = useState<string[]>([]);
  const [copied, setCopied] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setSubject("");
    setJsonText("");
    setErrors([]);
    setCopied(false);
  }, []);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) reset();
      onOpenChange(next);
    },
    [onOpenChange, reset]
  );

  const handleCopyPrompt = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(buildCoursePrompt(subject));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setErrors(["Couldn't access the clipboard — copy the prompt manually."]);
    }
  }, [subject]);

  const handleFile = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        setJsonText(typeof reader.result === "string" ? reader.result : "");
        setErrors([]);
      };
      reader.onerror = () => setErrors(["Couldn't read that file."]);
      reader.readAsText(file);
      // Allow re-selecting the same file later.
      event.target.value = "";
    },
    []
  );

  const handleCreate = useCallback(() => {
    const result = parseCourseJson(jsonText);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    onCreated(result.course);
    reset();
    onOpenChange(false);
  }, [jsonText, onCreated, onOpenChange, reset]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create a course</DialogTitle>
          <DialogDescription>
            Generate a course outline as JSON, then paste or upload it to build
            the graph.
          </DialogDescription>
        </DialogHeader>

        {/* Step 1 — prompt generator */}
        <section className="bg-muted/40 flex flex-col gap-2 rounded-lg border p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <Sparkles className="text-primary size-4" />
            1. Generate the JSON with an AI
          </h3>
          <p className="text-muted-foreground text-xs">
            Enter a subject, copy the prompt, and paste it into your favourite
            assistant. It returns JSON in the exact shape we need.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              placeholder="e.g. Introduction to Machine Learning"
            />
            <Button
              type="button"
              variant="secondary"
              onClick={handleCopyPrompt}
              className="shrink-0"
            >
              {copied ? <Check /> : <Copy />}
              {copied ? "Copied" : "Copy prompt"}
            </Button>
          </div>
        </section>

        {/* Step 2 — paste / upload */}
        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">
              2. Paste or upload the JSON
            </h3>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setJsonText(SAMPLE_COURSE_JSON);
                  setErrors([]);
                }}
              >
                Load sample
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <FileUp />
                Upload .json
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={handleFile}
              />
            </div>
          </div>
          <Textarea
            value={jsonText}
            onChange={(event) => {
              setJsonText(event.target.value);
              if (errors.length) setErrors([]);
            }}
            placeholder="Paste your course JSON here…"
            className="min-h-48 font-mono text-xs"
            spellCheck={false}
          />
        </section>

        {errors.length > 0 && (
          <div
            role="alert"
            className="border-destructive/40 bg-destructive/10 text-destructive flex flex-col gap-1 rounded-lg border p-3 text-sm"
          >
            <span className="flex items-center gap-2 font-medium">
              <AlertCircle className="size-4" />
              Couldn&apos;t build the course
            </span>
            <ul className="list-inside list-disc text-xs">
              {errors.map((message, index) => (
                <li key={`${index}-${message}`}>{message}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={jsonText.trim() === ""}>
            Create course
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
