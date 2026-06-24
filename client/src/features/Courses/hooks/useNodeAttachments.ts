import { useCallback, useEffect, useState } from "react";

import type { Attachment } from "../types";
import { loadAttachments, saveAttachments } from "../lib/attachments";
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
 * Owns the attachments for a single course node, backed by localStorage.
 * Re-reads when the node selection changes and persists on every mutation.
 */
export const useNodeAttachments = (
  courseId: string,
  nodeId: string
): UseNodeAttachmentsResult => {
  const [attachments, setAttachments] = useState<Attachment[]>(() =>
    loadAttachments(courseId, nodeId)
  );
  const [uploading, setUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Reload when the selected node (or course) changes.
  useEffect(() => {
    setAttachments(loadAttachments(courseId, nodeId));
    setError(null);
  }, [courseId, nodeId]);

  // Persist after any change to this node's list.
  useEffect(() => {
    saveAttachments(courseId, nodeId, attachments);
  }, [courseId, nodeId, attachments]);

  const uploadFiles = useCallback(async (files: File[]) => {
    if (files.length === 0) return;
    setError(null);

    // Reject the whole batch if any file is invalid, with a clear reason.
    const invalid = files.map(validateFile).find((message) => message !== null);
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
      setAttachments((prev) => [...uploaded, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }, []);

  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => prev.filter((item) => item.id !== id));
  }, []);

  return { attachments, uploading, error, uploadFiles, removeAttachment };
};
