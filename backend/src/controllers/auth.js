import bcrypt from "bcryptjs";
import { prisma } from "../config/db.js";
import { generateToken, setAuthCookie, clearAuthCookie } from "../utils/jwt.js";

/**
 * POST /api/v1/auth/register
 */
export const register = async (req, res) => {
  try {
    const { email, username, password } = req.valid.body;

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Direct atomic insert
    const user = await prisma.user.create({
      data: {
        email,
        username,
        passwordHash,
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        createdAt: true,
      },
    });

    // Issue Auth
    const token = generateToken({ userId: user.id, role: user.role });
    setAuthCookie(res, token);

    return res.status(201).json({
      message: "User registered successfully",
      user,
    });
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(409).json({
        error: "Email or username is already taken.",
      });
    }

    console.error("Register Error:", err);
    return res.status(500).json({ error: "Server error during registration." });
  }
};

/**
 * POST /api/v1/auth/login
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.valid.body;

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const token = generateToken({ userId: user.id, role: user.role });

    // Set HTTP Only Cookie
    setAuthCookie(res, token);

    return res.json({
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (err) {
    console.error("Login Error:", err);
    return res.status(500).json({ error: "Server error during login." });
  }
};

/**
 * POST /api/v1/auth/logout
 */
export const logout = (req, res) => {
  clearAuthCookie(res);
  return res.json({ message: "Logged out successfully" });
};
