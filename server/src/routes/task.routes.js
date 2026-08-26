import { Router } from "express";
import * as taskController from "../controllers/task.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  createTaskSchema,
  updateTaskSchema,
  taskIdParamSchema,
  getTasksQuerySchema,
} from "../schemas/task.schema.js";

const router = Router();

// All task endpoints require authentication
router.use(requireAuth);

router.get("/", validate({ query: getTasksQuerySchema }), taskController.getTasks);

router.post("/", validate({ body: createTaskSchema }), taskController.createTask);

router.get("/:id", validate({ params: taskIdParamSchema }), taskController.getTask);

router.patch(
  "/:id",
  validate({ params: taskIdParamSchema, body: updateTaskSchema }),
  taskController.updateTask
);

router.delete(
  "/:id",
  validate({ params: taskIdParamSchema }),
  taskController.deleteTask
);

export default router;
