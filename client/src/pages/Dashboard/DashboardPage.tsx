import { useCallback, useMemo, useState } from "react";
import {
  GraduationCap,
  List,
  Network,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/stores/ui-store";
import {
  CourseContentUploader,
  CourseGraph,
  CourseOutline,
  CreateCourseDialog,
  flattenNodes,
  levelLabel,
  useCourses,
  type CourseNode,
} from "@/features/Courses";

type ViewMode = "graph" | "outline";

const UploadsView = () => (
  <div className="flex min-h-0 flex-1 flex-col gap-4">
    <div>
      <h2 className="text-xl font-semibold">Your Uploaded Content</h2>
      <p className="text-muted-foreground text-sm">
        Files and notes you upload will show up here.
      </p>
    </div>
    <div className="bg-muted/30 flex flex-1 flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-8 text-center">
      <div className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-full">
        <Upload className="size-6" />
      </div>
      <div>
        <p className="font-medium">Nothing uploaded yet</p>
        <p className="text-muted-foreground text-sm">
          Uploading content is coming next.
        </p>
      </div>
    </div>
  </div>
);

export const DashboardPage = () => {
  const activeTab = useUIStore((state) => state.activeTab);
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
  const [viewMode, setViewMode] = useState<ViewMode>("graph");

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

  if (activeTab === "uploads") {
    return <UploadsView />;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
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
          <div className="relative min-w-0 flex-1">
            {viewMode === "graph" ? (
              <CourseGraph
                course={selectedCourse}
                selectedNodeId={selectedNode?.id ?? null}
                onSelectNode={handleSelectNode}
              />
            ) : (
              <CourseOutline
                course={selectedCourse}
                selectedNodeId={selectedNode?.id ?? null}
                onSelectNode={handleSelectNode}
              />
            )}

            {/* View toggle — right side of the canvas */}
            <div
              className="bg-background/90 absolute top-3 right-3 z-20 flex items-center gap-0.5 rounded-lg border p-1 shadow-sm backdrop-blur"
              role="group"
              aria-label="View mode"
            >
              <Button
                variant={viewMode === "graph" ? "secondary" : "ghost"}
                size="icon-sm"
                onClick={() => setViewMode("graph")}
                aria-label="Graph view"
                aria-pressed={viewMode === "graph"}
              >
                <Network />
              </Button>
              <Button
                variant={viewMode === "outline" ? "secondary" : "ghost"}
                size="icon-sm"
                onClick={() => setViewMode("outline")}
                aria-label="List view"
                aria-pressed={viewMode === "outline"}
              >
                <List />
              </Button>
            </div>
          </div>

          {/* Selected node panel — the place where "add info" will live next.
              On small screens it covers the whole viewport with a close
              button in the top-left corner. */}
          {selectedNode && (
            <aside className="bg-card text-card-foreground fixed inset-0 z-50 overflow-y-auto p-4 md:static md:z-auto md:w-72 md:shrink-0 md:rounded-xl md:border">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setSelectedNode(null)}
                aria-label="Close"
                className="mb-3 md:hidden"
              >
                <X />
              </Button>
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
              <div className="mt-4">
                <h4 className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
                  Content
                </h4>
                <CourseContentUploader
                  courseId={selectedCourse.id}
                  nodeId={selectedNode.id}
                />
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
