import type { CourseNode } from "../types";

/**
 * Pure helpers for editing a course tree. Each returns a new tree (structural
 * copy along the changed path) and leaves existing node ids untouched so the
 * per-node notes/attachments — keyed by id — stay attached to their nodes.
 */

/** A fresh, position-independent id for a newly added node. */
const newNodeId = (): string => `node-${crypto.randomUUID()}`;

/**
 * Append a new child under the node matching `parentId`. The child's depth (and
 * therefore its "kind": Module/Topic/Subtopic) follows from the parent's depth.
 */
export const addChildNode = (
  root: CourseNode,
  parentId: string,
  fields: { title: string; description?: string }
): CourseNode => {
  const visit = (node: CourseNode): CourseNode => {
    if (node.id === parentId) {
      const child: CourseNode = {
        id: newNodeId(),
        title: fields.title,
        description: fields.description,
        depth: node.depth + 1,
        children: [],
      };
      return { ...node, children: [...node.children, child] };
    }
    if (node.children.length === 0) return node;
    return { ...node, children: node.children.map(visit) };
  };
  return visit(root);
};

/**
 * Remove the node matching `nodeId` (and its whole subtree). The root cannot be
 * removed — that's the course itself — so it is returned unchanged in that case.
 */
export const removeNode = (root: CourseNode, nodeId: string): CourseNode => {
  if (root.id === nodeId) return root;
  const prune = (node: CourseNode): CourseNode => ({
    ...node,
    children: node.children.filter((child) => child.id !== nodeId).map(prune),
  });
  return prune(root);
};
