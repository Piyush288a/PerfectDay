import { Router } from "express";
import * as listController from "../controllers/list.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { createListSchema, updateListSchema, listIdParamSchema } from "../schemas/list.schema.js";

const router = Router();

// All list endpoints require authentication
router.use(requireAuth);

router.get("/", listController.getLists);

router.post("/", validate({ body: createListSchema }), listController.createList);

router.patch(
  "/:id",
  validate({ params: listIdParamSchema, body: updateListSchema }),
  listController.updateList
);

router.delete(
  "/:id",
  validate({ params: listIdParamSchema }),
  listController.deleteList
);

export default router;
