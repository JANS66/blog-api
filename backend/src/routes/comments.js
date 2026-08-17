import { Router } from "express";
import { getCommentsByPost, createComment } from "../controllers/comments.js";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  getCommentsParamsSchema,
  getCommentsQuerySchema,
  createCommentSchema,
} from "../schemas/comments.js";

// REQUIRED: mergeParams: true allows reading :postId from posts routes
const router = Router({ mergeParams: true });

// Public route
router.get(
  "/",
  validate({ params: getCommentsParamsSchema, query: getCommentsQuerySchema }),
  getCommentsByPost,
);

// Authenticated route
router.post(
  "/",
  authenticate,
  validate({ params: getCommentsParamsSchema, body: createCommentSchema }),
  createComment,
);

export default router;
