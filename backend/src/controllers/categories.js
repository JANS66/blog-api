import { prisma } from "../config/db.js";
import { createUniqueSlug } from "../utils/slugify.js";

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

/**
 * POST /api/v1/categories
 * Admin - Create a new category
 */
export const createCategory = async (req, res) => {
  try {
    const { name } = req.valid.body;

    // Check for duplicate category name
    const existingCategory = await prisma.category.findFirst({
      where: {
        name: {
          equals: name,
          mode: "insensitive", // Case insensitive collision check
        },
      },
    });

    if (existingCategory) {
      return res
        .status(409)
        .json({ error: "A category with this name already exists." });
    }

    // Generate unique slug
    const slug = await createUniqueSlug(name);

    // Insert into Database
    const category = await prisma.category.create({
      data: {
        name,
        slug,
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    return res.status(201).json({
      message: "Category created successfully.",
      category,
    });
  } catch (err) {
    console.error("Create Category Error:", err);
    return res.status(500).json({ error: "Server error creating category." });
  }
};
