import User from "../models/user.model.js";
import Message from "../models/message.model.js";

import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import { scheduleMessageJob, cancelScheduledJob } from "../lib/messageQueue.js";
import { cleanupOldMessages } from "../lib/cleanup.js";
import {
  validateFileUpload,
  getFileType,
  deleteUploadedFile,
} from "../lib/multer.js";

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({
      _id: { $ne: loggedInUserId },
    }).select("-password");

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    // Sender sees all their messages (including scheduled)
    // Receiver doesn't see scheduled messages until they're actually sent
    // Filter out deleted messages
    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        {
          senderId: userToChatId,
          receiverId: myId,
          status: { $ne: "scheduled" },
        },
      ],
      // Don't return messages deleted for everyone
      deletedForEveryone: { $ne: true },
      // Don't return messages deleted for this specific user
      $nor: [{ deletedFor: myId }],
    })
      .sort({ createdAt: 1 })
      .lean();

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    let imageUrl;
    if (image) {
      // Upload base64 image to cloudinary
      const uploadResponse = await cloudinary.uploader.upload(image, {
        resource_type: "auto",
      });
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
    });

    await newMessage.save();

    const receiverSocketId = getReceiverSocketId(receiverId);
    console.log(
      "[sendMessage] receiverId:",
      String(receiverId),
      "type:",
      typeof receiverId,
      "receiverSocketId:",
      receiverSocketId,
    );
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const scheduleMessage = async (req, res) => {
  try {
    const { text, image, scheduledTime } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    // Validate scheduledTime
    const scheduled = new Date(scheduledTime);
    const now = new Date();

    if (scheduled <= now) {
      return res
        .status(400)
        .json({ error: "Scheduled time must be in the future" });
    }

    // Validate timezone (ensure UTC)
    if (
      scheduled.toString().includes("GMT") === false &&
      process.env.NODE_ENV === "production"
    ) {
      console.warn("[scheduleMessage] Warning: Timezone not explicitly UTC");
    }

    let imageUrl;
    if (image) {
      // Upload base64 image to cloudinary
      const uploadResponse = await cloudinary.uploader.upload(image, {
        resource_type: "auto",
      });
      imageUrl = uploadResponse.secure_url;
    }

    // Create scheduled message
    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
      status: "scheduled",
      scheduledTime: scheduled,
    });

    await newMessage.save();

    // Schedule the job
    const jobId = await scheduleMessageJob(newMessage._id, scheduled);
    newMessage.jobId = jobId;
    await newMessage.save();

    // Emit to sender that message scheduled
    const senderSocketId = getReceiverSocketId(senderId);
    if (senderSocketId) {
      io.to(senderSocketId).emit("messageScheduled", {
        messageId: newMessage._id,
        status: "scheduled",
        scheduledTime: scheduled,
      });
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.error("[scheduleMessage] Error:", error.message);
    res.status(500).json({ error: "Failed to schedule message" });
  }
};

export const getScheduledMessages = async (req, res) => {
  try {
    const userId = req.user._id;

    const scheduledMessages = await Message.find({
      senderId: userId,
      status: "scheduled",
    }).sort({ scheduledTime: 1 });

    res.status(200).json(scheduledMessages);
  } catch (error) {
    console.error("[getScheduledMessages] Error:", error.message);
    res.status(500).json({ error: "Failed to fetch scheduled messages" });
  }
};

export const cancelScheduledMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    // Find message and verify ownership
    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    if (message.senderId.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ error: "You can only cancel your own messages" });
    }

    if (message.status !== "scheduled") {
      return res.status(400).json({ error: "Message is not scheduled" });
    }

    // Cancel the job
    if (message.jobId) {
      await cancelScheduledJob(message.jobId);
    }

    // Update message status
    message.status = "cancelled";
    await message.save();

    // Emit to sender
    const senderSocketId = getReceiverSocketId(userId);
    if (senderSocketId) {
      io.to(senderSocketId).emit("messageCancelled", {
        messageId: message._id,
        status: "cancelled",
      });
    }

    res.status(200).json({ message: "Message cancelled", data: message });
  } catch (error) {
    console.error("[cancelScheduledMessage] Error:", error.message);
    res.status(500).json({ error: "Failed to cancel message" });
  }
};

