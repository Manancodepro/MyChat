import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getMessages,
  getUsersForSidebar,
  sendMessage,
  scheduleMessage,
  cancelScheduledMessage,
  getScheduledMessages,
} from "../controllers/message.controller.js";

const router = express.Router();

router.get("/users", protectRoute, getUsersForSidebar);
router.get("/:id", protectRoute, getMessages);
router.get("/scheduled/list", protectRoute, getScheduledMessages);

router.post("/send/:id", protectRoute, sendMessage);
router.post("/schedule/:id", protectRoute, scheduleMessage);
router.delete("/cancel/:messageId", protectRoute, cancelScheduledMessage);

export default router;