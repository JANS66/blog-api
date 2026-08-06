import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload an image buffer directly to Cloudinary
 * @param {Buffer} fileBuffer - The memory buffer from multer
 * @param {string} folder - Folder name in Cloudinary (e.g. 'avatars', 'posts')
 * @returns {Promise<string>} Secure URL of the uploaded image
 */
export const uploadToCloudinary = (fileBuffer, folder = "blog-uploads") => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        transformation: [{ width: 500, height: 500, crop: "limit" }], // auto resize
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      },
    );
    stream.end(fileBuffer);
  });
};
