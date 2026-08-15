import { prisma } from "../config/db.js";
import { createUniqueSlug } from "../utils/slugify.js";

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

/**
 * POST /api/v1/tags
 * Author / Admin - Create new tag
 */
export const createTag = async (req, res) => {
  try {
    const { name } = req.valid.body;
    const slug = await createUniqueSlug(name);

    // Create Tag in database
    const tag = await prisma.tag.create({
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
      message: "Tag created successfully.",
      tag,
    });
  } catch (err) {
    // Catch race-condition collisions on standard DB @unique constraints (P2002)
    if (err.code === "P2002") {
      return res.status(409).json({
        error: "A tag with this name or slug already exists.",
      });
    }

    console.error("Create Tag Error:", err);
    return res.status(500).json({ error: "Server error creating tag." });
  }
};
