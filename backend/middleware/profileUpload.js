import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinaryConfig.js";

// Configure Cloudinary storage for avatars
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "iem_connect_avatars",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 512, height: 512, crop: "fill", gravity: "face" }], // Resize on upload
  },
});

// File filter - only images
const fileFilter = (req, file, cb) => {
  const allowedMimes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed."), false);
  }
};

const profileUpload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Helper function to extract public_id from Cloudinary URL
const extractCloudinaryPublicId = (url) => {
  if (!url || !url.includes('cloudinary.com')) return null;
  try {
    // Match the pattern after /upload/
    const match = url.match(/\/(?:image|raw|video)\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/);
    if (match && match[1]) {
      return match[1];
    }
    return null;
  } catch (error) {
    console.error('Error extracting Cloudinary public_id:', error);
    return null;
  }
};

/**
 * Process uploaded avatar image
 * Returns the Cloudinary URL for the uploaded image
 */
export const processAvatarImage = async (file) => {
  if (!file) {
    throw new Error("No file uploaded");
  }
  return file.path; // Cloudinary URL (e.g., https://res.cloudinary.com/...)
};

/**
 * Delete avatar file from Cloudinary
 * @param {string} avatarUrl - Full Cloudinary URL or public_id
 */
export const deleteAvatarFile = async (avatarUrl) => {
  if (!avatarUrl) return;

  try {
    // Extract public_id from URL if it's a full URL
    const publicId = avatarUrl.includes('cloudinary.com') 
      ? extractCloudinaryPublicId(avatarUrl)
      : avatarUrl; // Assume it's already a public_id for legacy data
    
    if (publicId) {
      await cloudinary.uploader.destroy(publicId);
      console.log(`Deleted avatar from Cloudinary: ${publicId}`);
    }
  } catch (error) {
    console.error(`Error deleting avatar:`, error);
  }
};

export default profileUpload;
