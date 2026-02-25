import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getMessages,
  getUsersForSidebar,
  sendMessage,
  scheduleMessage,
  cancelScheduledMessage,
  getScheduledMessages,
  triggerCleanup,
  uploadFileMessage,
  addReaction,
  removeReaction,
  editMessage,
  deleteForMe,
  deleteForEveryone,
} from "../controllers/message.controller.js";
import { uploadMiddleware } from "../lib/multer.js";

const router = express.Router();

// Base endpoints
router.get("/users", protectRoute, getUsersForSidebar);
router.get("/:id", protectRoute, getMessages);
router.post("/send/:id", protectRoute, sendMessage);

// Scheduled messages
router.get("/scheduled/list", protectRoute, getScheduledMessages);
router.post("/schedule/:id", protectRoute, scheduleMessage);
router.delete("/cancel/:messageId", protectRoute, cancelScheduledMessage);

// File upload
router.post(
  "/upload/:id",
  protectRoute,
  uploadMiddleware.single("file"),
  uploadFileMessage,
);

// Reactions
router.post("/:messageId/reaction", protectRoute, addReaction);
router.delete("/:messageId/reaction", protectRoute, removeReaction);

// Edit & Delete
router.patch("/:messageId/edit", protectRoute, editMessage);
router.delete("/:messageId/deleteForMe", protectRoute, deleteForMe);
router.delete("/:messageId/deleteForEveryone", protectRoute, deleteForEveryone);

// Admin cleanup
router.post("/admin/cleanup", protectRoute, triggerCleanup);

export default router;
