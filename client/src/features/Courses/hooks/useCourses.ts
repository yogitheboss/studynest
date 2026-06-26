import { useCallback, useEffect, useMemo, useState } from "react";

import type { Course, CourseDraft } from "../types";
import {
  createCourse,
  deleteCourse,
  listCourses,
  setCourseVisibility,
} from "../services/coursesApi";

interface UseCoursesResult {
  courses: Course[];
  selectedCourse: Course | null;
  selectedId: string | null;
  /** True while the initial course list is loading. */
  loading: boolean;
  /** User-facing error from loading the list, or null. */
  error: string | null;
  selectCourse: (id: string | null) => void;
  /** Create a course on the server and select it. Rejects on failure. */
  addCourse: (draft: CourseDraft) => Promise<Course>;
  /** Delete a course on the server and drop it from the list. */
  removeCourse: (id: string) => Promise<void>;
  /** Toggle a course's public visibility; updates the cached share state. */
  setVisibility: (id: string, isPublic: boolean) => Promise<void>;
}

/**
 * Owns the signed-in user's course collection and the current selection,
 * backed by the server. Selection is kept valid as the collection changes.
 */
export const useCourses = (): UseCoursesResult => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load the collection once on mount and default the selection to the newest.
  useEffect(() => {
    let active = true;
    listCourses()
      .then((list) => {
        if (!active) return;
        setCourses(list);
        setSelectedId(list[0]?.id ?? null);
      })
      .catch((err: unknown) => {
        if (active)
          setError(
            err instanceof Error ? err.message : "Couldn't load courses."
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const selectCourse = useCallback((id: string | null) => {
    setSelectedId(id);
  }, []);

  const addCourse = useCallback(async (draft: CourseDraft) => {
    const course = await createCourse(draft);
    setCourses((prev) => [course, ...prev]);
    setSelectedId(course.id);
    return course;
  }, []);

  const removeCourse = useCallback(async (id: string) => {
    await deleteCourse(id);
    setCourses((prev) => {
      const remaining = prev.filter((course) => course.id !== id);
      setSelectedId((current) =>
        current === id ? (remaining[0]?.id ?? null) : current
      );
      return remaining;
    });
  }, []);

  const setVisibility = useCallback(async (id: string, isPublic: boolean) => {
    const next = await setCourseVisibility(id, isPublic);
    setCourses((prev) =>
      prev.map((course) =>
        course.id === id
          ? { ...course, isPublic: next.isPublic, publicId: next.publicId }
          : course
      )
    );
  }, []);

  const selectedCourse = useMemo(
    () => courses.find((course) => course.id === selectedId) ?? null,
    [courses, selectedId]
  );

  return {
    courses,
    selectedCourse,
    selectedId,
    loading,
    error,
    selectCourse,
    addCourse,
    removeCourse,
    setVisibility,
  };
};
