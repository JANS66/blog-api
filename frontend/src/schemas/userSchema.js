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
    .optional()
    .or(z.literal("")),
  bio: z
    .string()
    .max(500, "Bio cannot exceed 500 characters")
    .trim()
    .optional()
    .nullable(),
});
