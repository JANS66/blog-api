import { prisma } from "../config/db.js";

/**
 * GET /api/v1/categories
 * Public - List all categories with post count
 */
export const getCategories = async (req, res) => {
  try {
    const { sortBy, order } = req.valid.query;

    const categories = await prisma.category.findMany({
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
    const formattedCategories = categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      postCount: cat._count.posts,
    }));

    return res.json({
      categories: formattedCategories,
    });
  } catch (err) {
    console.error("Get Categories Error:", err);
    return res.status(500).json({ error: "Server error fetching categories." });
  }
};
