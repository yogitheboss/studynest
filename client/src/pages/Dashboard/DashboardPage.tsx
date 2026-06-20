import { useCallback, useMemo, useState } from "react";
import { GraduationCap, Plus, Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  CourseGraph,
  CreateCourseDialog,
  flattenNodes,
  levelLabel,
  useCourses,
  type CourseNode,
} from "@/features/Courses";

export const DashboardPage = () => {
  const {
    courses,
    selectedCourse,
    selectedId,
    selectCourse,
    addCourse,
    removeCourse,
  } = useCourses();
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [selectedNode, setSelectedNode] = useState<CourseNode | null>(null);

  // "Adding info to a node" lands here later — for now we just track selection.
  const handleSelectNode = useCallback((node: CourseNode) => {
    setSelectedNode((current) => (current?.id === node.id ? null : node));
  }, []);

  const handleSelectCourse = useCallback(
    (id: string) => {
      selectCourse(id);
      setSelectedNode(null);
    },
    [selectCourse]
  );

  const nodeCount = useMemo(
    () => (selectedCourse ? flattenNodes(selectedCourse.root).length : 0),
    [selectedCourse]
  );

  return (
    <div className="flex h-[calc(100svh-3.5rem)] flex-col gap-4">
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-semibold">Courses</h2>
          <p className="text-muted-foreground text-sm">
            {selectedCourse
              ? `${selectedCourse.name} · ${nodeCount} node${nodeCount === 1 ? "" : "s"}`
              : "Upload a course outline as JSON to visualize it as a graph."}
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus />
          New course
        </Button>
      </div>

      {/* Course chips */}
      {courses.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {courses.map((course) => (
            <div
              key={course.id}
              className={cn(
                "group flex items-center gap-1 rounded-full border px-1 py-1 text-sm transition-colors",
                course.id === selectedId
                  ? "border-primary bg-primary/10"
                  : "border-border hover:bg-accent/50"
              )}
            >
              <button
                type="button"
                onClick={() => handleSelectCourse(course.id)}
                className="flex items-center gap-1.5 rounded-full px-2 py-0.5"
              >
                <GraduationCap className="text-primary size-3.5" />
                {course.name}
              </button>
              <button
                type="button"
                onClick={() => removeCourse(course.id)}
                aria-label={`Delete ${course.name}`}
                className="text-muted-foreground hover:text-destructive rounded-full p-1 opacity-0 transition-opacity group-hover:opacity-100"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Graph / empty state */}
      {selectedCourse ? (
        <div className="flex min-h-0 flex-1 gap-4">
          <div className="min-w-0 flex-1">
            <CourseGraph
              course={selectedCourse}
              selectedNodeId={selectedNode?.id ?? null}
              onSelectNode={handleSelectNode}
            />
          </div>

          {/* Selected node panel — the place where "add info" will live next. */}
          {selectedNode && (
            <aside className="bg-card text-card-foreground w-72 shrink-0 overflow-y-auto rounded-xl border p-4">
              <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                {levelLabel(selectedNode.depth)}
              </span>
              <h3 className="mt-1 text-base font-semibold">
                {selectedNode.title}
              </h3>
              {selectedNode.description && (
                <p className="text-muted-foreground mt-2 text-sm">
                  {selectedNode.description}
                </p>
              )}
              <p className="text-muted-foreground mt-4 text-xs">
                {selectedNode.children.length} direct child
                {selectedNode.children.length === 1 ? "" : "ren"}
              </p>
              <div className="text-muted-foreground mt-4 rounded-lg border border-dashed p-3 text-center text-xs">
                Attaching notes &amp; resources to this node is coming next.
              </div>
            </aside>
          )}
        </div>
      ) : (
        <div className="bg-muted/30 flex flex-1 flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-8 text-center">
          <div className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-full">
            <GraduationCap className="size-6" />
          </div>
          <div>
            <p className="font-medium">No course yet</p>
            <p className="text-muted-foreground text-sm">
              Create your first course to see it as an interactive graph.
            </p>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus />
            New course
          </Button>
        </div>
      )}

      <CreateCourseDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreated={addCourse}
      />
    </div>
  );
};
