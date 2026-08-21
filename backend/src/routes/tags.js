import { Router } from "express";
import { getTags, createTag, deleteTag } from "../controllers/tags.js";
import {
  authenticate,
  authorize,
  verifyActiveUser,
} from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  getTagsQuerySchema,
  createTagSchema,
  deleteTagParamsSchema,
} from "../schemas/tags.js";

const router = Router();

// Public route
router.get("/", validate({ query: getTagsQuerySchema }), getTags);

// Author / Admin route
router.post(
  "/",
  authenticate,
  verifyActiveUser,
  authorize("AUTHOR", "ADMIN"),
  validate({ body: createTagSchema }),
  createTag,
);

// Admin only route
router.delete(
  "/:id",
  authenticate,
  verifyActiveUser,
  authorize("ADMIN"),
  validate({ params: deleteTagParamsSchema }),
  deleteTag,
);

export default router;
