import bcrypt from "bcryptjs";
import { prisma } from "../config/db.js";
import { generateToken, setAuthCookie, clearAuthCookie } from "../utils/jwt.js";
import { Result } from "pg";
import { uploadToCloudinary } from "../utils/cloudinary.js";

/**
 * POST /api/v1/auth/register
 */
export const register = async (req, res) => {
  try {
    // req.body is already sanitized and validated by Zod
    const { email, username, password } = req.body;

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
    const { email, password } = req.body;

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
 * GET /api/v1/users/me
 */
export const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        bio: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.json({ user });
  } catch (err) {
    return res
      .status(500)
      .json({ error: "Server error fetching user profile." });
  }
};

/**
 * POST /api/v1/auth/logout
 */
export const logout = (req, res) => {
  clearAuthCookie(res);
  return res.json({ message: "Logged out successfully" });
};

/**
 * PATCH /api/v1/users/me
 * Handles both text fields (username, bio) and optional file upload (avatar)
 */
export const updateMe = async (req, res) => {
  try {
    const { username, bio } = req.body;
    let newAvatarUrl;

    // If an image file was attached in form-data ("avatar")
    if (req.file) {
      newAvatarUrl = await uploadToCloudinary(
        req.file.buffer,
        "blog-api/avatars",
      );
    }

    // Prevent empty updates
    if (username === undefined && bio === undefined && !newAvatarUrl) {
      return res
        .status(400)
        .json({ error: "Please provide at least one field to update." });
    }

    // Verify unique username if changed
    if (username && username !== req.user.username) {
      const existingUser = await prisma.user.findUnique({
        where: { username },
      });
      if (existingUser) {
        return res.status(409).json({ error: "Username is already taken." });
      }
    }

    // Update Database
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(username !== undefined && { username }),
        ...(bio !== undefined && { bio }),
        ...(newAvatarUrl && { avatarUrl: newAvatarUrl }),
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        bio: true,
        avatarUrl: true,
        updatedAt: true,
      },
    });

    return res.json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (err) {
    console.error("Update Me Error:", err);
    return res.status(500).json({ error: "Server error updating profile." });
  }
};
