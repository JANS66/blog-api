import { Router } from "express";
import { getCategories, createCategory } from "../controllers/categories.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  getCategoriesQuerySchema,
  createCategorySchema,
} from "../schemas/categories.js";

const router = Router();

// Public route
router.get("/", validate({ query: getCategoriesQuerySchema }), getCategories);

// Admin route
router.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  validate({ body: createCategorySchema }),
  createCategory,
);

export default router;
