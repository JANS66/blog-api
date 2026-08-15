import { Router } from "express";
import { getTags, createTag } from "../controllers/tags.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { getTagsQuerySchema, createTagSchema } from "../schemas/tags.js";

const router = Router();

// Public route
router.get("/", validate({ query: getTagsQuerySchema }), getTags);

// Author / Admin route
router.post(
  "/",
  authenticate,
  authorize("AUTHOR", "ADMIN"),
  validate({ body: createTagSchema }),
  createTag,
);

export default router;
