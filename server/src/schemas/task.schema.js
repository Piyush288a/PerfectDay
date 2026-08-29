import { z } from "zod";

const taskPriorityEnum = z.enum(["NONE", "LOW", "MEDIUM", "HIGH"]);
const recurrenceRuleEnum = z.enum(["NONE", "DAILY", "WEEKLY", "MONTHLY"]);

// Date parser helper that accepts ISO strings or Date objects and converts to Date
const optionalDateSchema = z
  .union([z.string().datetime(), z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.date()])
  .transform((val) => (typeof val === "string" ? new Date(val) : val))
  .optional()
  .nullable();

export const createTaskSchema = z.object({
  title: z
    .string({ required_error: "Task title is required" })
    .trim()
    .min(1, "Task title cannot be empty")
    .max(500, "Task title must not exceed 500 characters"),
  notes: z
    .string()
    .trim()
    .max(10000, "Notes must not exceed 10000 characters")
    .optional()
    .nullable(),
  listId: z.string().uuid("Invalid list ID format").optional(),
  isCompleted: z.boolean().default(false),
  completedAt: optionalDateSchema,
  dueDate: optionalDateSchema,
  myDayOn: optionalDateSchema,
  priority: taskPriorityEnum.default("NONE"),
  order: z.number().int().default(0),
  recurrenceRule: recurrenceRuleEnum.default("NONE"),
  recurrenceInterval: z.number().int().min(1, "Recurrence interval must be at least 1").default(1),
  recurrenceEndsOn: optionalDateSchema,
});

export const updateTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Task title cannot be empty")
    .max(500, "Task title must not exceed 500 characters")
    .optional(),
  notes: z
    .string()
    .trim()
    .max(10000, "Notes must not exceed 10000 characters")
    .optional()
    .nullable(),
  listId: z.string().uuid("Invalid list ID format").optional(),
  isCompleted: z.boolean().optional(),
  completedAt: optionalDateSchema,
  dueDate: optionalDateSchema,
  myDayOn: optionalDateSchema,
  priority: taskPriorityEnum.optional(),
  order: z.number().int().optional(),
  recurrenceRule: recurrenceRuleEnum.optional(),
  recurrenceInterval: z.number().int().min(1, "Recurrence interval must be at least 1").optional(),
  recurrenceEndsOn: optionalDateSchema,
});

export const taskIdParamSchema = z.object({
  id: z.string().uuid("Invalid task ID format"),
});

export const getTasksQuerySchema = z.object({
  listId: z.string().uuid("Invalid list ID format").optional(),
  isCompleted: z
    .enum(["true", "false"])
    .transform((val) => val === "true")
    .optional(),
  priority: taskPriorityEnum.optional(),
  myDay: z
    .enum(["true", "false"])
    .transform((val) => val === "true")
    .optional(),
  due: z.enum(["today", "upcoming", "overdue", "planned"]).optional(),
  search: z.string().trim().optional(),
  sortBy: z.enum(["order", "dueDate", "priority", "title", "createdAt"]).default("order"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});
