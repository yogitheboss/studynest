import {
  AlertCircle,
  FileText,
  Image as ImageIcon,
  Loader2,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dropzone } from "@/components/dropzone";
import { useNodeAttachments } from "../hooks/useNodeAttachments";
import { ACCEPT_ATTRIBUTE } from "../services/uploadContent";
import type { Attachment } from "../types";

interface CourseContentUploaderProps {
  courseId: string;
  nodeId: string;
}

const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const isImage = (contentType: string): boolean =>
  contentType.startsWith("image/");

interface AttachmentRowProps {
  attachment: Attachment;
  onRemove: (id: string) => void;
}

const AttachmentRow = ({ attachment, onRemove }: AttachmentRowProps) => {
  const Icon = isImage(attachment.contentType) ? ImageIcon : FileText;
  return (
    <li className="bg-muted/40 group flex items-center gap-2 rounded-lg border p-2">
      {isImage(attachment.contentType) ? (
        <img
          src={attachment.url}
          alt=""
          className="size-9 shrink-0 rounded object-cover"
          loading="lazy"
        />
      ) : (
        <span className="bg-background text-primary flex size-9 shrink-0 items-center justify-center rounded border">
          <Icon className="size-4" />
        </span>
      )}
      <a
        href={attachment.url}
        target="_blank"
        rel="noopener noreferrer"
        className="min-w-0 flex-1"
      >
        <span className="block truncate text-sm font-medium hover:underline">
          {attachment.name}
        </span>
        <span className="text-muted-foreground text-xs">
          {formatSize(attachment.size)}
        </span>
      </a>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => onRemove(attachment.id)}
        aria-label={`Remove ${attachment.name}`}
        className="text-muted-foreground hover:text-destructive shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
      >
        <X />
      </Button>
    </li>
  );
};

/**
 * Upload and manage the files attached to a single course node. Renders a
 * dropzone, the in-flight/error state, and the list of uploaded content.
 */
export const CourseContentUploader = ({
  courseId,
  nodeId,
}: CourseContentUploaderProps) => {
  const { attachments, uploading, error, uploadFiles, removeAttachment } =
    useNodeAttachments(courseId, nodeId);

  return (
    <div className="flex flex-col gap-3">
      <Dropzone
        accept={ACCEPT_ATTRIBUTE}
        multiple
        disabled={uploading}
        onFiles={uploadFiles}
        title="Add content"
        subtitle="Images or documents, up to 10 MB each"
      />

      {uploading && (
        <p className="text-muted-foreground flex items-center gap-2 text-xs">
          <Loader2 className="size-3.5 animate-spin" />
          Uploading…
        </p>
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

      {attachments.length > 0 && (
        <ul className="flex flex-col gap-2">
          {attachments.map((attachment) => (
            <AttachmentRow
              key={attachment.id}
              attachment={attachment}
              onRemove={removeAttachment}
            />
          ))}
        </ul>
      )}
    </div>
  );
};
