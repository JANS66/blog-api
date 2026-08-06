import { Router } from "express";
import {
  register,
  login,
  getMe,
  logout,
  updateMe,
} from "../controllers/auth.js";
import { upload } from "../middleware/upload.js";
import { validate } from "../middleware/validate.js";
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
} from "../schemas/auth.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.post("/auth/register", validate(registerSchema), register);
router.post("/auth/login", validate(loginSchema), login);
router.post("/auth/logout", authenticate, logout);

router.get("/users/me", authenticate, getMe);
router.patch(
  "/users/me",
  authenticate,
  upload.single("avatar"), // Process multipart file first
  validate(updateProfileSchema), // Validate req.body with Zod
  updateMe, // Update database
);

export default router;
