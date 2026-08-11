import bcrypt from "bcryptjs";
import { prisma } from "../config/db.js";
import { generateToken, setAuthCookie, clearAuthCookie } from "../utils/jwt.js";

/**
 * POST /api/v1/auth/register
 */
export const register = async (req, res) => {
  try {
    const { email, username, password } = req.valid.body;

    // Check if email or username is taken
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      return res
        .status(409)
        .json({ error: "User with this email or username already exists." });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
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

    const token = generateToken({ userId: user.id, role: user.role });

    // Set HTTP Only Cookie
    setAuthCookie(res, token);

    return res.status(201).json({
      message: "User registered successfully",
      user,
    });
  } catch (err) {
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
