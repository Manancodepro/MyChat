// import dotenv from "dotenv"; // to access the .env file variables
// dotenv.config(); // to access the .env file variables
// // const express = require("express") this is common js way of importing
// import express from "express"; // this is es6 module way of importing , this can be done in the
// // package.json file in that the type key is set to module
// import { connectDB } from "./lib/db.js";
// import cookieParser from "cookie-parser";
// import cors from "cors"; // to prevent cors error which occurs when frontend and backend are on different ports
// import { app , server } from "./lib/socket.js";

// app.use(express.json({ limit: "10mb" })); // to parse the incoming request body as json (compressed base64 images)
// app.use(express.urlencoded({ limit: "10mb", extended: true })); // to parse URL encoded data
// app.use(cookieParser()); // to parse cookies from the incoming request
// app.use(
//   cors({
//     origin: ["http://localhost:5173", "http://localhost:5174"], // frontend url - localhost only
//     credentials: true, // to allow cookies to be sent
//   }),
// );
// const PORT = process.env.PORT || 5000; // accessing port from .env file

// import authRoutes from "./routes/auth.routes.js";
// import messageRoutes from "./routes/message.routes.js";
// app.use("/api/auth", authRoutes);
// app.use("/api/messages", messageRoutes);

// // Connect to database first, then start server
// connectDB()
//   .then(() => {
//     server.listen(PORT, "127.0.0.1", () => {
//       console.log("Server is running on port: " + PORT);
//       console.log("Access via: http://localhost:" + PORT);
//     });
//   })
//   .catch((error) => {
//     console.error("Failed to connect to database, server not starting");
//     process.exit(1);
//   });

import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";

import path from "path";

import { connectDB } from "./lib/db.js";

import authRoutes from "./routes/auth.routes.js";
import messageRoutes from "./routes/message.routes.js";
import { app, server } from "./lib/socket.js";

dotenv.config();

const PORT = process.env.PORT;
const __dirname = path.resolve();

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
  });
}

server.listen(PORT, () => {
  console.log("server is running on PORT:" + PORT);
  connectDB();
});
w