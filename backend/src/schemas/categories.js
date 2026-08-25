import { z } from "zod";

export const getCategoriesQuerySchema = z.object({
  sortBy: z.enum(["name", "posts"]).optional().default("name"),
  order: z.enum(["asc", "desc"]).optional().default("asc"),
});

export const createCategorySchema = z.object({
  name: z
    .string({ required_error: "Category name is required" })
    .min(2, "Category name must be at least 2 characters")
    .max(50, "Category name cannot exceed 50 characters")
    .trim(),
});

export const deleteCategoryParamsSchema = z.object({
  id: z.uuid("Invalid Category ID format. Must be a valid UUID"),
});

export const updateCategoryParamsSchema = z.object({
  id: z.uuid("Invalid Category ID format. Must be a valid UUID"),
});

export const updateCategorySchema = z.object({
  name: z
    .string({ required_error: "Category name is required" })
    .min(2, "Category name must be at least 2 characters")
    .max(50, "Category name cannot exceed 50 characters")
    .trim(),
});
