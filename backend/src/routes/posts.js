import { Router } from "express";
import { getPosts, getPostBySlug } from "../controllers/posts.js";
import { validate } from "../middleware/validate.js";
import {
  getPostsQuerySchema,
  getPostBySlugParamsSchema,
} from "../schemas/posts.js";

const router = Router();

// Public list posts endpoint
router.get("/", validate({ query: getPostsQuerySchema }), getPosts);

// Public get single post by slug
router.get(
  "/:slug",
  validate({ params: getPostBySlugParamsSchema }),
  getPostBySlug,
);

export default router;
