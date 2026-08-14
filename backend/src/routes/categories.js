import { Router } from "express";
import { getCategories } from "../controllers/categories.js";
import { validate } from "../middleware/validate.js";
import { getCategoriesQuerySchema } from "../schemas/categories.js";

const router = Router();

// Public route
router.get("/", validate({ query: getCategoriesQuerySchema }), getCategories);

export default router;
