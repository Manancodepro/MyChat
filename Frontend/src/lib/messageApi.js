import { axiosInstance } from "./axios.js";

// ============================================
// ===== FILE UPLOAD API =====
// ============================================

/**
 * Upload file with message
 */
export const uploadFileMessage = async (receiverId, file, text = "") => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("text", text);

    const response = await axiosInstance.post(
      `/messages/upload/${receiverId}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        // Show upload progress
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total,
          );
          return { progress: percentCompleted };
        },
      },
    );

    return response.data;
  } catch (error) {
    console.error("[API] uploadFileMessage error:", error.response?.data);
    throw error.response?.data || { error: "Failed to upload file" };
  }
};

// ============================================
// ===== MESSAGE REACTIONS API =====
// ============================================

/**
 * Add emoji reaction to message
 */
export const addReaction = async (messageId, emoji) => {
  try {
    const response = await axiosInstance.post(
      `/messages/${messageId}/reaction`,
      {
        emoji,
      },
    );
    return response.data;
  } catch (error) {
    console.error("[API] addReaction error:", error.response?.data);
    throw error.response?.data || { error: "Failed to add reaction" };
  }
};

/**
 * Remove emoji reaction from message
 */
export const removeReaction = async (messageId) => {
  try {
    const response = await axiosInstance.delete(
      `/messages/${messageId}/reaction`,
    );
    return response.data;
  } catch (error) {
    console.error("[API] removeReaction error:", error.response?.data);
    throw error.response?.data || { error: "Failed to remove reaction" };
  }
};

// ============================================
// ===== MESSAGE EDIT API =====
// ============================================

/**
 * Edit message (only sender, within 10 minutes)
 */
export const editMessage = async (messageId, text) => {
  try {
    const response = await axiosInstance.patch(`/messages/${messageId}/edit`, {
      text,
    });
    return response.data;
  } catch (error) {
    console.error("[API] editMessage error:", error.response?.data);
    throw error.response?.data || { error: "Failed to edit message" };
  }
};

// ============================================
// ===== MESSAGE DELETE API =====
// ============================================

/**
 * Delete message for current user only
 */
export const deleteForMe = async (messageId) => {
  try {
    const response = await axiosInstance.delete(
      `/messages/${messageId}/deleteForMe`,
    );
    return response.data;
  } catch (error) {
    console.error("[API] deleteForMe error:", error.response?.data);
    throw error.response?.data || { error: "Failed to delete message" };
  }
};

/**
 * Delete message for everyone (only sender, within 10 minutes)
 */
export const deleteForEveryone = async (messageId) => {
  try {
    const response = await axiosInstance.delete(
      `/messages/${messageId}/deleteForEveryone`,
    );
    return response.data;
  } catch (error) {
    console.error("[API] deleteForEveryone error:", error.response?.data);
    throw error.response?.data || { error: "Failed to delete message" };
  }
};

// ============================================
// ===== UTILITY FUNCTIONS =====
// ============================================

/**
 * Get file icon based on file type
 */
export const getFileIcon = (fileType) => {
  const icons = {
    image: "🖼️",
    document: "📄",
    audio: "🎵",
    video: "🎬",
  };
  return icons[fileType] || "📎";
};

/**
 * Format file size to readable format (B, KB, MB)
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

/**
 * Check if user can edit/delete message (10-minute window)
 */
export const canEditOrDelete = (messageCreatedAt) => {
  const TEN_MINUTES = 10 * 60 * 1000;
  const messageAge = Date.now() - new Date(messageCreatedAt).getTime();
  return messageAge < TEN_MINUTES;
};

/**
 * Time remaining string for edit/delete window
 */
export const getTimeRemaining = (messageCreatedAt) => {
  const TEN_MINUTES = 10 * 60 * 1000;
  const messageAge = Date.now() - new Date(messageCreatedAt).getTime();
  const remaining = TEN_MINUTES - messageAge;

  if (remaining <= 0) return null;

  const seconds = Math.floor((remaining / 1000) % 60);
  const minutes = Math.floor((remaining / (1000 * 60)) % 60);

  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
};

/**
 * Valid emoji reactions
 */
export const VALID_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🔥"];
