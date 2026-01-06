import dotenv from "dotenv"; // to access the .env file variables
dotenv.config(); // to access the .env file variables
// const express = require("express") this is common js way of importing
import express from "express"; // this is es6 module way of importing , this can be done in the
// package.json file in that the type key is set to module
import cookieParser from "cookie-parser";
import { connectDB } from "./lib/db.js";
const app = express();

app.use(cookieParser()); // to parse cookies from the incoming request
app.use(express.json()); // to parse the incoming request body as json
const PORT = process.env.PORT; // accessing port from .env file

import authRoutes from "./routes/auth.routes.js";
import messageRoutes from "./routes/message.routes.js";
app.use("/api/auth", authRoutes);
app.use("/api/message", messageRoutes);


// app.listen(5001, () => {
//     console.log("Server is running on port 5001");
// })
app.listen(PORT, () => {
  console.log("Server is running on port PORT:" + PORT);
  connectDB(); // calling the function to connect to the database
});
