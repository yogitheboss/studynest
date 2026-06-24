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

/** Vertical gap between depth levels and horizontal gap between siblings. */
const LEVEL_GAP = 32;
const SIBLING_GAP = 12;
const PADDING = 24;

const ROW_STRIDE = NODE_HEIGHT + LEVEL_GAP;
const COLUMN_STRIDE = NODE_WIDTH + SIBLING_GAP;

/**
 * Compute a top-down "tidy tree" layout: depth flows down the Y axis, leaves
 * occupy successive columns across the X axis, and each parent is horizontally
 * centered on the span of its children. Single pass, O(n).
 */
export const computeLayout = (root: CourseNode): GraphLayout => {
  const nodes: LayoutNode[] = [];
  const edges: LayoutEdge[] = [];

  let nextLeafColumn = 0;

  const centerOf = (placed: LayoutNode) => ({
    cx: placed.x + NODE_WIDTH / 2,
    cy: placed.y + NODE_HEIGHT / 2,
  });

  /** Returns the placed node so the parent can read its center for the edge. */
  const place = (node: CourseNode): LayoutNode => {
    const y = PADDING + node.depth * ROW_STRIDE;

    let x: number;
    if (node.children.length === 0) {
      x = PADDING + nextLeafColumn * COLUMN_STRIDE;
      nextLeafColumn += 1;
    } else {
      const placedChildren = node.children.map(place);
      const first = placedChildren[0].x;
      const last = placedChildren[placedChildren.length - 1].x;
      x = (first + last) / 2;
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
 * Build an SVG cubic-bezier path between two points, curving vertically —
 * matches the top-down level flow.
 */
export const edgePath = (edge: LayoutEdge): string => {
  const midY = (edge.fromY + edge.toY) / 2;
  return `M ${edge.fromX} ${edge.fromY} C ${edge.fromX} ${midY}, ${edge.toX} ${midY}, ${edge.toX} ${edge.toY}`;
};
