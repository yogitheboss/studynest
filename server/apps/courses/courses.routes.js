import { courseController } from "./courses.controller.js";

/**
 * Wire course routes to their controller handlers. `requireAuth` is the session
 * middleware from the main server; owner routes use it, the public read route
 * deliberately does not.
 */
export function registerCourseRoutes(app, requireAuth) {
  // Owner CRUD + sharing.
  app.get("/api/courses", requireAuth, courseController.list);
  app.post("/api/courses", requireAuth, courseController.create);
  app.put("/api/courses/:id", requireAuth, courseController.update);
  app.delete("/api/courses/:id", requireAuth, courseController.remove);
  app.patch(
    "/api/courses/:id/visibility",
    requireAuth,
    courseController.setVisibility
  );

  // Per-node notes (owner only).
  app.get(
    "/api/courses/:id/notes/:nodeId",
    requireAuth,
    courseController.getNotes
  );
  app.put(
    "/api/courses/:id/notes/:nodeId",
    requireAuth,
    courseController.replaceNotes
  );

  // Per-node attachments (owner only).
  app.get(
    "/api/courses/:id/attachments/:nodeId",
    requireAuth,
    courseController.getAttachments
  );
  app.put(
    "/api/courses/:id/attachments/:nodeId",
    requireAuth,
    courseController.replaceAttachments
  );

  // Public, unauthenticated read of a shared course.
  app.get("/api/public/courses/:publicId", courseController.getPublic);
}
