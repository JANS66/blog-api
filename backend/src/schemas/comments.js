import { z } from "zod";

export const getCommentsParamsSchema = z.object({
  postId: z.uuid("Invalid Post ID format. Must be a valid UUID"),
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
  // .nullish() allows both undefined and null, and we can transform empty strings or nulls
  parentId: z
    .uuid("Invalid Parent ID format")
    .nullish()
    .transform((val) => val || null),
});

export const deleteCommentParamsSchema = z.object({
  id: z.uuid("Invalid Comment ID format. Must be a valid UUID"),
});
