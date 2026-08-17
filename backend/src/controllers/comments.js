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
          updatedAt: true,
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
