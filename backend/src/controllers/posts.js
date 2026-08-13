import { prisma } from "../config/db.js";

/**
 * GET /api/v1/posts
 * Public route - List published posts with category, tag, search filters and pagination
 */
export const getPosts = async (req, res) => {
  try {
    const { page, limit, category, tag, search } = req.valid.query;
    const skip = (page - 1) * limit;

    // Base filter: Only fetch published posts
    const where = {
      status: "PUBLISHED",
    };

    if (category) {
      where.category = {
        // Match either slug (URL params, frontend dropdowns) or display name (fallback/search inputs)
        OR: [
          { slug: category },
          { name: { equals: category, mode: "insensitive" } },
        ],
      };
    }

    // Filter by Tag slug or name
    if (tag) {
      where.tags = {
        some: {
          OR: [{ slug: tag }, { name: { equals: tag, mode: "insensitive" } }],
        },
      };
    }

    // Full text search across Title and Content
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
      ];
    }

    // Fetch posts and total count concurrently
    const [posts, totalPosts] = await Promise.all([
      prisma.post.findMany({
        where,
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          coverImage: true,
          createdAt: true,
          author: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          tags: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.post.count({ where }),
    ]);

    return res.json({
      posts,
      pagination: {
        totalPosts,
        page,
        limit,
        totalPages: Math.ceil(totalPosts / limit),
      },
    });
  } catch (err) {
    console.error("Get Posts Error:", err);
    return res.status(500).json({ error: "Server error fetching posts." });
  }
};

/**
 * GET /api/v1/posts/:slug
 * Public route - Get full post details by slug and increment viewsCount
 */
export const getPostBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    // Check if post exists and is published
    const existingPost = await prisma.post.findUnique({
      where: { slug },
      select: { id: true, status: true },
    });

    if (!existingPost || existingPost.status !== "PUBLISHED") {
      return res.status(404).json({ error: "Post not found." });
    }

    // Increment view count and fetch full post details in an atomic update
    const post = await prisma.post.update({
      where: { id: existingPost.id },
      data: {
        viewsCount: { increment: 1 },
      },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        content: true,
        coverImage: true,
        viewsCount: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        author: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            bio: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        tags: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return res.json({ post });
  } catch (err) {
    console.error("Get Post By Slug Error:", err);
    return res
      .status(500)
      .json({ error: "Server error fetching post details." });
  }
};
