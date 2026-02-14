import Message from "../models/message.model.js";
import { getReceiverSocketId, io } from "./socket.js";

// In-memory job store (no Redis needed!)
const scheduledJobs = new Map();
const jobTimers = new Map();

// Process a scheduled message
async function processScheduledJob(messageId, jobId) {
  try {
    console.log(`[MessageQueue] Processing job ${jobId}: ${messageId}`);

    const message = await Message.findById(messageId);

    if (!message) {
      console.error(`[MessageQueue] Message not found: ${messageId}`);
      return;
    }

    if (message.status === "cancelled") {
      console.log(`[MessageQueue] Message already cancelled: ${messageId}`);
      scheduledJobs.delete(jobId);
      return;
    }

    // Update message status to sent with delivery timestamp
    message.status = "sent";
    message.deliveredAt = new Date();
    await message.save();

    // Emit socket event to receiver with FULL message (shows actual delivery time)
    const receiverSocketId = getReceiverSocketId(String(message.receiverId));
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", message);
    }

    // Emit update to sender with FULL message (shows actual delivery time)
    const senderSocketId = getReceiverSocketId(String(message.senderId));
    if (senderSocketId) {
      io.to(senderSocketId).emit("messageDelivered", {
        messageId: message._id,
        status: "sent",
        deliveredAt: message.deliveredAt,
      });
    }

    console.log(
      `[MessageQueue] Successfully sent scheduled message: ${message._id}`,
    );
    scheduledJobs.delete(jobId);
  } catch (error) {
    console.error(
      `[MessageQueue] Error processing job ${jobId}:`,
      error.message,
    );
    // Retry later
    setTimeout(() => processScheduledJob(messageId, jobId), 2000);
  }
}

// Schedule a message for later delivery
export async function scheduleMessageJob(messageId, scheduledTime) {
  try {
    const delay = scheduledTime.getTime() - new Date().getTime();

    if (delay < 0) {
      throw new Error("Scheduled time cannot be in the past");
    }

    const jobId = `message-${messageId}`;

    // Store job info
    scheduledJobs.set(jobId, { messageId, scheduledTime, created: new Date() });

    // Set timer to process job when time comes
    const timer = setTimeout(() => {
      processScheduledJob(messageId, jobId);
    }, delay);

    jobTimers.set(jobId, timer);

    console.log(
      `[MessageQueue] Scheduled job ${jobId} for message ${messageId} in ${delay}ms`,
    );
    return jobId;
  } catch (error) {
    console.error(
      "[MessageQueue] Error scheduling message job:",
      error.message,
    );
    throw error;
  }
}

// Cancel a scheduled message job
export async function cancelScheduledJob(jobId) {
  try {
    const job = scheduledJobs.get(jobId);

    if (!job) {
      console.warn(`[MessageQueue] Job not found: ${jobId}`);
      return false;
    }

    // Clear the timer
    const timer = jobTimers.get(jobId);
    if (timer) {
      clearTimeout(timer);
      jobTimers.delete(jobId);
    }

    scheduledJobs.delete(jobId);
    console.log(`[MessageQueue] Cancelled job: ${jobId}`);
    return true;
  } catch (error) {
    console.error("[MessageQueue] Error cancelling job:", error.message);
    throw error;
  }
}

// Cleanup on graceful shutdown
export async function closeMessageQueue() {
  // Clear all timers
  for (const timer of jobTimers.values()) {
    clearTimeout(timer);
  }
  jobTimers.clear();
  scheduledJobs.clear();
  console.log("[MessageQueue] In-memory queue closed");
}
