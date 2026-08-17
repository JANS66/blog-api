import { Router } from "express";
import {
  getCommentsByPost,
  createComment,
  deleteComment,
} from "../controllers/comments.js";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  getCommentsParamsSchema,
  getCommentsQuerySchema,
  createCommentSchema,
  deleteCommentParamsSchema,
} from "../schemas/comments.js";

// REQUIRED: mergeParams: true allows reading :postId from posts routes
const router = Router({ mergeParams: true });

// ==========================================
// SUB RESOURCE ROUTES (Mounted via posts.js)
// URL: /api/v1/posts/:postId/comments
// ==========================================

// GET /api/v1/posts/:postId/comments
router.get(
  "/",
  validate({ params: getCommentsParamsSchema, query: getCommentsQuerySchema }),
  getCommentsByPost,
);

// POST /api/v1/posts/:postId/comments
router.post(
  "/",
  authenticate,
  validate({ params: getCommentsParamsSchema, body: createCommentSchema }),
  createComment,
);

// ==========================================
// DIRECT RESOURCE ROUTES (Mounted via app.js)
// URL: /api/v1/comments/:id
// ==========================================

// DELETE /api/v1/comments/:id
router.delete(
  "/:id",
  authenticate,
  validate({ params: deleteCommentParamsSchema }),
  deleteComment,
);

export default router;
