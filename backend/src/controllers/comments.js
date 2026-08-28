import { prisma } from "../config/db.js";

/**
 * GET /api/v1/posts/:postId/comments
 * Public - Retrieve comments for a published post with author details
 */
export const getCommentsByPost = async (req, res) => {
  try {
    const { postId } = req.valid.params;
    const { page, limit } = req.valid.query;
    const skip = (page - 1) * limit;

    const where = { postId };

    // Run post existence check, comment lookup, and comment count in parallel
    const [post, comments, totalComments] = await prisma.$transaction([
      prisma.post.findFirst({
        where: {
          id: postId,
          status: "PUBLISHED",
        },
        select: { id: true },
      }),
      prisma.comment.findMany({
        where,
        select: {
          id: true,
          content: true,
          parentId: true,
          createdAt: true,
          author: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.comment.count({ where }),
    ]);

    if (!post) {
      return res
        .status(404)
        .json({ error: "Post not found or not published." });
    }

    return res.json({
      comments,
      pagination: {
        totalComments,
        page,
        limit,
        totalPages: Math.ceil(totalComments / limit),
      },
    });
  } catch (err) {
    console.error("Get Comments Error:", err);
    return res.status(500).json({ error: "Server error fetching comments." });
  }
};

/**
 * POST /api/v1/posts/:postId/comments
 * Authenticated - Add a comment or reply to a post
 */
export const createComment = async (req, res) => {
  try {
    const { postId } = req.valid.params;
    const { content, parentId } = req.valid.body;
    const authorId = req.user.id;

    // Direct atomic insert: relies on DB foreign keys and constraints
    const comment = await prisma.comment.create({
      data: {
        content,
        postId,
        authorId,
        parentId: parentId || null,
      },
      select: {
        id: true,
        content: true,
        parentId: true,
        createdAt: true,
        author: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    });

    return res.status(201).json({
      message: "Comment posted successfully.",
      comment,
    });
  } catch (err) {
    // Foreign key constraint failure (e.g. invalid postId, parentId, or authorId)
    if (err.code === "P2003") {
      return res.status(404).json({ error: "Post not found or unavailable." });
    }

    console.error("Create Comment Error:", err);
    return res.status(500).json({ error: "Server error creating comment." });
  }
};

/**
 * DELETE /api/v1/comments/:id
 * Author (Owner) / Admin - Delete a comment
 */
export const deleteComment = async (req, res) => {
  try {
    const { id } = req.valid.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === "ADMIN";

    // Construct authorization query clause
    const where = {
      id,
      ...(!isAdmin && { authorId: userId }),
    };

    // Atomic delete: deletes if found AND authorized in 1 DB hit
    const result = await prisma.comment.deleteMany({
      where,
    });

    if (result.count === 0) {
      // Differentiate between "Not Found" vs "Unauthorized" if the comment exists
      const commentExists = await prisma.comment.findUnique({
        where: { id },
        select: { id: true },
      });

      if (!commentExists) {
        return res.status(404).json({ error: "Comment not found." });
      }

      return res.status(403).json({
        error: "Access denied. You can only delete your own comments.",
      });
    }

    return res.json({
      message: "Comment deleted successfully.",
      deletedCommentId: id,
    });
  } catch (err) {
    console.error("Delete Comment Error:", err);
    return res.status(500).json({ error: "Server error deleting comment." });
  }
};
