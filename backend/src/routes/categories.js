import { Router } from "express";
import {
  getCategories,
  createCategory,
  deleteCategory,
  updateCategory,
} from "../controllers/categories.js";
import {
  authenticate,
  authorize,
  verifyActiveUser,
} from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  getCategoriesQuerySchema,
  createCategorySchema,
  deleteCategoryParamsSchema,
  updateCategoryParamsSchema,
  updateCategorySchema,
} from "../schemas/categories.js";
import { verifyActiveUser } from "../middleware/auth.js";

const router = Router();

// Public route
router.get("/", validate({ query: getCategoriesQuerySchema }), getCategories);

// Admin route
router.post(
  "/",
  authenticate,
  verifyActiveUser,
  authorize("ADMIN"),
  validate({ body: createCategorySchema }),
  createCategory,
);

router.patch(
  "/:id",
  authenticate,
  verifyActiveUser,
  authorize("ADMIN"),
  validate({ params: updateCategoryParamsSchema, body: updateCategorySchema }),
  updateCategory,
);

router.delete(
  "/:id",
  authenticate,
  verifyActiveUser,
  authorize("ADMIN"),
  validate({ params: deleteCategoryParamsSchema }),
  deleteCategory,
);

export default router;
