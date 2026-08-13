import { Router } from "express";
import {
  getPosts,
  getPostBySlug,
  createPost,
  updatePost,
} from "../controllers/posts.js";
import { validate } from "../middleware/validate.js";
import { authenticate, authorize } from "../middleware/auth.js";
import {
  getPostsQuerySchema,
  getPostBySlugParamsSchema,
  createPostSchema,
  updatePostParamsSchema,
  updatePostSchema,
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

// Author (Owner) and Admin - Update Post
router.patch(
  "/:id",
  authenticate,
  authorize("AUTHOR", "ADMIN"),
  upload.single("coverImage"),
  validate({ params: updatePostParamsSchema, body: updatePostSchema }),
  updatePost,
);

export default router;
