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

    // Fetch current user data ONLY IF replacing an avatar file
    let oldAvatarPublicId = null;
    if (req.file) {
      const currentUser = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { avatarPublicId: true },
      });
      oldAvatarPublicId = currentUser?.avatarPublicId;
    }

    //Upload NEW file to Cloudinary
    let newAvatarUrl;
    let newAvatarPublicId;

    if (req.file) {
      const uploadResult = await uploadToCloudinary(
        req.file.buffer,
        "blog-api/avatars",
      );
      newAvatarUrl = uploadResult.url;
      newAvatarPublicId = uploadResult.publicId;
      newUploadedPublicId = uploadResult.publicId; // Tracked for cleanup if DB fails
    }

    // Update Database (Atomic - DB enforces @unique username constraint)
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
    if (req.file && oldAvatarPublicId) {
      deleteFromCloudinary(oldAvatarPublicId).catch((err) =>
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
 * Public route to fetch a user's public profile and their posts by status.
 */
export const getUserByUsername = async (req, res) => {
  try {
    const { username } = req.valid.params;
    const { page, limit, status } = req.valid.query;
    const skip = (page - 1) * limit;

    // Fetch user first by username (case insensitive)
    const user = await prisma.user.findFirst({
      where: { username: { equals: username, mode: "insensitive" } },
      select: {
        id: true,
        username: true,
        bio: true,
        avatarUrl: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // Check if req.user is the owner of this profile or an admin
    const isOwnerOrAdmin =
      Boolean(req.user) &&
      (req.user.id === user.id || req.user.role === "ADMIN");

    // Handle unauthorized draft requests
    if (status === "DRAFT" && !isOwnerOrAdmin) {
      return res.status(403).json({ error: "Unauthorized to view drafts." });
    }

    const targetStatus =
      status === "DRAFT" && isOwnerOrAdmin ? "DRAFT" : "PUBLISHED";

    // Use interactive transaction callback
    const { posts, totalPostsForTab, totalPublished, totalDrafts } =
      await prisma.$transaction(async (tx) => {
        const posts = await tx.post.findMany({
          where: { authorId: user.id, status: targetStatus },
          select: {
            id: true,
            title: true,
            slug: true,
            excerpt: true,
            coverImage: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        });

        const totalPostsForTab = await tx.post.count({
          where: { authorId: user.id, status: targetStatus },
        });

        const totalPublished = await tx.post.count({
          where: { authorId: user.id, status: "PUBLISHED" },
        });

        const totalDrafts = isOwnerOrAdmin
          ? await tx.post.count({
              where: { authorId: user.id, status: "DRAFT" },
            })
          : 0;

        return { posts, totalPostsForTab, totalPublished, totalDrafts };
      });

    return res.json({
      user,
      posts,
      counts: {
        published: totalPublished,
        drafts: totalDrafts,
      },
      pagination: {
        totalPosts: totalPostsForTab,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(totalPostsForTab / limit),
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

    // Atomic Delete: DB enforces existence (P2025) and returns required fields
    const deletedUser = await prisma.user.delete({
      where: { id },
      select: {
        id: true,
        username: true,
        avatarPublicId: true,
      },
    });

    // Post deletion side effect: Clean up Cloudinary asset
    if (deletedUser.avatarPublicId) {
      deleteFromCloudinary(deletedUser.avatarPublicId).catch((err) =>
        console.error("Failed to delete user avatar during hard delete:", err),
      );
    }

    return res.json({
      message: `User "${deletedUser.username}" hard deleted successfully.`,
    });
  } catch (err) {
    // Record to delete does not exist
    if (err.code === "P2025") {
      return res.status(404).json({ error: "User not found." });
    }

    console.error("Delete User Error:", err);
    return res.status(500).json({ error: "Server error deleting user." });
  }
};
