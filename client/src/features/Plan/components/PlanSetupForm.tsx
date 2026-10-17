import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { todayKey } from "@/lib/dates";
import type { PlanSettings } from "../types";

interface PlanSetupFormProps {
  initial?: PlanSettings;
  submitLabel: string;
  /** Rejects on failure so the form can show the message. */
  onSave: (settings: PlanSettings) => Promise<void>;
}

export const PlanSetupForm = ({
  initial,
  submitLabel,
  onSave,
}: PlanSetupFormProps) => {
  const [examName, setExamName] = useState<string>(initial?.examName ?? "");
  const [examDate, setExamDate] = useState<string>(initial?.examDate ?? "");
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSave({ examName: examName.trim(), examDate });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className="flex flex-col gap-3"
    >
      <label className="flex flex-col gap-1 text-sm font-medium">
        Exam
        <Input
          required
          value={examName}
          onChange={(e) => setExamName(e.target.value)}
          placeholder="e.g. GATE 2027"
          className="h-11 md:h-9"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Exam date
        <Input
          required
          type="date"
          min={todayKey()}
          value={examDate}
          onChange={(e) => setExamDate(e.target.value)}
          className="h-11 md:h-9"
        />
      </label>
      {error && <p className="text-destructive text-sm">{error}</p>}
      <Button type="submit" disabled={saving} className="h-11 md:h-9">
        {saving && <Loader2 className="animate-spin" />}
        {submitLabel}
      </Button>
    </form>
  );
};
