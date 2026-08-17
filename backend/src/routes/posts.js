import { Router } from "express";
import {
  getPosts,
  getPostBySlug,
  createPost,
  updatePost,
  deletePost,
} from "../controllers/posts.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { upload } from "../middleware/upload.js";
import {
  getPostsQuerySchema,
  getPostBySlugParamsSchema,
  createPostSchema,
  updatePostParamsSchema,
  updatePostSchema,
  deletePostParamsSchema,
} from "../schemas/posts.js";
import commentsRouter from "./comments.js";

const router = Router();

// Public routes
router.get("/", validate({ query: getPostsQuerySchema }), getPosts);
router.get(
  "/:slug",
  validate({ params: getPostBySlugParamsSchema }),
  getPostBySlug,
);

// Author and Admin - Create Post
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

// Author (Owner) and Admin - Delete Post
router.delete(
  "/:id",
  authenticate,
  authorize("AUTHOR", "ADMIN"),
  validate({ params: deletePostParamsSchema }),
  deletePost,
);

router.use("/:postId/comments", commentsRouter);

export default router;
