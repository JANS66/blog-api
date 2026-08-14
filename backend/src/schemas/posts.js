import { z } from "zod";

export const getPostsQuerySchema = z.object({
  page: z.coerce
    .number()
    .int("Page must be an integer")
    .positive("Page must be greater than 0")
    .catch(1)
    .default(1),
  limit: z.coerce
    .number()
    .int("Limit must be an integer")
    .positive("Limit must be greater than 0")
    .max(100, "Limit cannot exceed 100")
    .catch(10)
    .default(10),
  category: z.string().trim().optional(),
  tag: z.string().trim().optional(),
  search: z.string().trim().optional(),
});

export const getPostBySlugParamsSchema = z.object({
  slug: z
    .string({ required_error: "Post slug is required" })
    .min(1, "Slug cannot be empty")
    .trim(),
});

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
  // Transform multipart form data string into an array of strings
  tags: z
    .union([
      z.string().transform((val) => {
        try {
          const parsed = JSON.parse(val);
          return Array.isArray(parsed) ? parsed : [val];
        } catch {
          return val
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean);
        }
      }),
      z.array(z.string()),
    ])
    .optional()
    .default([]),
});

export const updatePostParamsSchema = z.object({
  id: z
    .string({ required_error: "Post ID is required" })
    .uuid("Invalid Post ID format. Must be a valid UUID"),
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
  tags: z
    .union([
      z.string().transform((val) => {
        try {
          const parsed = JSON.parse(val);
          return Array.isArray(parsed) ? parsed : [val];
        } catch {
          return val
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean);
        }
      }),
      z.array(z.string()),
    ])
    .optional(),
});

export const deletePostParamsSchema = z.object({
  id: z
    .string({ required_error: "Post ID is required" })
    .uuid("Invalid Post ID format. Must be a valid UUID"),
});
