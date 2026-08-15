import { Router } from "express";
import { getTags } from "../controllers/tags.js";
import { validate } from "../middleware/validate.js";
import { getTagsQuerySchema } from "../schemas/tags.js";

const router = Router();

// Public route
router.get("/", validate({ query: getTagsQuerySchema }), getTags);

export default router;
