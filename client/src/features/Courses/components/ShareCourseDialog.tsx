import { useState } from "react";
import { AlertCircle, Check, Copy, Globe, Loader2, Lock } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { Course } from "../types";

interface ShareCourseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course: Course;
  /** Persist a new visibility; rejects on failure. */
  onSetVisibility: (isPublic: boolean) => Promise<void>;
}

interface VisibilityOptionProps {
  active: boolean;
  disabled: boolean;
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}

const VisibilityOption = ({
  active,
  disabled,
  icon,
  title,
  description,
  onClick,
}: VisibilityOptionProps) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-pressed={active}
    className={cn(
      "flex flex-1 items-start gap-3 rounded-lg border p-3 text-left transition-colors disabled:opacity-60",
      active ? "border-primary bg-primary/5" : "hover:bg-accent/50"
    )}
  >
    <span
      className={cn(
        "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full",
        active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
      )}
    >
      {icon}
    </span>
    <span className="min-w-0">
      <span className="block text-sm font-medium">{title}</span>
      <span className="text-muted-foreground block text-xs">{description}</span>
    </span>
  </button>
);

/**
 * Lets a course's owner switch it between private and public and copy the
 * public share link. Public courses are viewable by anyone with the link, even
 * when signed out.
 */
export const ShareCourseDialog = ({
  open,
  onOpenChange,
  course,
  onSetVisibility,
}: ShareCourseDialogProps) => {
  const [busy, setBusy] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const shareUrl = `${window.location.origin}/c/${course.publicId}`;

  const handleSetVisibility = async (next: boolean) => {
    if (next === course.isPublic || busy) return;
    setBusy(true);
    setError(null);
    try {
      await onSetVisibility(next);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Couldn't update visibility."
      );
    } finally {
      setBusy(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setError("Couldn't access the clipboard — copy the link manually.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Share “{course.name}”</DialogTitle>
          <DialogDescription>
            Courses are private by default. Make this one public to share it
            with anyone — no sign-in required to view.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2 sm:flex-row">
          <VisibilityOption
            active={!course.isPublic}
            disabled={busy}
            icon={<Lock className="size-4" />}
            title="Private"
            description="Only you can see this course."
            onClick={() => handleSetVisibility(false)}
          />
          <VisibilityOption
            active={course.isPublic}
            disabled={busy}
            icon={<Globe className="size-4" />}
            title="Public"
            description="Anyone with the link can view it."
            onClick={() => handleSetVisibility(true)}
          />
        </div>

        {busy && (
          <p className="text-muted-foreground flex items-center gap-2 text-xs">
            <Loader2 className="size-3.5 animate-spin" />
            Updating visibility…
          </p>
        )}

        {course.isPublic && (
          <div className="flex flex-col gap-2">
            <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Public link
            </span>
            <div className="flex gap-2">
              <Input readOnly value={shareUrl} className="font-mono text-xs" />
              <Button
                type="button"
                variant="secondary"
                onClick={handleCopy}
                className="shrink-0"
              >
                {copied ? <Check /> : <Copy />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="border-destructive/40 bg-destructive/10 text-destructive flex items-start gap-2 rounded-lg border p-2.5 text-xs"
          >
            <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
