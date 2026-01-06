import express from "express";
import { protectRoute } from "../middleware/message.middleware.js";

const router = express.Router();

router.get("/users", protectRoute, getUsersForSidebar);
export default router;  