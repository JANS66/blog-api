import { prisma } from "../config/db.js";
import { createUniqueSlug } from "../utils/slugify.js";
import slugify from "slugify";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";
import DOMPurify from "isomorphic-dompurify";

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
        OR: [{ slug: category }, { name: category }],
      };
    }

    // Filter by Tag slug or name
    if (tag) {
      where.tags = {
        some: {
          OR: [{ slug: tag }, { name: tag }],
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

    // Fetch posts and total count
    const [posts, totalPosts] = await prisma.$transaction([
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

    // Fetch post basic details and author ID
    const existingPost = await prisma.post.findUnique({
      where: { slug },
      select: { id: true, status: true, authorId: true },
    });

    if (!existingPost) {
      return res.status(404).json({ error: "Post not found." });
    }

    // Check ownership if post is DRAFT
    const isOwnerOrAdmin =
      Boolean(req.user) &&
      (req.user.id === existingPost.authorId || req.user.role === "ADMIN");

    if (existingPost.status === "DRAFT" && !isOwnerOrAdmin) {
      return res.status(404).json({ error: "Post not found." });
    }

    // Increment views ONLY if the post is PUBLISHED
    const isPublished = existingPost.status === "PUBLISHED";

    // Increment view count and fetch full post details in an atomic update
    const post = await prisma.post.update({
      where: { id: existingPost.id },
      data: isPublished ? { viewsCount: { increment: 1 } } : {},
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
  let uploadedPublicId = null;

  try {
    const { title, content, excerpt, status, categoryId, tags } =
      req.valid.body;
    const authorId = req.user.id;

    // Sanitize HTML content BEFORE saving to database
    const cleanContent = DOMPurify.sanitize(content, {
      ALLOWED_TAGS: [
        "p",
        "b",
        "i",
        "em",
        "strong",
        "a",
        "h1",
        "h2",
        "h3",
        "ul",
        "ol",
        "li",
        "blockquote",
        "code",
        "pre",
        "br",
        "span",
        "img",
      ],
      ALLOWED_ATTR: ["href", "target", "rel", "src", "alt"],
    });

    // Also sanitize excerpt if provided by user
    let cleanExcerpt = excerpt ? DOMPurify.sanitize(excerpt) : null;

    // If excerpt is missing, derive it from cleanContent (strip remaining tags for plaintext summary)
    if (!cleanExcerpt) {
      const plainTextContent = cleanContent.replace(/<[^>]*>/g, "").trim();
      cleanExcerpt = plainTextContent.substring(0, 150) + "...";
    }

    // Prepare synchronous data and slug generation FIRST
    const slug = await createUniqueSlug(title);

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

    // Upload Cover Image to Cloudinary ONLY after slug/tags succeed
    let coverImageUrl = null;
    let coverPublicId = null;

    if (req.file) {
      const uploadResult = await uploadToCloudinary(
        req.file.buffer,
        "blog-api/posts",
      );
      coverImageUrl = uploadResult.url;
      coverPublicId = uploadResult.publicId;
      uploadedPublicId = uploadResult.publicId;
    }

    // Create Post in DB
    const post = await prisma.post.create({
      data: {
        title,
        slug,
        content: cleanContent,
        excerpt: cleanExcerpt,
        coverImage: coverImageUrl,
        coverPublicId: coverPublicId,
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
        coverPublicId: true,
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
    // ROLLBACK: Remove uploaded asset if DB creation failes
    if (uploadedPublicId) {
      await deleteFromCloudinary(uploadedPublicId).catch((cleanupErr) => {
        console.error("Failed to cleanup orphaned post cover:", cleanupErr);
      });
    }

    // Foreign Key constraint failure (e.g., categoryId does not exist)
    if (err.code === "P2003") {
      return res
        .status(400)
        .json({ error: "Selected category does not exist." });
    }

    // Unique constraint violation (e.g., rare race condition on slug)
    if (err.code === "P2002") {
      return res
        .status(409)
        .json({ error: "A post with this title or slug already exists." });
    }

    console.error("Create Post Error:", err);
    return res.status(500).json({ error: "Server error creating post." });
  }
};

/**
 * PATCH /api/v1/posts/:id
 * Author (Owner) / Admin - Update post details
 */
export const updatePost = async (req, res) => {
  let newUploadedPublicId = null;

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

    // Upload NEW file to Cloudinary first
    let coverImageUrl;
    let coverImagePublicId;
    if (req.file) {
      // Upload new image
      const { url, publicId } = await uploadToCloudinary(
        req.file.buffer,
        "blog-api/posts",
      );
      coverImageUrl = url;
      coverImagePublicId = publicId;
      newUploadedPublicId = publicId;
    }

    // Determine publishedAt timestamp handling
    let publishedAtUpdate;
    if (status === "PUBLISHED" && !existingPost.publishedAt) {
      publishedAtUpdate = new Date();
    }

    // Handle Content Sanitization and Excerpt
    let cleanContent;
    let cleanExcerpt;

    if (content !== undefined) {
      cleanContent = DOMPurify.sanitize(content, {
        ALLOWED_TAGS: [
          "p",
          "b",
          "i",
          "em",
          "strong",
          "a",
          "h1",
          "h2",
          "h3",
          "ul",
          "ol",
          "li",
          "blockquote",
          "code",
          "pre",
          "br",
          "span",
          "img",
        ],
        ALLOWED_ATTR: ["href", "target", "rel", "src", "alt"],
      });
    }

    // Only touch excerpt IF the frontend explicitly sent an excerpt field
    if (excerpt !== undefined) {
      const trimmed = excerpt.trim();
      if (trimmed) {
        cleanExcerpt = DOMPurify.sanitize(trimmed);
      } else {
        cleanExcerpt = ""; // User explicitly cleared the field
      }
    }

    // Execute Post Update
    const updatedPost = await prisma.post.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(newSlug && { slug: newSlug }),
        ...(cleanContent !== undefined && { content: cleanContent }),
        ...(cleanExcerpt !== undefined && { excerpt: cleanExcerpt }),
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

    // Delete OLD asset ONLY AFTER DB update succeeds
    if (req.file && existingPost.coverPublicId) {
      deleteFromCloudinary(existingPost.coverPublicId).catch((err) => {
        console.error("Failed to delete legacy post cover:", err);
      });
    }

    return res.json({
      message: "Post updated successfully.",
      post: updatedPost,
    });
  } catch (err) {
    // CLEANUP: Delete newly uploaded asset if DB update fails
    if (newUploadedPublicId) {
      await deleteFromCloudinary(newUploadedPublicId).catch((cleanupErr) => {
        console.error("Failed to cleanup orphaned post cover:", cleanupErr);
      });
    }

    // Foreign Key constraint violation (slug collision)
    if (err.code === "P2002") {
      return res
        .status(409)
        .json({ error: "A post with this title or slug already exists." });
    }

    console.error("Update Post Error:", err);
    return res.status(500).json({ error: "Server error updating post." });
  }
};

/**
 * DELETE /api/v1/posts/:id
 * Author (Owner) / Admin - Delete post and its Cloudinary cover image
 */
export const deletePost = async (req, res) => {
  try {
    const { id } = req.valid.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Fetch post to check existence, ownership, and Cloudinary coverPublicId
    const existingPost = await prisma.post.findUnique({
      where: { id },
      select: {
        id: true,
        authorId: true,
        coverPublicId: true,
      },
    });

    if (!existingPost) {
      return res.status(404).json({ error: "Post not found." });
    }

    // Authorization check: Must be post owner or ADMIN
    if (existingPost.authorId !== userId && userRole !== "ADMIN") {
      return res.status(403).json({
        error: "Access denied. You can only delete your own posts.",
      });
    }

    // Delete post from Database FIRST
    await prisma.post.delete({
      where: { id },
    });

    // Clean up cover image from Cloudinary AFTER successful DB deletion
    if (existingPost.coverPublicId) {
      deleteFromCloudinary(existingPost.coverPublicId).catch((err) => {
        console.error("Failed to delete post cover image during delete:", err);
      });
    }

    return res.json({
      message: "Post deleted successfully.",
    });
  } catch (err) {
    // Record was deleted by a concurrent request between findUnique and delete
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Post not found." });
    }

    console.error("Delete Post Error:", err);
    return res.status(500).json({ error: "Server error deleting post." });
  }
};
