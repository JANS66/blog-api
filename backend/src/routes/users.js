import { Router } from "express";
import { getMe, updateMe } from "../controllers/users.js";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { upload } from "../middleware/upload.js";
import { updateProfileSchema } from "../schemas/auth.js";

const router = Router();

router.get("/me", authenticate, getMe);
router.patch(
  "/me",
  authenticate,
  upload.single("avatar"), // Process multipart file first
  validate(updateProfileSchema), // Validate req.body with Zod
  updateMe, // Update database
);

export default router;
