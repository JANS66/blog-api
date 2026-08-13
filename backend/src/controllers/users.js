import { prisma } from "../config/db.js";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";

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
  let newUploadedPublicId = null;

  try {
    const { username, bio } = req.valid.body;

    // Short circuit: Check empty updates BEFORE any async I/O or DB calls
    if (username === undefined && bio === undefined && !req.file) {
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

    // Fetch current user data needed for image management
    const currentUser = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { avatarPublicId: true },
    });

    // Handle Avatar File Upload and Cloudinary Cleanup
    let newAvatarUrl;
    let newAvatarPublicId;

    // Upload NEW file first if present
    if (req.file) {
      const uploadResult = await uploadToCloudinary(
        req.file.buffer,
        "blog-api/avatars",
      );
      newAvatarUrl = uploadResult.url;
      newAvatarPublicId = uploadResult.publicId;
      newUploadedPublicId = uploadResult.publicId; // Tracked for cleanup if DB fails
    }

    // Update Database
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(username !== undefined &&
          username !== req.user.username && { username }),
        ...(bio !== undefined && { bio }),
        ...(newAvatarUrl && {
          avatarUrl: newAvatarUrl,
          avatarPublicId: newAvatarPublicId,
        }),
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        bio: true,
        avatarUrl: true,
        avatarPublicId: true,
        updatedAt: true,
      },
    });

    // Delete OLD asset ONLY AFTER DB update succeeds
    if (req.file && currentUser?.avatarPublicId) {
      deleteFromCloudinary(currentUser.avatarPublicId).catch((err) =>
        console.error("Failed to delete legacy avatar:", err),
      );
    }

    return res.json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (err) {
    // CLEANUP: If DB update failed but we uploaded an asset, remove the orphaned asset
    if (newUploadedPublicId) {
      await deleteFromCloudinary(newUploadedPublicId).catch((cleanupErr) =>
        console.error("Failed to cleanup orphaned avatar:", cleanupErr),
      );
    }

    // Handle unique constraint collisions (P2002)
    if (err.code === "P2002") {
      return res.status(409).json({ error: "Username is already taken." });
    }

    console.error("Update Me Error:", err);
    return res.status(500).json({ error: "Server error updating profile." });
  }
};

/**
 * GET /api/v1/users/:username
 * Public route to fetch a users public profile and their published posts.
 */
export const getUserByUsername = async (req, res) => {
  try {
    const { username } = req.valid.params;

    const { page, limit } = req.valid.query;
    const skip = (page - 1) * limit;

    // Fetch user and their PUBLISHED posts count and list
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        bio: true,
        avatarUrl: true,
        createdAt: true,
        posts: {
          where: { status: "PUBLISHED" }, // Only public posts
          select: {
            id: true,
            title: true,
            slug: true,
            excerpt: true,
            coverImage: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // Get total published post count for pagination metadata
    const totalPosts = await prisma.post.count({
      where: {
        authorId: user.id,
        status: "PUBLISHED",
      },
    });

    return res.json({
      user: {
        id: user.id,
        username: user.username,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
      },
      posts: user.posts,
      pagination: {
        totalPosts,
        page,
        limit,
        totalPages: Math.ceil(totalPosts / limit),
      },
    });
  } catch (err) {
    console.error("Get User Profile Error:", err);
    return res
      .status(500)
      .json({ error: "Server error fetching user profile." });
  }
};

/**
 * DELETE /api/v1/users/:id
 * Admin only - Hard delete user account
 */
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.valid.params;

    // Prevent Admin from deleting themselves
    if (id === req.user.id) {
      return res
        .status(400)
        .json({ error: "You cannot delete your own admin account." });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true, username: true, avatarPublicId: true },
    });

    if (!existingUser) {
      return res.status(404).json({ error: "User not found." });
    }

    // Hard delete user from PostgreSQL
    await prisma.user.delete({
      where: { id },
    });

    // Clean up external Cloudinary assets post-deletion
    if (existingUser.avatarPublicId) {
      deleteFromCloudinary(existingUser.avatarPublicId).catch((err) =>
        console.error("Failed to delete user avatar during hard delete:", err),
      );
    }

    return res.json({
      message: `User "${existingUser.username}" hard deleted successfully.`,
    });
  } catch (err) {
    console.error("Delete User Error:", err);
    return res.status(500).json({ error: "Server error deleting user." });
  }
};
