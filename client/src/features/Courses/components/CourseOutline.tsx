import { useMemo, useState } from "react";
import {
  BookOpen,
  ChevronRight,
  FileText,
  GraduationCap,
  Layers,
  Plus,
  Trash2,
  X,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { Course, CourseNode } from "../types";
import { levelLabel, MAX_COURSE_DEPTH } from "../types";

interface CourseOutlineProps {
  course: Course;
  selectedNodeId: string | null;
  onSelectNode: (node: CourseNode) => void;
  /** Called when a node is hovered/focused — used to warm its content. */
  onHoverNode?: (node: CourseNode) => void;
  /** Append a child under `parent`. Omit to render the outline read-only. */
  onAddChild?: (parent: CourseNode, title: string) => void;
  /** Remove `node` and its subtree. Omit to render the outline read-only. */
  onRemoveNode?: (node: CourseNode) => void;
}

const DEPTH_ICONS: LucideIcon[] = [GraduationCap, Layers, BookOpen, FileText];

const iconForDepth = (depth: number): LucideIcon =>
  DEPTH_ICONS[Math.min(depth, DEPTH_ICONS.length - 1)];

interface OutlineRowProps {
  node: CourseNode;
  selectedNodeId: string | null;
  onSelectNode: (node: CourseNode) => void;
  onHoverNode?: (node: CourseNode) => void;
  onAddChild?: (parent: CourseNode, title: string) => void;
  onRemoveNode?: (node: CourseNode) => void;
  expanded: Set<string>;
  toggle: (id: string) => void;
  /** Id of the node whose inline "add child" input is currently open. */
  addingTo: string | null;
  startAdd: (id: string) => void;
  cancelAdd: () => void;
}

const OutlineRow = ({
  node,
  selectedNodeId,
  onSelectNode,
  onHoverNode,
  onAddChild,
  onRemoveNode,
  expanded,
  toggle,
  addingTo,
  startAdd,
  cancelAdd,
}: OutlineRowProps) => {
  const Icon = iconForDepth(node.depth);
  const isSelected = node.id === selectedNodeId;
  const hasChildren = node.children.length > 0;
  const isOpen = expanded.has(node.id);
  const editable = Boolean(onAddChild && onRemoveNode);
  const canAddChild = node.depth < MAX_COURSE_DEPTH;
  const canRemove = node.depth > 0; // the root is the course itself
  const isAdding = addingTo === node.id;

  const childIndent = 8 + (node.depth + 1) * 16;

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
          onPointerEnter={() => onHoverNode?.(node)}
          onFocus={() => onHoverNode?.(node)}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          <Icon className="text-primary size-3.5 shrink-0" />
          <span className="truncate font-medium">{node.title}</span>
          <span className="text-muted-foreground hidden text-xs sm:inline">
            {levelLabel(node.depth)}
          </span>
        </button>

        {editable && (
          <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
            {canAddChild && (
              <button
                type="button"
                onClick={() => startAdd(node.id)}
                aria-label={`Add ${levelLabel(node.depth + 1)} under ${node.title}`}
                title={`Add ${levelLabel(node.depth + 1)}`}
                className="text-muted-foreground hover:text-foreground flex size-6 items-center justify-center rounded"
              >
                <Plus className="size-3.5" />
              </button>
            )}
            {canRemove && (
              <button
                type="button"
                onClick={() => onRemoveNode?.(node)}
                aria-label={`Delete ${node.title}`}
                title="Delete"
                className="text-muted-foreground hover:text-destructive flex size-6 items-center justify-center rounded"
              >
                <Trash2 className="size-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {hasChildren && isOpen && (
        <ul>
          {node.children.map((child) => (
            <OutlineRow
              key={child.id}
              node={child}
              selectedNodeId={selectedNodeId}
              onSelectNode={onSelectNode}
              onHoverNode={onHoverNode}
              onAddChild={onAddChild}
              onRemoveNode={onRemoveNode}
              expanded={expanded}
              toggle={toggle}
              addingTo={addingTo}
              startAdd={startAdd}
              cancelAdd={cancelAdd}
            />
          ))}
        </ul>
      )}

      {isAdding && onAddChild && (
        <AddChildInput
          placeholder={`New ${levelLabel(node.depth + 1)}`}
          indent={childIndent}
          onSubmit={(title) => onAddChild(node, title)}
          onCancel={cancelAdd}
        />
      )}
    </li>
  );
};

interface AddChildInputProps {
  placeholder: string;
  indent: number;
  /** Commit a non-empty title. The input stays open so siblings add quickly. */
  onSubmit: (title: string) => void;
  onCancel: () => void;
}

const AddChildInput = ({
  placeholder,
  indent,
  onSubmit,
  onCancel,
}: AddChildInputProps) => {
  const [value, setValue] = useState("");

  const commit = () => {
    const title = value.trim();
    if (!title) return;
    onSubmit(title);
    setValue("");
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        commit();
      }}
      className="flex items-center gap-1.5 py-1 pr-2"
      style={{ paddingLeft: indent }}
    >
      <input
        autoFocus
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape") onCancel();
        }}
        onBlur={() => {
          if (value.trim() === "") onCancel();
        }}
        placeholder={placeholder}
        className="border-input bg-background focus-visible:ring-ring h-7 min-w-0 flex-1 rounded-md border px-2 text-sm focus-visible:ring-1 focus-visible:outline-none"
      />
      <button
        type="submit"
        aria-label="Add"
        className="bg-primary text-primary-foreground hover:bg-primary/90 flex size-7 shrink-0 items-center justify-center rounded-md"
      >
        <Plus className="size-3.5" />
      </button>
      <button
        type="button"
        onClick={onCancel}
        aria-label="Cancel"
        className="text-muted-foreground hover:text-foreground flex size-7 shrink-0 items-center justify-center rounded-md"
      >
        <X className="size-3.5" />
      </button>
    </form>
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
  onHoverNode,
  onAddChild,
  onRemoveNode,
}: CourseOutlineProps) => {
  const initialExpanded = useMemo(
    () => collectIds(course.root, new Set<string>()),
    [course.root]
  );
  const [expanded, setExpanded] = useState<Set<string>>(initialExpanded);
  const [addingTo, setAddingTo] = useState<string | null>(null);

  const toggle = (id: string) =>
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const startAdd = (id: string) => {
    // Expand the parent so the new child (and its input) are visible.
    setExpanded((current) => new Set(current).add(id));
    setAddingTo(id);
  };
  const cancelAdd = () => setAddingTo(null);

  return (
    <div className="bg-muted/30 h-full w-full overflow-auto rounded-xl border p-3">
      <ul>
        <OutlineRow
          node={course.root}
          selectedNodeId={selectedNodeId}
          onSelectNode={onSelectNode}
          onHoverNode={onHoverNode}
          onAddChild={onAddChild}
          onRemoveNode={onRemoveNode}
          expanded={expanded}
          toggle={toggle}
          addingTo={addingTo}
          startAdd={startAdd}
          cancelAdd={cancelAdd}
        />
      </ul>
    </div>
  );
};
