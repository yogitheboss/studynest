import type { Course } from "../types";

const STORAGE_KEY = "info_hub.courses.v1";

/** Read all persisted courses. Returns [] on any read/parse failure. */
export const loadCourses = (): Course[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Course[]) : [];
  } catch {
    return [];
  }
};

/** Persist the full course list. Silently no-ops if storage is unavailable. */
export const saveCourses = (courses: Course[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(courses));
  } catch {
    /* storage full or unavailable — non-fatal for this UI */
  }
};
