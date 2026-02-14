import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";

import path from "path";

import { connectDB } from "./lib/db.js";

import authRoutes from "./routes/auth.routes.js";
import messageRoutes from "./routes/message.routes.js";
import { app, server } from "./lib/socket.js";
import { closeMessageQueue } from "./lib/messageQueue.js";
import redis from "./lib/redis.js";

dotenv.config();

const PORT = process.env.PORT;
const __dirname = path.resolve();
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

// enable CORS for the frontend (must be registered BEFORE any body parsers)
app.use(
  cors({
    origin: CLIENT_ORIGIN,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Origin",
      "X-Requested-With",
      "Content-Type",
      "Accept",
      "Authorization",
      "cookie",
    ],
  }),
);

// body size limits: increase to allow base64 image payloads
// increase limits for images/files sent as base64 in JSON (adjust if needed)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());
// Note: using only the `cors` middleware above ensures preflight and
// standard CORS headers are set. Avoid duplicating headers manually.

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

// Redirect root server URL to frontend login page (useful when opening localhost:5000 in browser)
app.get("/", (req, res) => {
  const loginUrl = `${CLIENT_ORIGIN}/login`;
  return res.redirect(loginUrl);
});

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
  });
}

const httpServer = server.listen(PORT, () => {
  console.log("server is running on PORT:" + PORT);
  connectDB();
});

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(`\n[${signal}] Received, shutting down gracefully...`);

  try {
    httpServer.close(async () => {
      console.log("HTTP server closed");
      await closeMessageQueue();
      await redis.quit();
      console.log("[Shutdown] All resources cleaned up");
      process.exit(0);
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
      console.error("[Shutdown] Forced shutdown");
      process.exit(1);
    }, 10000);
  } catch (error) {
    console.error("[Shutdown] Error during shutdown:", error);
    process.exit(1);
  }
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
