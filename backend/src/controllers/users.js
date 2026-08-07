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

/**
 * GET /api/v1/users/:username
 * Public route to fetch a users public profile and their published posts.
 */
export const getUserByUsername = async (req, res) => {
  try {
    const { username } = req.params;

    // Defensive fallbacks to ensure skip and limit are never NaN or undefined
    const page = Math.max(1, parseInt(req.query?.page, 10) || 1);
    const limit = Math.max(
      1,
      Math.min(100, parseInt(req.query?.limit, 10) || 10),
    );
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
