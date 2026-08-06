import { Router } from "express";
import { register, login, getMe, logout } from "../controllers/auth.js";
import { validate } from "../middleware/validate.js";
import { registerSchema, loginSchema } from "../schemas/auth.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.post("/auth/register", validate(registerSchema), register);
router.post("/auth/login", validate(loginSchema), login);
router.post("/auth/logout", authenticate, logout);
router.get("/users/me", authenticate, getMe);

export default router;
