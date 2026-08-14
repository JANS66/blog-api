import { z } from "zod";

export const getCategoriesQuerySchema = z.object({
  sortBy: z.enum(["name", "createdAt"]).optional().default("name"),
  order: z.enum(["asc", "desc"]).optional().default("asc"),
});
