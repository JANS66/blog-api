import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Default transformation presets based on upload type
 */
const DEFAULT_TRANSFORMATIONS = {
  avatars: [{ width: 500, height: 500, crop: "fill", gravity: "face" }], // Square avatar cropped on face
  posts: [{ width: 1200, height: 630, crop: "limit" }], // Widescreen banner for web
  default: [{ width: 1200, crop: "limit" }],
};

/**
 * Upload an image buffer directly to Cloudinary
 * @param {Buffer} fileBuffer - The memory buffer from multer
 * @param {string} folder - Folder path in Cloudinary (e.g. 'blog-api/avatars', 'blog-api/posts')
 * @param {Array} [customTransformations] - Optional override array of Cloudinary transformations
 * @returns {Promise<string>} Secure URL of the uploaded image
 */
export const uploadToCloudinary = (
  fileBuffer,
  folder = "blog-uploads",
  customTransformations = null,
) => {
  // Auto detect preset based on folder name if customTransformations not passed
  let transformations = customTransformations;
  if (!transformations) {
    if (folder.includes("avatar")) {
      transformation = DEFAULT_TRANSFORMATIONS.avatars;
    } else if (folder.includes("post")) {
      transformations = DEFAULT_TRANSFORMATIONS.posts;
    } else {
      transformations = DEFAULT_TRANSFORMATIONS.default;
    }
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        transformation: transformations,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      },
    );
    stream.end(fileBuffer);
  });
};
