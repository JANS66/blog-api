import { z } from "zod";

export const getTagsQuerySchema = z.object({
  sortBy: z.enum(["name", "createdAt"]).optional().default("name"),
  order: z.enum(["asc", "desc"]).optional().default("asc"),
});

export const createTagSchema = z.object({
  name: z
    .string({ required_error: "Tag name is required" })
    .min(2, "Tag name must be at least 2 characters")
    .max(30, "Tag name cannot exceed 30 characters")
    .trim(),
});
