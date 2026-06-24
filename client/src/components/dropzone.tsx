import { useCallback, useRef, useState } from "react";
import { UploadCloud } from "lucide-react";

import { cn } from "@/lib/utils";

interface DropzoneProps {
  /** Called with the dropped or selected files. */
  onFiles: (files: File[]) => void;
  /** Value for the underlying input's `accept` attribute. */
  accept?: string;
  /** Allow selecting more than one file. */
  multiple?: boolean;
  /** Disable interaction (e.g. while an upload is in flight). */
  disabled?: boolean;
  /** Primary call-to-action line. */
  title?: string;
  /** Secondary helper line (supported types, size limit, …). */
  subtitle?: string;
  className?: string;
}

/**
 * Presentation-only drag-and-drop file picker. Domain-agnostic: it surfaces
 * the chosen files and leaves validation and uploading to the caller.
 */
export const Dropzone = ({
  onFiles,
  accept,
  multiple = false,
  disabled = false,
  title = "Drop files here or click to browse",
  subtitle,
  className,
}: DropzoneProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const openPicker = useCallback(() => {
    if (!disabled) inputRef.current?.click();
  }, [disabled]);

  const emit = useCallback(
    (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;
      onFiles(Array.from(fileList));
    },
    [onFiles]
  );

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLButtonElement>) => {
      event.preventDefault();
      setIsDragging(false);
      if (disabled) return;
      emit(event.dataTransfer.files);
    },
    [disabled, emit]
  );

  return (
    <button
      type="button"
      onClick={openPicker}
      onDragOver={(event) => {
        event.preventDefault();
        if (!disabled) setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      disabled={disabled}
      aria-label={title}
      className={cn(
        "flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-6 text-center transition-colors",
        "focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
        isDragging
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/60 hover:bg-accent/40",
        disabled && "cursor-not-allowed opacity-60",
        className
      )}
    >
      <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-full">
        <UploadCloud className="size-5" />
      </div>
      <div>
        <p className="text-sm font-medium">{title}</p>
        {subtitle && (
          <p className="text-muted-foreground mt-0.5 text-xs">{subtitle}</p>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(event) => {
          emit(event.target.files);
          // Allow re-selecting the same file later.
          event.target.value = "";
        }}
      />
    </button>
  );
};
