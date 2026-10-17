import { request } from "@/lib/api";
import type {
  Attachment,
  Course,
  CourseDraft,
  CourseNode,
  Note,
} from "../types";

const seg = encodeURIComponent;

/** A public course as served to anonymous viewers — read-only, no owner data. */
export interface PublicCourse {
  id: string;
  name: string;
  root: CourseNode;
  notes: Record<string, Note[]>;
  attachments: Record<string, Attachment[]>;
  createdAt: string;
}

/** List the signed-in user's own courses (newest first). */
export const listCourses = (): Promise<Course[]> => request("/api/courses");

/** Create a course from a parsed draft; the server fills in id/share fields. */
export const createCourse = (draft: CourseDraft): Promise<Course> =>
  request("/api/courses", {
    method: "POST",
    body: JSON.stringify({ name: draft.name, root: draft.root }),
  });

/** Replace a course's edited tree (and name); returns the updated course. */
export const updateCourse = (
  id: string,
  payload: { name?: string; root: CourseNode }
): Promise<Course> =>
  request(`/api/courses/${seg(id)}`, {
    method: "PUT",
    body: JSON.stringify({ name: payload.name, root: payload.root }),
  });

/** Permanently delete one of the user's courses. */
export const deleteCourse = (id: string): Promise<void> =>
  request(`/api/courses/${seg(id)}`, { method: "DELETE" });

/** Flip a course public/private. Returns the new state and its share token. */
export const setCourseVisibility = (
  id: string,
  isPublic: boolean
): Promise<{ isPublic: boolean; publicId: string }> =>
  request(`/api/courses/${seg(id)}/visibility`, {
    method: "PATCH",
    body: JSON.stringify({ isPublic }),
  });

/** Fetch the notes for a single node. */
export const fetchNotes = (courseId: string, nodeId: string): Promise<Note[]> =>
  request(`/api/courses/${seg(courseId)}/notes/${seg(nodeId)}`);

/** Replace the notes for a single node; returns the saved list. */
export const saveNotes = (
  courseId: string,
  nodeId: string,
  notes: Note[]
): Promise<Note[]> =>
  request(`/api/courses/${seg(courseId)}/notes/${seg(nodeId)}`, {
    method: "PUT",
    body: JSON.stringify({ notes }),
  });

/** Fetch the attachments for a single node. */
export const fetchAttachments = (
  courseId: string,
  nodeId: string
): Promise<Attachment[]> =>
  request(`/api/courses/${seg(courseId)}/attachments/${seg(nodeId)}`);

/** Replace the attachments for a single node; returns the saved list. */
export const saveAttachments = (
  courseId: string,
  nodeId: string,
  attachments: Attachment[]
): Promise<Attachment[]> =>
  request(`/api/courses/${seg(courseId)}/attachments/${seg(nodeId)}`, {
    method: "PUT",
    body: JSON.stringify({ attachments }),
  });

/** Fetch a publicly shared course by its share token. No auth required. */
export const fetchPublicCourse = (publicId: string): Promise<PublicCourse> =>
  request(`/api/public/courses/${seg(publicId)}`);
