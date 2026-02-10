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

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true,
  },
});

// ✅ Map is REQUIRED (object causes silent bugs)
const userSocketMap = new Map(); // userId → socketId

export function getReceiverSocketId(userId) {
  return userSocketMap.get(userId);
}

io.on("connection", (socket) => {
  console.log("✅ User connected:", socket.id);

  const userId = socket.handshake.query.userId;

  if (userId) {
    userSocketMap.set(userId, socket.id);
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