/**
 * Manual cleanup endpoint - trigger cleanup of messages older than 30 days
 * This is useful for testing or manual maintenance
 */
export const triggerCleanup = async (req, res) => {
  try {
    console.log(
      "[triggerCleanup] Manual cleanup triggered by user:",
      req.user._id,
    );

    const result = await cleanupOldMessages();

    res.status(200).json({
      message: "Cleanup completed successfully",
      data: result,
    });
  } catch (error) {
    console.error("[triggerCleanup] Error:", error.message);
    res.status(500).json({ error: "Failed to trigger cleanup" });
  }
};

// ============================================
// ===== FILE UPLOAD FEATURE =====
// ============================================

/**
 * Upload file with message
 * Supports: images, documents, audio, video (max 100MB)
 */
export const uploadFileMessage = async (req, res) => {
  try {
    const { text } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    if (!req.file) {
      return res.status(400).json({ error: "No file provided" });
    }

    // Validate file
    const validation = validateFileUpload(req.file);

    const fileMetadata = {
      url: `/uploads/${validation.fileType}/${req.file.filename}`,
      name: req.file.originalname,
      size: req.file.size,
      mimeType: req.file.mimetype,
      type: validation.fileType,
      uploadedAt: new Date(),
    };

    const newMessage = new Message({
      senderId,
      receiverId,
      text: text || "",
      file: fileMetadata,
    });

    await newMessage.save();

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    console.log(
      `[uploadFile] File uploaded by ${senderId}: ${req.file.filename}`,
    );

    res.status(201).json(newMessage);
  } catch (error) {
    // Delete uploaded file on error
    if (req.file) {
      deleteUploadedFile(req.file.path);
    }

    console.error("[uploadFileMessage] Error:", error.message);

    if (error.code === "FILE_TOO_LARGE") {
      return res.status(413).json({ error: "File exceeds 100MB limit" });
    }
    if (error.code === "INVALID_FILE_TYPE") {
      return res.status(415).json({ error: "Unsupported file type" });
    }

    res.status(500).json({ error: "Failed to upload file" });
  }
};

// ============================================
// ===== MESSAGE REACTIONS =====
// ============================================

/**
 * Add or update emoji reaction on message
 */
export const addReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user._id;

    const VALID_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🔥"];
    if (!VALID_EMOJIS.includes(emoji)) {
      return res.status(400).json({ error: "Invalid emoji" });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Remove user's existing reaction if any
    message.reactions = message.reactions.filter(
      (r) => r.userId.toString() !== userId.toString(),
    );

    // Add new reaction
    message.reactions.push({
      emoji,
      userId,
      reactedAt: new Date(),
    });

    await message.save();

    // Emit to both users
    const senderSocketId = getReceiverSocketId(message.senderId);
    const receiverSocketId = getReceiverSocketId(message.receiverId);

    const reactionUpdate = {
      messageId: message._id,
      reactions: message.reactions,
    };

    if (senderSocketId) {
      io.to(senderSocketId).emit("reactionAdded", reactionUpdate);
    }
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("reactionAdded", reactionUpdate);
    }

    console.log(`[reaction] ${userId} added ${emoji} to message ${messageId}`);

    res.status(200).json({ message: "Reaction added", data: message });
  } catch (error) {
    console.error("[addReaction] Error:", error.message);
    res.status(500).json({ error: "Failed to add reaction" });
  }
};

/**
 * Remove emoji reaction from message
 */
export const removeReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Remove user's reaction
    message.reactions = message.reactions.filter(
      (r) => r.userId.toString() !== userId.toString(),
    );

    await message.save();

    // Emit to both users
    const senderSocketId = getReceiverSocketId(message.senderId);
    const receiverSocketId = getReceiverSocketId(message.receiverId);

    const reactionUpdate = {
      messageId: message._id,
      reactions: message.reactions,
    };

    if (senderSocketId) {
      io.to(senderSocketId).emit("reactionRemoved", reactionUpdate);
    }
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("reactionRemoved", reactionUpdate);
    }

    console.log(`[reaction] Reaction removed from message ${messageId}`);

    res.status(200).json({ message: "Reaction removed", data: message });
  } catch (error) {
    console.error("[removeReaction] Error:", error.message);
    res.status(500).json({ error: "Failed to remove reaction" });
  }
};

