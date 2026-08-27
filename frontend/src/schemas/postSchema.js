import { z } from "zod";

// Rule for a single tag string
const tagSchema = z
  .string()
  .min(2, "Tag must be at least 2 characters")
  .max(30, "Tag cannot exceed 30 characters")
  .trim();

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
  // Validates every tag inside the array
  tags: z.array(tagSchema).optional().default([]),
});

export const updatePostSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(150, "Title cannot exceed 150 characters")
    .trim()
    .optional(),
  content: z
    .string()
    .min(10, "Content must be at least 10 characters")
    .trim()
    .optional(),
  excerpt: z
    .string()
    .max(300, "Excerpt cannot exceed 300 characters")
    .optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]).optional(),
  categoryId: z.string().nullable().optional(),
  tags: z.array(tagSchema).optional().default([]),
});
