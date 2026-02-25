import multer from "multer";
import path from "path";
import fs from "fs";

// Ensure uploads directory exists
const uploadsDir = "./uploads";
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// MIME type validation
const ALLOWED_MIME_TYPES = {
  // Images
  "image/jpeg": { ext: ".jpg", type: "image" },
  "image/png": { ext: ".png", type: "image" },
  "image/gif": { ext: ".gif", type: "image" },
  "image/webp": { ext: ".webp", type: "image" },

  // Documents
  "application/pdf": { ext: ".pdf", type: "document" },
  "application/msword": { ext: ".doc", type: "document" },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
    ext: ".docx",
    type: "document",
  },
  "application/vnd.ms-powerpoint": { ext: ".ppt", type: "document" },
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": {
    ext: ".pptx",
    type: "document",
  },
  "application/vnd.ms-excel": { ext: ".xls", type: "document" },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
    ext: ".xlsx",
    type: "document",
  },

  // Audio
  "audio/mpeg": { ext: ".mp3", type: "audio" },
  "audio/wav": { ext: ".wav", type: "audio" },

  // Video
  "video/mp4": { ext: ".mp4", type: "video" },
  "video/webm": { ext: ".webm", type: "video" },
};

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const fileType = ALLOWED_MIME_TYPES[file.mimetype]?.type || "other";
    const uploadPath = path.join(uploadsDir, fileType);

    // Create subdirectories if they don't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp + random + original extension
    const uniqueName =
      `${Date.now()}_${Math.round(Math.random() * 1e9)}` +
      path.extname(file.originalname);
    cb(null, uniqueName);
  },
});

// File filter for security
const fileFilter = (req, file, cb) => {
  try {
    const mimeInfo = ALLOWED_MIME_TYPES[file.mimetype];

    if (!mimeInfo) {
      const error = new Error(`File type not allowed. MIME: ${file.mimetype}`);
      error.code = "INVALID_FILE_TYPE";
      return cb(error);
    }

    // Double-check extension matches MIME type (prevent spoofing)
    const fileExt = path.extname(file.originalname).toLowerCase();
    if (fileExt !== mimeInfo.ext) {
      const error = new Error(
        `File extension does not match MIME type. Got ${fileExt}, expected ${mimeInfo.ext}`,
      );
      error.code = "FILE_TYPE_MISMATCH";
      return cb(error);
    }

    cb(null, true);
  } catch (error) {
    cb(error);
  }
};

// Multer upload middleware configuration
export const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
    files: 1, // single file per request
  },
});

/**
 * Get file type from MIME type
 */
export const getFileType = (mimeType) => {
  return ALLOWED_MIME_TYPES[mimeType]?.type || "unknown";
};

/**
 * Validate file upload
 */
export const validateFileUpload = (file) => {
  if (!file) {
    const error = new Error("No file provided");
    error.code = "NO_FILE";
    throw error;
  }

  const mimeInfo = ALLOWED_MIME_TYPES[file.mimetype];
  if (!mimeInfo) {
    const error = new Error(`Unsupported file type: ${file.mimetype}`);
    error.code = "UNSUPPORTED_FILE_TYPE";
    throw error;
  }

  if (file.size > 100 * 1024 * 1024) {
    const error = new Error("File size exceeds 100MB limit");
    error.code = "FILE_TOO_LARGE";
    throw error;
  }

  return {
    isValid: true,
    fileType: mimeInfo.type,
    mimeType: file.mimetype,
  };
};

/**
 * Clean up uploaded file
 */
export const deleteUploadedFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`[Upload] Deleted file: ${filePath}`);
      return true;
    }
  } catch (error) {
    console.error(`[Upload] Error deleting file ${filePath}:`, error.message);
  }
  return false;
};

export default uploadMiddleware;
