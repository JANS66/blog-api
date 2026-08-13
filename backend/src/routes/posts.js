import { Router } from "express";
import { getPosts, getPostBySlug, createPost } from "../controllers/posts.js";
import { validate } from "../middleware/validate.js";
import { authenticate, authorize } from "../middleware/auth.js";
import {
  getPostsQuerySchema,
  getPostBySlugParamsSchema,
  createPostSchema,
} from "../schemas/posts.js";
import { upload } from "../middleware/upload.js";

const router = Router();

// Public list posts endpoint
router.get("/", validate({ query: getPostsQuerySchema }), getPosts);

// Public get single post by slug
router.get(
  "/:slug",
  validate({ params: getPostBySlugParamsSchema }),
  getPostBySlug,
);

// Author and Admin route
router.post(
  "/",
  authenticate,
  authorize("AUTHOR", "ADMIN"),
  upload.single("coverImage"), // Multer processes multipart form data and req.file
  validate({ body: createPostSchema }), // Zod validates text body fields
  createPost, // Controller handles Cloudinary and DB operations
);

export default router;
