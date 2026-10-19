import { useRef, useState, type ChangeEvent } from "react";
import { Check, Copy, FileUp, Loader2 } from "lucide-react";

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
import { parsePlan, SAMPLE_PLAN_JSON } from "../lib/parsePlan";
import { buildPlanPrompt } from "../lib/planPrompt";
import type { NewPlanItem } from "../types";

const DEFAULT_TARGET = 100;

const EXAMPLE = `Thermodynamics -> 2026-10-20
Fluid Mechanics -> 2026-10-21
Heat Transfer -> 2026-10-22 -> 150`;

interface AddSubjectsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Rejects on failure so the dialog can show the message. */
  onAdd: (items: NewPlanItem[]) => Promise<void>;
}

export const AddSubjectsDialog = ({
  open,
  onOpenChange,
  onAdd,
}: AddSubjectsDialogProps) => {
  const [text, setText] = useState<string>("");
  const [target, setTarget] = useState<number>(DEFAULT_TARGET);
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(buildPlanPrompt(target));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setErrors(["Couldn't access the clipboard."]);
    }
  };

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = ""; // allow picking the same file again
    if (!file) return;
    file
      .text()
      .then((content) => {
        setText(content);
        setErrors([]);
      })
      .catch(() => setErrors(["Couldn't read that file."]));
  };

  const handleAdd = async () => {
    const parsed = parsePlan(text, target);
    if (parsed.errors.length || !parsed.items.length) {
      setErrors(parsed.errors.length ? parsed.errors : ["Paste your plan."]);
      return;
    }
    setSaving(true);
    setErrors([]);
    try {
      await onAdd(parsed.items);
      setText("");
      onOpenChange(false);
    } catch (err) {
      setErrors([(err as Error).message]);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !saving && onOpenChange(next)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add subjects</DialogTitle>
          <DialogDescription>
            Paste one subject per line (<code>Subject -&gt; YYYY-MM-DD</code>,
            optionally <code>-&gt; 150</code> questions), or paste/upload your
            whole syllabus as JSON. Not in JSON yet? Copy the AI prompt, paste
            it into ChatGPT or Claude with your syllabus, and paste the reply
            here.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            className="h-11 flex-1 md:h-9"
            onClick={() => void copyPrompt()}
          >
            {copied ? <Check /> : <Copy />}
            {copied ? "Copied" : "Copy AI prompt"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-11 flex-1 md:h-9"
            onClick={() => fileInputRef.current?.click()}
          >
            <FileUp />
            Upload .json
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="h-11 md:h-9"
            onClick={() => {
              setText(SAMPLE_PLAN_JSON);
              setErrors([]);
            }}
          >
            JSON example
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json,.txt,text/plain"
            onChange={handleFile}
            className="hidden"
          />
        </div>

        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={EXAMPLE}
          rows={10}
          className="font-mono text-sm"
        />

        <label className="flex items-center justify-between gap-3 text-sm">
          Default questions per subject
          <Input
            type="number"
            min={1}
            value={target}
            onChange={(e) => setTarget(Math.max(1, Number(e.target.value)))}
            className="h-11 w-24 md:h-9"
          />
        </label>

        {errors.length > 0 && (
          <ul className="text-destructive text-sm">
            {errors.slice(0, 5).map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        )}

        <Button
          disabled={saving}
          onClick={() => void handleAdd()}
          className="h-11 md:h-9"
        >
          {saving && <Loader2 className="animate-spin" />}
          Add to plan
        </Button>
      </DialogContent>
    </Dialog>
  );
};