// ============================================
// ===== EDIT MESSAGE FEATURE =====
// ============================================

/**
 * Edit message (only sender, within 10 minutes)
 */
export const editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    if (!text || text.trim() === "") {
      return res.status(400).json({ error: "Message text cannot be empty" });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Only sender can edit
    if (message.senderId.toString() !== userId.toString()) {
      return res.status(403).json({ error: "Only sender can edit message" });
    }

    // Check time limit (10 minutes)
    const messageAge = Date.now() - new Date(message.createdAt).getTime();
    const TEN_MINUTES = 10 * 60 * 1000;

    if (messageAge > TEN_MINUTES) {
      return res
        .status(400)
        .json({ error: "Cannot edit message after 10 minutes" });
    }

    // Save to edit history
    if (!message.editHistory) {
      message.editHistory = [];
    }

    message.editHistory.push({
      originalText: message.text,
      editedAt: new Date(),
      editedBy: userId,
    });

    // Update message
    message.text = text.trim();
    message.isEdited = true;
    message.editedAt = new Date();

    await message.save();

    // Emit to both users
    const senderSocketId = getReceiverSocketId(message.senderId);
    const receiverSocketId = getReceiverSocketId(message.receiverId);

    const editUpdate = {
      messageId: message._id,
      text: message.text,
      isEdited: message.isEdited,
      editedAt: message.editedAt,
    };

    if (senderSocketId) {
      io.to(senderSocketId).emit("messageEdited", editUpdate);
    }
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageEdited", editUpdate);
    }

    console.log(`[edit] Message ${messageId} edited by ${userId}`);

    res.status(200).json({ message: "Message edited", data: message });
  } catch (error) {
    console.error("[editMessage] Error:", error.message);
    res.status(500).json({ error: "Failed to edit message" });
  }
};

// ============================================
// ===== DELETE MESSAGE FEATURE =====
// ============================================

/**
 * Delete message for current user only
 */
export const deleteForMe = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Check if user is sender or receiver
    const isSender = message.senderId.toString() === userId.toString();
    const isReceiver = message.receiverId.toString() === userId.toString();

    if (!isSender && !isReceiver) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // Add user to deletedFor array
    if (!message.deletedFor.includes(userId)) {
      message.deletedFor.push(userId);
    }

    await message.save();

    console.log(`[delete] Message ${messageId} hidden for ${userId}`);

    res.status(200).json({ message: "Message deleted for you" });
  } catch (error) {
    console.error("[deleteForMe] Error:", error.message);
    res.status(500).json({ error: "Failed to delete message" });
  }
};

/**
 * Delete message for everyone (only sender, within 10 minutes)
 */
export const deleteForEveryone = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Only sender can delete for everyone
    if (message.senderId.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ error: "Only sender can delete for everyone" });
    }

    // Check time limit (10 minutes)
    const messageAge = Date.now() - new Date(message.createdAt).getTime();
    const TEN_MINUTES = 10 * 60 * 1000;

    if (messageAge > TEN_MINUTES) {
      return res.status(400).json({
        error: "Cannot delete message after 10 minutes",
      });
    }

    // Delete file if exists
    if (message.file?.url) {
      const filePath = `.${message.file.url}`;
      deleteUploadedFile(filePath);
    }

    // Mark as deleted for everyone
    message.deletedForEveryone = true;
    message.deletedAt = new Date();
    message.text = "This message was deleted";

    await message.save();

    // Emit to both users
    const senderSocketId = getReceiverSocketId(message.senderId);
    const receiverSocketId = getReceiverSocketId(message.receiverId);

    const deleteUpdate = {
      messageId: message._id,
      deletedForEveryone: true,
    };

    if (senderSocketId) {
      io.to(senderSocketId).emit("messageDeleted", deleteUpdate);
    }
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageDeleted", deleteUpdate);
    }

    console.log(
      `[delete] Message ${messageId} deleted for everyone by ${userId}`,
    );

    res.status(200).json({ message: "Message deleted for everyone" });
  } catch (error) {
    console.error("[deleteForEveryone] Error:", error.message);
    res.status(500).json({ error: "Failed to delete message" });
  }
};
