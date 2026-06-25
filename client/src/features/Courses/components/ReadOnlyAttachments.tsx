import { FileText, Image as ImageIcon } from "lucide-react";

import type { Attachment } from "../types";

const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const isImage = (contentType: string): boolean =>
  contentType.startsWith("image/");

/** Read-only list of a node's uploaded files, used in the public viewer. */
export const ReadOnlyAttachments = ({
  attachments,
}: {
  attachments: Attachment[];
}) => {
  if (attachments.length === 0) {
    return <p className="text-muted-foreground text-sm">No content.</p>;
  }
  return (
    <ul className="flex flex-col gap-2">
      {attachments.map((attachment) => {
        const Icon = isImage(attachment.contentType) ? ImageIcon : FileText;
        return (
          <li
            key={attachment.id}
            className="bg-muted/40 flex items-center gap-2 rounded-lg border p-2"
          >
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
          </li>
        );
      })}
    </ul>
  );
};
