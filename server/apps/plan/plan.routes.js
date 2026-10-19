import { planController } from "./plan.controller.js";

/** Exam prep plan: exam settings plus dated subjects with auto revisions. */
export function registerPlanRoutes(app, requireAuth) {
  app.get("/api/plan", requireAuth, planController.get);
  app.put("/api/plan", requireAuth, planController.saveSettings);
  app.post("/api/plan/items", requireAuth, planController.addItems);
  app.patch("/api/plan/items/:itemId", requireAuth, planController.updateItem);
  app.delete("/api/plan/items/:itemId", requireAuth, planController.removeItem);
}
