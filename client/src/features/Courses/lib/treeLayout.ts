import type { CourseNode } from "../types";

/** A node positioned in the graph canvas. */
export interface LayoutNode {
  node: CourseNode;
  /** Top-left corner of the node box, in canvas px. */
  x: number;
  y: number;
}

/** A connector between a parent and child node (center points). */
export interface LayoutEdge {
  id: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}

export interface GraphLayout {
  nodes: LayoutNode[];
  edges: LayoutEdge[];
  width: number;
  height: number;
}

export const NODE_WIDTH = 220;
export const NODE_HEIGHT = 64;

/** Horizontal gap between depth columns and vertical gap between siblings. */
const COLUMN_GAP = 120;
const ROW_GAP = 28;
const PADDING = 40;

const COLUMN_STRIDE = NODE_WIDTH + COLUMN_GAP;
const ROW_STRIDE = NODE_HEIGHT + ROW_GAP;

/**
 * Compute a left-to-right "tidy tree" layout: leaves occupy successive rows,
 * each parent is vertically centered on the span of its children. Single pass,
 * O(n).
 */
export const computeLayout = (root: CourseNode): GraphLayout => {
  const nodes: LayoutNode[] = [];
  const edges: LayoutEdge[] = [];

  let nextLeafRow = 0;

  const centerOf = (placed: LayoutNode) => ({
    cx: placed.x + NODE_WIDTH / 2,
    cy: placed.y + NODE_HEIGHT / 2,
  });

  /** Returns the placed node so the parent can read its center for the edge. */
  const place = (node: CourseNode): LayoutNode => {
    const x = PADDING + node.depth * COLUMN_STRIDE;

    let y: number;
    if (node.children.length === 0) {
      y = PADDING + nextLeafRow * ROW_STRIDE;
      nextLeafRow += 1;
    } else {
      const placedChildren = node.children.map(place);
      const first = placedChildren[0].y;
      const last = placedChildren[placedChildren.length - 1].y;
      y = (first + last) / 2;
    }

    const placed: LayoutNode = { node, x, y };
    nodes.push(placed);

    // Wire edges to children (children were placed above, in tree order).
    if (node.children.length > 0) {
      const { cx, cy } = centerOf(placed);
      for (const child of node.children) {
        const childPlaced = nodes.find((n) => n.node.id === child.id);
        if (!childPlaced) continue;
        const childCenter = centerOf(childPlaced);
        edges.push({
          id: `${node.id}->${child.id}`,
          fromX: cx,
          fromY: cy,
          toX: childCenter.cx,
          toY: childCenter.cy,
        });
      }
    }

    return placed;
  };

  place(root);

  let maxX = 0;
  let maxY = 0;
  for (const placed of nodes) {
    maxX = Math.max(maxX, placed.x + NODE_WIDTH);
    maxY = Math.max(maxY, placed.y + NODE_HEIGHT);
  }

  return {
    nodes,
    edges,
    width: maxX + PADDING,
    height: maxY + PADDING,
  };
};

/**
 * Build an SVG cubic-bezier path between two points, curving horizontally —
 * matches the left-to-right column flow.
 */
export const edgePath = (edge: LayoutEdge): string => {
  const midX = (edge.fromX + edge.toX) / 2;
  return `M ${edge.fromX} ${edge.fromY} C ${midX} ${edge.fromY}, ${midX} ${edge.toY}, ${edge.toX} ${edge.toY}`;
};
