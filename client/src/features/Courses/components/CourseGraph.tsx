import { useMemo, useState } from "react";
import {
  BookOpen,
  FileText,
  GraduationCap,
  Layers,
  Minus,
  Plus,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { Course, CourseNode } from "../types";
import { levelLabel } from "../types";
import {
  computeLayout,
  edgePath,
  NODE_HEIGHT,
  NODE_WIDTH,
} from "../lib/treeLayout";

interface CourseGraphProps {
  course: Course;
  selectedNodeId: string | null;
  onSelectNode: (node: CourseNode) => void;
}

/** Per-depth visual treatment, all sourced from theme tokens (dark-mode safe). */
interface NodeStyle {
  container: string;
  icon: LucideIcon;
}

const NODE_STYLES: NodeStyle[] = [
  {
    container: "bg-primary text-primary-foreground border-primary",
    icon: GraduationCap,
  },
  {
    container: "bg-accent text-accent-foreground border-accent",
    icon: Layers,
  },
  {
    container: "bg-secondary text-secondary-foreground border-secondary",
    icon: BookOpen,
  },
  {
    container: "bg-card text-card-foreground border-border",
    icon: FileText,
  },
];

const styleForDepth = (depth: number): NodeStyle =>
  NODE_STYLES[Math.min(depth, NODE_STYLES.length - 1)];

const ZOOM_STEP = 0.15;
const ZOOM_MIN = 0.4;
const ZOOM_MAX = 1.6;

export const CourseGraph = ({
  course,
  selectedNodeId,
  onSelectNode,
}: CourseGraphProps) => {
  const [zoom, setZoom] = useState<number>(1);

  const layout = useMemo(() => computeLayout(course.root), [course.root]);

  const zoomBy = (delta: number) =>
    setZoom((current) =>
      Math.min(
        ZOOM_MAX,
        Math.max(ZOOM_MIN, Number((current + delta).toFixed(2)))
      )
    );

  return (
    <div className="bg-muted/30 relative h-full w-full overflow-hidden rounded-xl border">
      {/* Controls */}
      <div className="bg-background/90 absolute top-3 right-3 z-10 flex items-center gap-1 rounded-lg border p-1 shadow-sm backdrop-blur">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => zoomBy(-ZOOM_STEP)}
          disabled={zoom <= ZOOM_MIN}
          aria-label="Zoom out"
        >
          <Minus />
        </Button>
        <span className="text-muted-foreground w-10 text-center text-xs tabular-nums">
          {Math.round(zoom * 100)}%
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => zoomBy(ZOOM_STEP)}
          disabled={zoom >= ZOOM_MAX}
          aria-label="Zoom in"
        >
          <Plus />
        </Button>
      </div>

      {/* Legend */}
      <div className="bg-background/90 absolute bottom-3 left-3 z-10 flex flex-wrap gap-2 rounded-lg border p-2 text-xs shadow-sm backdrop-blur">
        {NODE_STYLES.map((style, depth) => {
          const Icon = style.icon;
          return (
            <span
              key={levelLabel(depth)}
              className="text-muted-foreground flex items-center gap-1.5"
            >
              <span
                className={cn(
                  "flex size-4 items-center justify-center rounded border",
                  style.container
                )}
              >
                <Icon className="size-2.5" />
              </span>
              {levelLabel(depth)}
            </span>
          );
        })}
      </div>

      {/* Scrollable canvas */}
      <div className="h-full w-full overflow-auto p-2">
        <div
          className="relative origin-top-left"
          style={{
            width: layout.width,
            height: layout.height,
            transform: `scale(${zoom})`,
          }}
        >
          <svg
            className="pointer-events-none absolute inset-0"
            width={layout.width}
            height={layout.height}
          >
            {layout.edges.map((edge) => (
              <path
                key={edge.id}
                d={edgePath(edge)}
                fill="none"
                className="stroke-border"
                strokeWidth={2}
              />
            ))}
          </svg>

          {layout.nodes.map(({ node, x, y }) => {
            const style = styleForDepth(node.depth);
            const Icon = style.icon;
            const isSelected = node.id === selectedNodeId;
            return (
              <button
                key={node.id}
                type="button"
                onClick={() => onSelectNode(node)}
                style={{
                  left: x,
                  top: y,
                  width: NODE_WIDTH,
                  height: NODE_HEIGHT,
                }}
                className={cn(
                  "focus-visible:ring-ring/50 absolute flex items-center gap-2.5 rounded-lg border px-3 text-left shadow-sm transition-all hover:shadow-md focus-visible:ring-[3px] focus-visible:outline-none",
                  style.container,
                  isSelected &&
                    "ring-ring ring-offset-background ring-2 ring-offset-2"
                )}
              >
                <Icon className="size-4 shrink-0 opacity-90" />
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-medium">
                    {node.title}
                  </span>
                  <span className="truncate text-xs opacity-70">
                    {node.description ?? levelLabel(node.depth)}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
