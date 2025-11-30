import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure avatars directory exists
const avatarsDir = path.join(__dirname, "../uploads/avatars");
if (!fs.existsSync(avatarsDir)) {
  fs.mkdirSync(avatarsDir, { recursive: true });
}

// Configure storage - store temporarily, then process
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Store in temp directory first
    const tempDir = path.join(__dirname, "../uploads/temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `temp-avatar-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

// File filter - only images
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed."
      ),
      false
    );
  }
};

// Create multer instance for profile pictures
const profileUpload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit for profile pictures
  },
});

/**
 * Process and optimize uploaded avatar image
 * @param {string} tempFilePath - Path to temporary uploaded file
 * @param {number} userId - User ID for filename
 * @returns {Promise<string>} - Filename of processed image
 */
export const processAvatarImage = async (tempFilePath, userId) => {
  try {
    // Generate optimized filename
    const timestamp = Date.now();
    const filename = `avatar-${userId}-${timestamp}.webp`;
    const outputPath = path.join(avatarsDir, filename);

    // Process image with sharp
    await sharp(tempFilePath)
      .resize(512, 512, {
        fit: "cover", // Crop to square, maintain aspect ratio
        position: "center",
      })
      .webp({ quality: 82 }) // Good balance between quality and size
      .toFile(outputPath);

    // Delete temporary file
    fs.unlinkSync(tempFilePath);

    return filename;
  } catch (error) {
    // Clean up temp file on error
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
    throw error;
  }
};

/**
 * Delete avatar file
 * @param {string} filename - Avatar filename to delete
 */
export const deleteAvatarFile = (filename) => {
  if (!filename) return;

  const filePath = path.join(avatarsDir, filename);
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      console.log(`Deleted avatar file: ${filename}`);
    } catch (error) {
      console.error(`Error deleting avatar file ${filename}:`, error);
    }
  }
};

export default profileUpload;

