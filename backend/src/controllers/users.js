import { prisma } from "../config/db.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";

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
