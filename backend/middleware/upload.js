import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinaryConfig.js";

// Configure Cloudinary storage with dynamic params
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // Determine resource type based on file mimetype
    let resourceType = "image";
    let format = undefined;
    
    // Extract extension from original filename as backup
    const ext = file.originalname.split('.').pop()?.toLowerCase();
    
    if (file.mimetype === "application/pdf") {
      resourceType = "raw";
      format = "pdf";
    } else if (
      file.mimetype === "application/msword" ||
      file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      resourceType = "raw";
      format = file.mimetype.includes("openxmlformats") ? "docx" : "doc";
    } else if (file.mimetype.startsWith("image/")) {
      // For images, use the extension from filename if available
      resourceType = "image";
      if (ext && ["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) {
        format = ext === "jpg" ? "jpeg" : ext;
      }
    }
    
    console.log(`Uploading file: ${file.originalname}, mimetype: ${file.mimetype}, resource_type: ${resourceType}, format: ${format || 'auto'}`);
    
    return {
      folder: "iem_connect_uploads",
      resource_type: resourceType,
      format: format,
      // Don't use allowed_formats - our fileFilter already validates mimetypes
      // and Cloudinary's format detection can fail for some valid files
    };
  },
});

// File filter to validate file types before upload
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  console.log(`File filter checking: ${file.originalname}, mimetype: ${file.mimetype}`);

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    console.error(`Rejected file type: ${file.mimetype} for file: ${file.originalname}`);
    cb(new Error(`Invalid file type: ${file.mimetype}. Allowed types: JPEG, PNG, GIF, WebP, PDF, DOC, DOCX`), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

export default upload;

