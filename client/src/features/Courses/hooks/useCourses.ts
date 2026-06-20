import { useCallback, useEffect, useMemo, useState } from "react";

import type { Course } from "../types";
import { loadCourses, saveCourses } from "../lib/storage";

interface UseCoursesResult {
  courses: Course[];
  selectedCourse: Course | null;
  selectedId: string | null;
  selectCourse: (id: string | null) => void;
  addCourse: (course: Course) => void;
  removeCourse: (id: string) => void;
}

/**
 * Owns the course collection and the current selection, backed by
 * localStorage. Selection is kept valid as the collection changes.
 */
export const useCourses = (): UseCoursesResult => {
  const [courses, setCourses] = useState<Course[]>(() => loadCourses());
  const [selectedId, setSelectedId] = useState<string | null>(
    () => loadCourses()[0]?.id ?? null
  );

  useEffect(() => {
    saveCourses(courses);
  }, [courses]);

  const selectCourse = useCallback((id: string | null) => {
    setSelectedId(id);
  }, []);

  const addCourse = useCallback((course: Course) => {
    setCourses((prev) => [course, ...prev]);
    setSelectedId(course.id);
  }, []);

  const removeCourse = useCallback(
    (id: string) => {
      setCourses((prev) => prev.filter((course) => course.id !== id));
      setSelectedId((current) => {
        if (current !== id) return current;
        const remaining = courses.filter((course) => course.id !== id);
        return remaining[0]?.id ?? null;
      });
    },
    [courses]
  );

  const selectedCourse = useMemo(
    () => courses.find((course) => course.id === selectedId) ?? null,
    [courses, selectedId]
  );

  return {
    courses,
    selectedCourse,
    selectedId,
    selectCourse,
    addCourse,
    removeCourse,
  };
};
