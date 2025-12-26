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

/**
 * Process uploaded avatar image - Adapter for legacy code
 * In Cloudinary version, this just returns the filename/public_id
 */
export const processAvatarImage = async (file) => {
  // Multer-storage-cloudinary puts the file info in req.file
  // We just need to return the filename (which is the public_id or url)
  if (!file) {
    throw new Error("No file uploaded");
  }
  return file.filename; // Cloudinary public_id
};

/**
 * Delete avatar file from Cloudinary
 * @param {string} filename - Cloudinary public_id
 */
export const deleteAvatarFile = async (filename) => {
  if (!filename) return;

  try {
    await cloudinary.uploader.destroy(filename);
    console.log(`Deleted avatar from Cloudinary: ${filename}`);
  } catch (error) {
    console.error(`Error deleting avatar ${filename}:`, error);
  }
};

export default profileUpload;
