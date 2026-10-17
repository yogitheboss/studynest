import { planService } from "./plan.service.js";
import {
  addItemsSchema,
  settingsSchema,
  updateItemSchema,
} from "./plan.schema.js";

const badRequest = (res, parsed) =>
  res
    .status(400)
    .json({ error: parsed.error.issues[0]?.message ?? "Invalid request." });

const NOT_FOUND = { error: "Plan item not found." };

export const planController = {
  // GET /api/plan — null until the exam is set up.
  async get(req, res) {
    res.json(await planService.get(req.session.user.id));
  },

  // PUT /api/plan — create or update the exam name + date.
  async saveSettings(req, res) {
    const body = settingsSchema.safeParse(req.body ?? {});
    if (!body.success) return badRequest(res, body);
    res.json(await planService.saveSettings(req.session.user.id, body.data));
  },

  // POST /api/plan/items — add dated subjects.
  async addItems(req, res) {
    const body = addItemsSchema.safeParse(req.body ?? {});
    if (!body.success) return badRequest(res, body);
    const plan = await planService.addItems(
      req.session.user.id,
      body.data.items
    );
    if (!plan)
      return res.status(404).json({ error: "Set up your exam first." });
    res.json(plan);
  },

  // PATCH /api/plan/items/:itemId
  async updateItem(req, res) {
    const body = updateItemSchema.safeParse(req.body ?? {});
    if (!body.success) return badRequest(res, body);
    const plan = await planService.updateItem(
      req.session.user.id,
      req.params.itemId,
      body.data
    );
    if (!plan) return res.status(404).json(NOT_FOUND);
    res.json(plan);
  },

  // DELETE /api/plan/items/:itemId
  async removeItem(req, res) {
    const plan = await planService.removeItem(
      req.session.user.id,
      req.params.itemId
    );
    if (!plan) return res.status(404).json(NOT_FOUND);
    res.json(plan);
  },
};
