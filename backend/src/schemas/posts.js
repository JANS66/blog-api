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
