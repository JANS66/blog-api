import { Router } from "express";
import { register, login, logout } from "../controllers/auth.js";
import { validate } from "../middleware/validate.js";
import { registerSchema, loginSchema } from "../schemas/auth.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.post("/register", validate({ body: registerSchema }), register);
router.post("/login", validate({ body: loginSchema }), login);
router.post("/logout", authenticate, logout);

export default router;
