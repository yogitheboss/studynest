import { useMemo, useState } from "react";
import {
  BookOpen,
  ChevronRight,
  FileText,
  GraduationCap,
  Layers,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { Course, CourseNode } from "../types";
import { levelLabel } from "../types";

interface CourseOutlineProps {
  course: Course;
  selectedNodeId: string | null;
  onSelectNode: (node: CourseNode) => void;
}

const DEPTH_ICONS: LucideIcon[] = [GraduationCap, Layers, BookOpen, FileText];

const iconForDepth = (depth: number): LucideIcon =>
  DEPTH_ICONS[Math.min(depth, DEPTH_ICONS.length - 1)];

interface OutlineRowProps {
  node: CourseNode;
  selectedNodeId: string | null;
  onSelectNode: (node: CourseNode) => void;
  expanded: Set<string>;
  toggle: (id: string) => void;
}

const OutlineRow = ({
  node,
  selectedNodeId,
  onSelectNode,
  expanded,
  toggle,
}: OutlineRowProps) => {
  const Icon = iconForDepth(node.depth);
  const isSelected = node.id === selectedNodeId;
  const hasChildren = node.children.length > 0;
  const isOpen = expanded.has(node.id);

  return (
    <li>
      <div
        className={cn(
          "group flex items-center gap-1.5 rounded-md py-1.5 pr-2 text-sm transition-colors",
          isSelected ? "bg-accent" : "hover:bg-accent/50"
        )}
        style={{ paddingLeft: 8 + node.depth * 16 }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={() => toggle(node.id)}
            aria-label={isOpen ? "Collapse" : "Expand"}
            className="text-muted-foreground hover:text-foreground flex size-5 shrink-0 items-center justify-center rounded"
          >
            <ChevronRight
              className={cn(
                "size-3.5 transition-transform",
                isOpen && "rotate-90"
              )}
            />
          </button>
        ) : (
          <span className="size-5 shrink-0" />
        )}

        <button
          type="button"
          onClick={() => onSelectNode(node)}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          <Icon className="text-primary size-3.5 shrink-0" />
          <span className="truncate font-medium">{node.title}</span>
          <span className="text-muted-foreground hidden text-xs sm:inline">
            {levelLabel(node.depth)}
          </span>
        </button>
      </div>

      {hasChildren && isOpen && (
        <ul>
          {node.children.map((child) => (
            <OutlineRow
              key={child.id}
              node={child}
              selectedNodeId={selectedNodeId}
              onSelectNode={onSelectNode}
              expanded={expanded}
              toggle={toggle}
            />
          ))}
        </ul>
      )}
    </li>
  );
};

const collectIds = (node: CourseNode, into: Set<string>): Set<string> => {
  into.add(node.id);
  for (const child of node.children) collectIds(child, into);
  return into;
};

export const CourseOutline = ({
  course,
  selectedNodeId,
  onSelectNode,
}: CourseOutlineProps) => {
  const initialExpanded = useMemo(
    () => collectIds(course.root, new Set<string>()),
    [course.root]
  );
  const [expanded, setExpanded] = useState<Set<string>>(initialExpanded);

  const toggle = (id: string) =>
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="bg-muted/30 h-full w-full overflow-auto rounded-xl border p-3">
      <ul>
        <OutlineRow
          node={course.root}
          selectedNodeId={selectedNodeId}
          onSelectNode={onSelectNode}
          expanded={expanded}
          toggle={toggle}
        />
      </ul>
    </div>
  );
};
