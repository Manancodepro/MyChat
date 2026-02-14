import Message from "../models/message.model.js";
import cloudinary from "./cloudinary.js";

/**
 * Extract public_id from Cloudinary secure URL
 * URL format: https://res.cloudinary.com/[cloud_name]/image/upload/v[version]/[public_id]
 * or: https://res.cloudinary.com/[cloud_name]/video/upload/v[version]/[public_id]
 */
const extractPublicIdFromUrl = (url) => {
  if (!url) return null;

  try {
    // Match the public_id part from Cloudinary URL
    // The public_id comes after the version number
    const match = url.match(/\/([^\/]+)(?:\.[a-z]+)?$/);
    if (match) {
      return match[1];
    }
  } catch (error) {
    console.error("Error extracting public_id from URL:", url, error);
  }

  return null;
};

/**
 * Delete image from Cloudinary using public_id
 */
const deleteCloudinaryImage = async (publicId) => {
  if (!publicId) return false;

  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: "auto",
    });

    if (result.result === "ok") {
      console.log(`[Cleanup] Deleted Cloudinary image: ${publicId}`);
      return true;
    }
  } catch (error) {
    console.error(
      `[Cleanup] Error deleting Cloudinary image ${publicId}:`,
      error.message,
    );
  }

  return false;
};

/**
 * Main cleanup function - deletes messages older than 30 days
 * Also deletes associated Cloudinary images
 */
export const cleanupOldMessages = async () => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    console.log(
      `[Cleanup] Starting cleanup of messages older than: ${thirtyDaysAgo.toISOString()}`,
    );

    // Find all messages older than 30 days
    const oldMessages = await Message.find({
      createdAt: { $lt: thirtyDaysAgo },
    }).select("_id image");

    if (oldMessages.length === 0) {
      console.log("[Cleanup] No messages to delete");
      return { deletedCount: 0, imageDeletedCount: 0 };
    }

    console.log(
      `[Cleanup] Found ${oldMessages.length} messages to delete`,
    );

    let imageDeletedCount = 0;

    // Delete associated Cloudinary images first
    for (const message of oldMessages) {
      if (message.image) {
        const publicId = extractPublicIdFromUrl(message.image);
        if (publicId) {
          const deleted = await deleteCloudinaryImage(publicId);
          if (deleted) imageDeletedCount++;
        }
      }
    }

    // Delete messages from MongoDB
    const result = await Message.deleteMany({
      createdAt: { $lt: thirtyDaysAgo },
    });

    console.log(
      `[Cleanup] Successfully deleted ${result.deletedCount} messages and ${imageDeletedCount} Cloudinary images`,
    );

    return {
      deletedCount: result.deletedCount,
      imageDeletedCount,
    };
  } catch (error) {
    console.error("[Cleanup] Error during cleanup:", error.message);
    return { deletedCount: 0, imageDeletedCount: 0, error: error.message };
  }
};

/**
 * Schedule automatic cleanup to run every 24 hours
 * Also runs once on startup after a delay
 */
export const scheduleCleanup = () => {
  try {
    // Run cleanup once on server startup (after 5 seconds delay)
    setTimeout(() => {
      console.log("[Cleanup] Running initial cleanup on server startup");
      cleanupOldMessages();
    }, 5000);

    // Schedule cleanup every 24 hours (86400000 milliseconds)
    const cleanupInterval = setInterval(() => {
      console.log("[Cleanup] Running scheduled daily cleanup");
      cleanupOldMessages();
    }, 24 * 60 * 60 * 1000);

    console.log("[Cleanup] Automatic cleanup scheduled to run every 24 hours");

    return cleanupInterval;
  } catch (error) {
    console.error("[Cleanup] Error scheduling cleanup:", error.message);
  }
};
