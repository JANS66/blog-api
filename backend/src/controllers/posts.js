import { prisma } from "../config/db.js";
import { createUniqueSlug } from "../utils/slugify.js";
import slugify from "slugify";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";

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
    const { slug } = req.valid.params;

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

/**
 * POST /api/v1/posts
 * Author / Admin - Create a new post
 */
export const createPost = async (req, res) => {
  try {
    const { title, content, excerpt, status, categoryId, tags } =
      req.valid.body;
    const authorId = req.user.id;

    // Upload Cover Image to Cloudinary if attached
    let coverImageUrl = null;
    if (req.file) {
      coverImageUrl = await uploadToCloudinary(
        req.file.buffer,
        "blog-api/posts",
      );
    }

    // Generate unique slug from title
    const slug = await createUniqueSlug(title);

    // Validate Category if provided
    if (categoryId) {
      const categoryExists = await prisma.category.findUnique({
        where: { id: categoryId },
      });
      if (categoryExists) {
        return res
          .status(400)
          .json({ error: "Selected category does not exist." });
      }
    }

    // Prepare tag connections (creates new tags automatically if they dont exist)
    const tagConnectOrCreate = tags.map((tagName) => {
      const tagSlug = slugify(tagName, {
        lower: true,
        strict: true,
        trim: true,
      });
      return {
        where: { slug: tagSlug },
        create: { name: tagName, slug: tagSlug },
      };
    });

    // Create Post in DB
    const post = await prisma.post.create({
      data: {
        title,
        slug,
        content,
        excerpt: excerpt || content.substring(0, 150) + "...",
        coverImage: coverImageUrl,
        status: status || "DRAFT",
        publishedAt: status === "PUBLISHED" ? new Date() : null,
        authorId,
        categoryId: categoryId || null,
        tags: {
          connectOrCreate: tagConnectOrCreate,
        },
      },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        content: true,
        coverImage: true,
        status: true,
        publishedAt: true,
        createdAt: true,
        author: {
          select: { id: true, username: true, avatarUrl: true },
        },
        category: {
          select: { id: true, name: true, slug: true },
        },
        tags: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    return res.status(201).json({
      message: "Post created successfully.",
      post,
    });
  } catch (err) {
    console.error("Create Post Error:", err);
    return res.status(500).json({ error: "Server error creating post." });
  }
};

/**
 * PATCH /api/v1/posts/:id
 * Author (Owner) / Admin - Update post details
 */
export const updatePost = async (req, res) => {
  try {
    const { id } = req.valid.params;
    const { title, content, excerpt, status, categoryId, tags } =
      req.valid.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Short circuit: Check empty updates BEFORE making any DB queries
    if (
      title === undefined &&
      content === undefined &&
      excerpt === undefined &&
      status === undefined &&
      categoryId === undefined &&
      tags === undefined &&
      !req.file
    ) {
      return res
        .status(400)
        .json({ error: "Please provide at least one field to update." });
    }

    // Fetch existing post for ownership and status checks
    const existingPost = await prisma.post.findUnique({
      where: { id },
      select: {
        id: true,
        authorId: true,
        title: true,
        status: true,
        coverPublicId: true,
        publishedAt: true,
      },
    });

    if (!existingPost) {
      return res.status(404).json({ error: "Post not found." });
    }

    // Authorization check: Must be owner or ADMIN
    if (existingPost.authorId !== userId && userRole !== "ADMIN") {
      return res.status(403).json({
        error: "Access denied. You can only update your own posts.",
      });
    }

    // Handle Title and Slug regeneration
    let newSlug;
    if (title && title !== existingPost.title) {
      newSlug = await createUniqueSlug(title);
    }

    // Handle Cover Image upload to Cloudinary
    let coverImageUrl;
    let coverImagePublicId;
    if (req.file) {
      // Clean up old image using stored ID
      if (existingPost.coverPublicId) {
        await deleteFromCloudinary(existingPost.coverPublicId);
      }

      // Upload new image
      const { url, publicId } = await uploadToCloudinary(
        req.file.buffer,
        "blog-api/posts",
      );

      // Save both to DB
      coverImageUrl = url;
      coverImagePublicId = publicId;
    }

    // Handle Category validation
    if (categoryId) {
      const categoryExists = await prisma.category.findUnique({
        where: { id: categoryId },
      });
      if (!categoryExists) {
        return res
          .status(400)
          .json({ error: "Selected category does not exist." });
      }
    }

    // Handle Tag update (removes old tag associations and connects/creates new ones)
    let tagsUpdate;
    if (tags !== undefined) {
      const tagConnectOrCreate = tags.map((tagName) => {
        const tagSlug = slugify(tagName, {
          lower: true,
          strict: true,
          trim: true,
        });
        return {
          where: { slug: tagSlug },
          create: { name: tagName, slug: tagSlug },
        };
      });

      tagsUpdate = {
        set: [], // Disconnect previous tags
        connectOrCreate: tagConnectOrCreate,
      };
    }

    // Determine publishedAt timestamp handling
    let publishedAtUpdate;
    if (status === "PUBLISHED" && !existingPost.publishedAt) {
      publishedAtUpdate = new Date();
    }

    // Execute Post Update
    const updatedPost = await prisma.post.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(newSlug && { slug: newSlug }),
        ...(content !== undefined && { content }),
        ...(excerpt !== undefined && { excerpt }),
        // Save both cover image URL and publicId when a new file was uploaded
        ...(coverImageUrl &&
          coverImagePublicId && {
            coverImage: coverImageUrl,
            coverPublicId: coverImagePublicId,
          }),
        ...(status !== undefined && { status }),
        ...(publishedAtUpdate && { publishedAt: publishedAtUpdate }),
        ...(categoryId !== undefined && { categoryId }),
        ...(tagsUpdate && { tags: tagsUpdate }),
      },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        content: true,
        coverImage: true,
        coverPublicId: true,
        status: true,
        publishedAt: true,
        updatedAt: true,
        author: {
          select: { id: true, username: true, avatarUrl: true },
        },
        category: {
          select: { id: true, name: true, slug: true },
        },
        tags: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    return res.json({
      message: "Post updated successfully.",
      post: updatedPost,
    });
  } catch (err) {
    console.error("Update Post Error:", err);
    return res.status(500).json({ error: "Server error updating post." });
  }
};
