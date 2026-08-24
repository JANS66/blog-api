import { z } from "zod";

export const updateProfileSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username cannot exceed 20 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores",
    )
    .trim()
    .optional(),
  bio: z
    .string()
    .max(500, "Bio cannot exceed 500 characters")
    .trim()
    .nullable()
    .optional(),
});

// Schema for req.params
export const getUserByUsernameParamsSchema = z.object({
  username: z
    .string({ required_error: "Username is required" })
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username cannot exceed 20 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores",
    )
    .trim(),
});

// Schema for req.query
export const paginationQuerySchema = z.object({
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
    .catch(6)
    .default(6),
  status: z
    .enum(["PUBLISHED", "DRAFT"], {
      invalid_type_error: "Status must be either PUBLISHED or DRAFT",
    })
    .catch("PUBLISHED")
    .default("PUBLISHED"),
});

export const deleteUserParamsSchema = z.object({
  id: z.uuid("Invalid User ID format. Must be a valid UUID"),
});
