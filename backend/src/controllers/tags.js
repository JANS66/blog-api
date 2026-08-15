import { prisma } from "../config/db.js";

/**
 * GET /api/v1/tags
 * Public - List all tags with published post count
 */
export const getTags = async (req, res) => {
  try {
    const { sortBy, order } = req.valid.query;

    const tags = await prisma.tag.findMany({
      orderBy: {
        [sortBy]: order,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        _count: {
          select: {
            posts: {
              where: { status: "PUBLISHED" }, // Count only published posts
            },
          },
        },
      },
    });

    // Format _count for cleaner response payload
    const formattedTags = tags.map((tag) => ({
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
      postCount: tag._count.posts,
    }));

    return res.json({
      tags: formattedTags,
    });
  } catch (err) {
    console.error("Get Tags Error:", err);
    return res.status(500).json({ error: "Server error fetching tags." });
  }
};
