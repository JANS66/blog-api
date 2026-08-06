import { z } from "zod";

// Register Schema
export const registerSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .email("Invalid email address")
    .trim()
    .toLowerCase(),
  username: z
    .string({ required_error: "Username is required" })
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username cannot exceed 20 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores",
    )
    .trim(),
  password: z
    .string({ required_error: "Password is required" })
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password is too long"),
});

// Login Schema
export const loginSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .email("Invalid email address format")
    .trim()
    .toLowerCase(),
  password: z
    .string({ required_error: "Password is required" })
    .min(1, "Password cannot be empty"),
});

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
