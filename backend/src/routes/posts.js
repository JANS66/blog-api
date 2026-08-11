import { Router } from "express";
import { getPosts } from "../controllers/posts.js";
import { validate } from "../middleware/validate.js";
import { getPostsQuerySchema } from "../schemas/posts.js";

const router = Router();

// Public list posts endpoint
router.get("/", validate({ query: getPostsQuerySchema }), getPosts);

export default router;
