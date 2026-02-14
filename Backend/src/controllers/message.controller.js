import User from "../models/user.model.js";
import Message from "../models/message.model.js";

import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import { scheduleMessageJob, cancelScheduledJob } from "../lib/messageQueue.js";
import { cleanupOldMessages } from "../lib/cleanup.js";

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
    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        {
          senderId: userToChatId,
          receiverId: myId,
          status: { $ne: "scheduled" },
        },
      ],
    });

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
    console.log("[triggerCleanup] Manual cleanup triggered by user:", req.user._id);
    
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
