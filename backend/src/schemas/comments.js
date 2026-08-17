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
