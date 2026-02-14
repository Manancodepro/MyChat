// import { Server } from "socket.io";
// import http, { get } from "http";
// import express from "express";

// const app = express();
// const server = http.createServer(app);

// const io = new Server(server, {
//   cors: {
//     origin: ["http://localhost:5173"],
//   },
// });

// export function getReceiverSocketId(userId) {
//   return userSocketMap[userId];
// }
// //used to store online users
// const userSocketMap = {}; // user id as key and socket id as value
// io.on("connection", (socket) => {
//   console.log("A user connected", socket.id);
//   const userId = socket.handshake.query.userId;
//   if (userId) {
//     userSocketMap[userId] = socket.id;
//   }

//   io.emit("GetOnlineUsers", Object.keys(userSocketMap)); // it tells whether the user is online or not

//   socket.on("disconnect", () => {
//     console.log("User disconnected", socket.id);
//     delete userSocketMap[userId];
//     io.emit("GetOnlineUsers", Object.keys(userSocketMap));
//   });
// });

// export { io, server, app };

import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";
const io = new Server(server, {
  cors: {
    origin: CLIENT_ORIGIN,
    credentials: true,
  },
});

// ✅ Map is REQUIRED (object causes silent bugs)
const userSocketMap = new Map(); // userId → socketId

export function getReceiverSocketId(userId) {
  if (!userId) return undefined;
  return userSocketMap.get(String(userId));
}

io.on("connection", (socket) => {
  console.log("✅ User connected:", socket.id);

  // support both query (older clients) and auth (recommended)
  const qUserId = socket.handshake?.query?.userId;
  const aUserId = socket.handshake?.auth?.userId;
  const userId = qUserId || aUserId;

  console.log("[socket] handshake.query:", qUserId, "handshake.auth:", aUserId);

  if (userId) {
    userSocketMap.set(String(userId), socket.id);
  }

  io.emit("getOnlineUsers", Array.from(userSocketMap.keys()));

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);

    for (const [uid, sid] of userSocketMap.entries()) {
      if (sid === socket.id) {
        userSocketMap.delete(uid);
        break;
      }
    }

    io.emit("getOnlineUsers", Array.from(userSocketMap.keys()));
  });
});

export { io, app, server };
