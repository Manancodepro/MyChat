import dotenv from "dotenv"; // to access the .env file variables
dotenv.config(); // to access the .env file variables
// const express = require("express") this is common js way of importing
import express from "express"; // this is es6 module way of importing , this can be done in the
// package.json file in that the type key is set to module
import { connectDB } from "./lib/db.js";
import cookieParser from "cookie-parser";
import cors from "cors"; // to prevent cors error which occurs when frontend and backend are on different ports
const app = express();

app.use(express.json()); // to parse the incoming request body as json
app.use(cookieParser()); // to parse cookies from the incoming request
app.use(
  cors({
    origin: ["http://localhost:5173"], // frontend url - localhost only
    credentials: true, // to allow cookies to be sent
  }),
);
const PORT = process.env.PORT || 5000; // accessing port from .env file

import authRoutes from "./routes/auth.routes.js";
import messageRoutes from "./routes/message.routes.js";
app.use("/api/auth", authRoutes);
app.use("/api/message", messageRoutes);

// Connect to database first, then start server
connectDB()
  .then(() => {
    app.listen(PORT, "127.0.0.1", () => {
      console.log("Server is running on port: " + PORT);
      console.log("Access via: http://localhost:" + PORT);
    });
  })
  .catch((error) => {
    console.error("Failed to connect to database, server not starting");
    process.exit(1);
  });
