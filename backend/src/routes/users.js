import { Router } from "express";
import { getMe, getUserByUsername, updateMe } from "../controllers/users.js";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { upload } from "../middleware/upload.js";
import {
  getUserByUsernameParamsSchema,
  paginationQuerySchema,
  updateProfileSchema,
} from "../schemas/users.js";

const router = Router();

router.get("/me", authenticate, getMe);
router.patch(
  "/me",
  authenticate,
  upload.single("avatar"), // Process multipart file first
  validate({ body: updateProfileSchema }), // Validate req.body with Zod
  updateMe, // Update database
);
router.get(
  "/:username",
  validate({
    params: getUserByUsernameParamsSchema,
    query: paginationQuerySchema,
  }),
  getUserByUsername,
);

export default router;
