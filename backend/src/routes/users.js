import { Router } from "express";
import {
  deleteUser,
  getMe,
  getUserByUsername,
  updateMe,
} from "../controllers/users.js";
import {
  authenticate,
  authorize,
  verifyActiveUser,
} from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { upload } from "../middleware/upload.js";
import {
  deleteUserParamsSchema,
  getUserByUsernameParamsSchema,
  paginationQuerySchema,
  updateProfileSchema,
} from "../schemas/users.js";

const router = Router();

router.get("/me", authenticate, getMe);
router.patch(
  "/me",
  authenticate,
  verifyActiveUser,
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
router.delete(
  "/:id",
  authenticate,
  verifyActiveUser,
  authorize("ADMIN"),
  validate({ params: deleteUserParamsSchema }),
  deleteUser,
);

export default router;
