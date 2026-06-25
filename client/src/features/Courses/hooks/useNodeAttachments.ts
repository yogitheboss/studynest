import { useCallback, useEffect, useState } from "react";

import type { Attachment } from "../types";
import { fetchAttachments, saveAttachments } from "../services/coursesApi";
import { uploadCourseFile, validateFile } from "../services/uploadContent";

interface UseNodeAttachmentsResult {
  attachments: Attachment[];
  /** True while one or more files are uploading. */
  uploading: boolean;
  /** User-facing error from the most recent attempt, or null. */
  error: string | null;
  /** Validate and upload the given files, appending successful ones. */
  uploadFiles: (files: File[]) => Promise<void>;
  /** Remove an attachment from this node. */
  removeAttachment: (id: string) => void;
}

/**
 * Owns the attachments for a single course node, backed by the server.
 * Loads when the node selection changes and persists the whole list on every
 * mutation.
 */
export const useNodeAttachments = (
  courseId: string,
  nodeId: string
): UseNodeAttachmentsResult => {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // (Re)load when the selected node (or course) changes, clearing any stale
  // upload error once the new node's list resolves.
  useEffect(() => {
    let active = true;
    fetchAttachments(courseId, nodeId)
      .then((loaded) => {
        if (!active) return;
        setAttachments(loaded);
        setError(null);
      })
      .catch(() => {
        if (active) setAttachments([]);
      });
    return () => {
      active = false;
    };
  }, [courseId, nodeId]);

  const persist = useCallback(
    (next: Attachment[]) => {
      setAttachments(next);
      void saveAttachments(courseId, nodeId, next).catch(() => {});
    },
    [courseId, nodeId]
  );

  const uploadFiles = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;
      setError(null);

      // Reject the whole batch if any file is invalid, with a clear reason.
      const invalid = files
        .map(validateFile)
        .find((message) => message !== null);
      if (invalid) {
        setError(invalid);
        return;
      }

      setUploading(true);
      try {
        const uploaded = await Promise.all(
          files.map(async (file) => {
            const result = await uploadCourseFile(file);
            const attachment: Attachment = {
              id: crypto.randomUUID(),
              name: file.name,
              uploadedAt: new Date().toISOString(),
              ...result,
            };
            return attachment;
          })
        );
        persist([...uploaded, ...attachments]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed.");
      } finally {
        setUploading(false);
      }
    },
    [persist, attachments]
  );

  const removeAttachment = useCallback(
    (id: string) => {
      persist(attachments.filter((item) => item.id !== id));
    },
    [persist, attachments]
  );

  return { attachments, uploading, error, uploadFiles, removeAttachment };
};
