import { z } from "zod";

export const createPostSchema = z.object({
  title: z
    .string({ required_error: "Title is required" })
    .min(3, "Title must be at least 3 characters")
    .max(150, "Title cannot exceed 150 characters")
    .trim(),
  content: z
    .string({ required_error: "Content is required" })
    .min(10, "Content must be at least 10 characters")
    .trim(),
  excerpt: z
    .string()
    .max(300, "Excerpt cannot exceed 300 characters")
    .optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
  categoryId: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
});
