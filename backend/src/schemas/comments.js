import { z } from "zod";

export const getCommentsParamsSchema = z.object({
  postId: z
    .string({ required_error: "Post ID is required" })
    .uuid("Invalid Post ID format. Must be a valid UUID"),
});

export const getCommentsQuerySchema = z.object({
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
    .catch(20)
    .default(20),
});

export const createCommentSchema = z.object({
  content: z
    .string({ required_error: "Comment content is required" })
    .min(1, "Comment cannot be empty")
    .max(1000, "Comment cannot exceed 1000 characters")
    .trim(),
  parentId: z.string().uuid().optional(),
});

export const deleteCommentParamsSchema = z.object({
  id: z
    .string({ required_error: "Comment ID is required" })
    .uuid("Invalid Comment ID format. Must be a valid UUID"),
});
