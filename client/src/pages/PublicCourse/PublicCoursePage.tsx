import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { GraduationCap, List, Loader2, Lock, Network, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  CourseGraph,
  CourseOutline,
  ReadOnlyAttachments,
  ReadOnlyNotes,
  fetchPublicCourse,
  levelLabel,
  type Course,
  type CourseNode,
  type PublicCourse,
} from "@/features/Courses";

type ViewMode = "graph" | "outline";

type LoadState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; course: PublicCourse };

/**
 * Anonymous, read-only view of a course shared via its public link. Reachable
 * without signing in; the server only serves courses their owner made public.
 */
export const PublicCoursePage = () => {
  const { publicId } = useParams<{ publicId: string }>();
  const [state, setState] = useState<LoadState>(() =>
    publicId ? { status: "loading" } : { status: "error" }
  );
  const [viewMode, setViewMode] = useState<ViewMode>("graph");
  const [selectedNode, setSelectedNode] = useState<CourseNode | null>(null);

  useEffect(() => {
    if (!publicId) return;
    let active = true;
    fetchPublicCourse(publicId)
      .then((course) => {
        if (active) setState({ status: "ready", course });
      })
      .catch(() => {
        if (active) setState({ status: "error" });
      });
    return () => {
      active = false;
    };
  }, [publicId]);

  const handleSelectNode = useCallback((node: CourseNode) => {
    setSelectedNode((current) => (current?.id === node.id ? null : node));
  }, []);

  const ready = state.status === "ready" ? state.course : null;

  // CourseGraph/CourseOutline expect a full Course; synthesize the fields they
  // don't read (they only use `root`) so the public shape satisfies the type.
  const course = useMemo<Course | null>(
    () =>
      ready ? { ...ready, isPublic: true, publicId: publicId ?? "" } : null,
    [ready, publicId]
  );

  if (state.status === "loading") {
    return (
      <div className="text-muted-foreground flex h-screen flex-col items-center justify-center gap-2">
        <Loader2 className="size-6 animate-spin" />
        <p className="text-sm">Loading course…</p>
      </div>
    );
  }

  if (state.status === "error" || !course || !ready) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 p-8 text-center">
        <div className="bg-muted text-muted-foreground flex size-12 items-center justify-center rounded-full">
          <Lock className="size-6" />
        </div>
        <div>
          <p className="font-medium">Course unavailable</p>
          <p className="text-muted-foreground text-sm">
            This course is private or the link is no longer valid.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/">Go to StudyNest</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col gap-4 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-lg">
            <GraduationCap className="size-5" />
          </span>
          <div>
            <h1 className="text-lg font-semibold">{course.name}</h1>
            <p className="text-muted-foreground text-xs">
              Shared course · read-only
            </p>
          </div>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to="/">Open StudyNest</Link>
        </Button>
      </div>

      {/* Graph / outline + node panel */}
      <div className="flex min-h-0 flex-1 gap-4">
        <div className="relative min-w-0 flex-1">
          {viewMode === "graph" ? (
            <CourseGraph
              course={course}
              selectedNodeId={selectedNode?.id ?? null}
              onSelectNode={handleSelectNode}
            />
          ) : (
            <CourseOutline
              course={course}
              selectedNodeId={selectedNode?.id ?? null}
              onSelectNode={handleSelectNode}
            />
          )}

          {/* View toggle */}
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

        {selectedNode && (
          <aside className="bg-card text-card-foreground fixed inset-0 z-50 flex flex-col md:static md:z-auto md:w-72 md:shrink-0 md:rounded-xl md:border">
            <div className="bg-card sticky top-0 z-10 flex items-start gap-2 border-b p-4 md:border-b-0 md:pb-0">
              <div className="min-w-0 flex-1">
                <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  {levelLabel(selectedNode.depth)}
                </span>
                <h3 className="mt-1 text-base font-semibold break-words">
                  {selectedNode.title}
                </h3>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setSelectedNode(null)}
                aria-label="Close"
                className="-mr-1 shrink-0 md:hidden"
              >
                <X />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:pt-3">
              {selectedNode.description && (
                <p className="text-muted-foreground text-sm">
                  {selectedNode.description}
                </p>
              )}
              <div className="mt-4">
                <h4 className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
                  Notes
                </h4>
                <ReadOnlyNotes notes={ready.notes[selectedNode.id] ?? []} />
              </div>
              <div className="mt-6">
                <h4 className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
                  Content
                </h4>
                <ReadOnlyAttachments
                  attachments={ready.attachments[selectedNode.id] ?? []}
                />
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};
