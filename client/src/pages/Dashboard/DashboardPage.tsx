import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
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
  CourseNotes,
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

const REVEAL_MS = 380;

interface SelectedNodePanelProps {
  node: CourseNode;
  courseId: string;
  /** Viewport coordinates the reveal expands from (the tap point). */
  origin: { x: number; y: number };
  /** Flips to true when a close has been requested; triggers the exit reveal. */
  closing: boolean;
  /** Called when the user asks to close (X button). */
  onClose: () => void;
  /** Called once the exit animation has finished and the panel can unmount. */
  onClosed: () => void;
}

const SelectedNodePanel = ({
  node,
  courseId,
  origin,
  closing,
  onClose,
  onClosed,
}: SelectedNodePanelProps) => {
  // Decide once, at mount, whether to play the circular reveal. It only makes
  // sense on small screens (the panel is fullscreen there); on md+ it's a
  // static sidebar where a viewport-origin circle would clip oddly.
  const [animate] = useState(() => {
    if (typeof window === "undefined") return false;
    const isSmall = window.matchMedia("(max-width: 767px)").matches;
    const motionOk = !window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches;
    return isSmall && motionOk;
  });
  // `mounted` flips on the frame after mount so the 0-radius start state is
  // painted first; the reveal is then derived (open while mounted & not closing).
  const [mounted, setMounted] = useState(false);
  const revealed = mounted && !closing;

  useEffect(() => {
    if (!animate) return;
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, [animate]);

  // Without an animation there's no transition to wait on, so a close request
  // must unmount the panel directly.
  useEffect(() => {
    if (closing && !animate) onClosed();
  }, [closing, animate, onClosed]);

  const clipStyle: CSSProperties | undefined = useMemo(() => {
    if (!animate) return undefined;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    // Radius reaching the farthest corner so the circle fully covers the screen.
    const radius = Math.hypot(
      Math.max(origin.x, vw - origin.x),
      Math.max(origin.y, vh - origin.y)
    );
    return {
      clipPath: `circle(${revealed ? radius : 0}px at ${origin.x}px ${origin.y}px)`,
      transition: `clip-path ${REVEAL_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`,
      willChange: "clip-path",
    };
  }, [animate, origin, revealed]);

  const handleTransitionEnd = (event: React.TransitionEvent<HTMLElement>) => {
    if (event.propertyName === "clip-path" && closing) onClosed();
  };

  return (
    <aside
      style={clipStyle}
      onTransitionEnd={handleTransitionEnd}
      className="bg-card text-card-foreground fixed inset-0 z-50 flex flex-col md:static md:z-auto md:w-72 md:shrink-0 md:rounded-xl md:border"
    >
      {/* Header — sticky on mobile so the close button stays reachable */}
      <div className="bg-card sticky top-0 z-10 flex items-start gap-2 border-b p-4 md:border-b-0 md:pb-0">
        <div className="min-w-0 flex-1">
          <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            {levelLabel(node.depth)}
          </span>
          <h3 className="mt-1 text-base font-semibold break-words">
            {node.title}
          </h3>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          aria-label="Close"
          className="-mr-1 shrink-0 md:hidden"
        >
          <X />
        </Button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 md:pt-3">
        {node.description && (
          <p className="text-muted-foreground text-sm">{node.description}</p>
        )}
        <p className="text-muted-foreground mt-4 text-xs">
          {node.children.length} direct child
          {node.children.length === 1 ? "" : "ren"}
        </p>
        <div className="mt-4">
          <h4 className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
            Notes
          </h4>
          <CourseNotes courseId={courseId} nodeId={node.id} />
        </div>
        <div className="mt-6">
          <h4 className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
            Content
          </h4>
          <CourseContentUploader courseId={courseId} nodeId={node.id} />
        </div>
      </div>
    </aside>
  );
};

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
  const [panelClosing, setPanelClosing] = useState<boolean>(false);
  // Point the panel's reveal expands from — captured from the tap that opened it.
  const [panelOrigin, setPanelOrigin] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [viewMode, setViewMode] = useState<ViewMode>("graph");

  // Track the last pointer position so the panel can reveal from the tap point.
  const originRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  useEffect(() => {
    const handlePointer = (event: PointerEvent) => {
      originRef.current = { x: event.clientX, y: event.clientY };
    };
    window.addEventListener("pointerdown", handlePointer, true);
    return () => window.removeEventListener("pointerdown", handlePointer, true);
  }, []);

  const handleSelectNode = useCallback((node: CourseNode) => {
    setSelectedNode((current) => {
      // Tapping the already-open node requests a close (with exit animation).
      if (current?.id === node.id) {
        setPanelClosing(true);
        return current;
      }
      setPanelOrigin(originRef.current);
      setPanelClosing(false);
      return node;
    });
  }, []);

  const closePanel = useCallback(() => setPanelClosing(true), []);

  // Exit animation finished (or wasn't needed) — actually unmount the panel.
  const handlePanelClosed = useCallback(() => {
    setSelectedNode(null);
    setPanelClosing(false);
  }, []);

  const handleSelectCourse = useCallback(
    (id: string) => {
      selectCourse(id);
      setSelectedNode(null);
      setPanelClosing(false);
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
            <SelectedNodePanel
              key={selectedNode.id}
              node={selectedNode}
              courseId={selectedCourse.id}
              origin={panelOrigin}
              closing={panelClosing}
              onClose={closePanel}
              onClosed={handlePanelClosed}
            />
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
