import { courseService } from "./courses.service.js";
import {
  attachmentsSchema,
  createCourseSchema,
  notesSchema,
  updateCourseSchema,
  visibilitySchema,
} from "./courses.schema.js";

// Request/response layer. Validates input with the zod schemas, delegates the
// actual work to courseService, and maps results/null into HTTP responses.
// All owner routes assume requireAuth has populated req.session.

const NOT_FOUND = { error: "Course not found" };

export const courseController = {
  // GET /api/courses
  async list(req, res) {
    const list = await courseService.listByOwner(req.session.user.id);
    res.json(list);
  },

  // POST /api/courses
  async create(req, res) {
    const parsed = createCourseSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      const message =
        parsed.error.issues[0]?.message ?? "Invalid course payload.";
      return res.status(400).json({ error: message });
    }
    const { name, root } = parsed.data;
    const course = await courseService.create({
      ownerId: req.session.user.id,
      name: name ?? root.title, // fall back to the root node's title
      root,
    });
    res.status(201).json(course);
  },

  // PUT /api/courses/:id — replace the edited tree (and name).
  async update(req, res) {
    const parsed = updateCourseSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      const message =
        parsed.error.issues[0]?.message ?? "Invalid course payload.";
      return res.status(400).json({ error: message });
    }
    const { name, root } = parsed.data;
    const course = await courseService.updateTree(
      req.params.id,
      req.session.user.id,
      { name: name ?? root.title, root }
    );
    if (!course) return res.status(404).json(NOT_FOUND);
    res.json(course);
  },

  // DELETE /api/courses/:id
  async remove(req, res) {
    const deleted = await courseService.remove(
      req.params.id,
      req.session.user.id
    );
    if (!deleted) return res.status(404).json(NOT_FOUND);
    res.status(204).end();
  },

  // PATCH /api/courses/:id/visibility
  async setVisibility(req, res) {
    const parsed = visibilitySchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return res.status(400).json({ error: "`isPublic` must be a boolean." });
    }
    const result = await courseService.setVisibility(
      req.params.id,
      req.session.user.id,
      parsed.data.isPublic
    );
    if (!result) return res.status(404).json(NOT_FOUND);
    res.json(result);
  },

  // GET /api/courses/:id/notes/:nodeId
  async getNotes(req, res) {
    const notes = await courseService.getNotes(
      req.params.id,
      req.session.user.id,
      req.params.nodeId
    );
    if (notes === null) return res.status(404).json(NOT_FOUND);
    res.json(notes);
  },

  // PUT /api/courses/:id/notes/:nodeId
  async replaceNotes(req, res) {
    const notes = notesSchema.parse(req.body?.notes);
    const saved = await courseService.replaceNotes(
      req.params.id,
      req.session.user.id,
      req.params.nodeId,
      notes
    );
    if (saved === null) return res.status(404).json(NOT_FOUND);
    res.json(saved);
  },

  // GET /api/courses/:id/attachments/:nodeId
  async getAttachments(req, res) {
    const attachments = await courseService.getAttachments(
      req.params.id,
      req.session.user.id,
      req.params.nodeId
    );
    if (attachments === null) return res.status(404).json(NOT_FOUND);
    res.json(attachments);
  },

  // PUT /api/courses/:id/attachments/:nodeId
  async replaceAttachments(req, res) {
    const attachments = attachmentsSchema.parse(req.body?.attachments);
    const saved = await courseService.replaceAttachments(
      req.params.id,
      req.session.user.id,
      req.params.nodeId,
      attachments
    );
    if (saved === null) return res.status(404).json(NOT_FOUND);
    res.json(saved);
  },

  // GET /api/public/courses/:publicId — no auth.
  async getPublic(req, res) {
    const course = await courseService.getPublic(req.params.publicId);
    if (!course) return res.status(404).json(NOT_FOUND);
    res.json(course);
  },
};
