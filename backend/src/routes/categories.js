import { Router } from "express";
import {
  getCategories,
  createCategory,
  deleteCategory,
  updateCategory,
} from "../controllers/categories.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  getCategoriesQuerySchema,
  createCategorySchema,
  deleteCategoryParamsSchema,
  updateCategoryParamsSchema,
  updateCategorySchema,
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

router.patch(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  validate({ params: updateCategoryParamsSchema, body: updateCategorySchema }),
  updateCategory,
);

router.delete(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  validate({ params: deleteCategoryParamsSchema }),
  deleteCategory,
);

export default router;
