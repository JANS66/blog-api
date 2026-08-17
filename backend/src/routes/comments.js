import { Router } from "express";
import { getCommentsByPost } from "../controllers/comments.js";
import { validate } from "../middleware/validate.js";
import {
  getCommentsParamsSchema,
  getCommentsQuerySchema,
} from "../schemas/comments.js";

// REQUIRED: mergeParams: true allows reading :postId from posts routes
const router = Router({ mergeParams: true });

// Public route
router.get(
  "/",
  validate({ params: getCommentsParamsSchema, query: getCommentsQuerySchema }),
  getCommentsByPost,
);

export default router;
