import type { Attachment } from "../types";

/** API origin. Mirrors the auth client's fallback for local development. */
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  import.meta.env.VITE_AUTH_BASE_URL ??
  "http://localhost:3000";

/** Maximum upload size, kept in sync with the server (10 MB). */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

/**
 * Accepted MIME types — images and common document formats. Kept in sync with
 * the server's ALLOWED_MIME_TYPES so the client can reject early with a clear
 * message instead of round-tripping a doomed upload.
 */
export const ACCEPTED_MIME_TYPES: readonly string[] = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "text/markdown",
  "text/csv",
];

/** Value for an <input type="file"> accept attribute. */
export const ACCEPT_ATTRIBUTE = `${ACCEPTED_MIME_TYPES.join(",")},.md`;

/** Server's response shape for a successful upload. */
interface UploadResponse {
  url: string;
  name: string;
}

/**
 * Validate a file against the accepted types and size limit.
 * Returns an error message, or null when the file is acceptable.
 */
export const validateFile = (file: File): string | null => {
  // Some browsers report an empty type for .md; allow by extension as a fallback.
  const typeOk =
    ACCEPTED_MIME_TYPES.includes(file.type) ||
    (file.type === "" && /\.(md|markdown|txt|csv)$/i.test(file.name));
  if (!typeOk) {
    return `"${file.name}" is not a supported type. Upload an image or document.`;
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return `"${file.name}" is larger than 10 MB.`;
  }
  return null;
};

/**
 * Upload one file to the server, which stores it in GCS and returns its public
 * URL. Throws an Error with a user-facing message on failure.
 */
export const uploadCourseFile = async (
  file: File
): Promise<Pick<Attachment, "url" | "objectName" | "contentType" | "size">> => {
  const body = new FormData();
  body.append("file", file);

  const response = await fetch(`${API_BASE_URL}/api/upload`, {
    method: "POST",
    body,
    credentials: "include",
  });

  if (!response.ok) {
    const message = await response
      .json()
      .then((data: { error?: string }) => data.error)
      .catch(() => null);
    throw new Error(message ?? `Upload failed (${response.status}).`);
  }

  const data: UploadResponse = await response.json();
  return {
    url: data.url,
    objectName: data.name,
    contentType: file.type,
    size: file.size,
  };
};
