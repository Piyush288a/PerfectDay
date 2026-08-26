import { z } from "zod";

export const createListSchema = z.object({
  name: z
    .string({ required_error: "List name is required" })
    .trim()
    .min(1, "List name cannot be empty")
    .max(100, "List name must not exceed 100 characters"),
});

export const updateListSchema = z.object({
  name: z
    .string({ required_error: "List name is required" })
    .trim()
    .min(1, "List name cannot be empty")
    .max(100, "List name must not exceed 100 characters"),
});

export const listIdParamSchema = z.object({
  id: z.string().uuid("Invalid list ID format"),
});
