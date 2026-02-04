// import User from "../models/user.model.js";
// import Message from "../models/message.model.js";
// import cloudinary from "../lib/cloudinary.js";
// import { io, getReceiverSocketId } from "../lib/socket.js";
// export const getUsersForSidebar = async (req, res) => {
//   try {
//     const loggedInUserId = req.user._id; // get logged in user id from req.user set in protectRoute middleware
//     console.log("Getting users for sidebar. Logged-in user ID:", loggedInUserId);
//     const filteredUsers = await User.find({
//       _id: { $ne: loggedInUserId }, // exclude logged in user tell this to mongoose
//     }).select("-password"); // exclude password field
//     console.log("Filtered users found:", filteredUsers.length, filteredUsers);
//     res.status(200).json(filteredUsers);
//   } catch (error) {
//     console.log("Error in getUsersForSidebar controller", error.message);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };

// export const getMessage = async (req, res) => {
//   try {
//     const { id: GetUserID } = req.params;
//     const myId = req.user._id;

//     const message = await Message.find({
//       $or: [
//         { senderId: myId, receiverId: GetUserID },
//         { senderId: GetUserID, receiverId: myId },
//       ],
//     });
//     res.status(200).json(message);
//   } catch (error) {
//     console.log("Error in getMessage controller", error.message);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };

// export const sendMessage = async (req, res) => {
//   try {
//     const { text, image } = req.body;
//     const { id: receiverId } = req.params;
//     const senderId = req.user._id;

//     let imageUrl;
//     if (image) {
//       // Assuming image is sent as a base64 string
//       const uploadResponse = await cloudinary.uploader.upload(image);
//       imageUrl = uploadResponse.secure_url;
//     }

//     const newMessage = new Message({
//       senderId,
//       receiverId,
//       text,
//       image: imageUrl,
//     });

//     await newMessage.save();
//     //realtime functionality using socket.io goes here

//     const receiverSocketId = getReceiverSocketId(receiverId);
//     if (receiverSocketId)
//     {
//       io.to(receiverSocketId).emit("newMessage", newMessage);
//     }
//     res.status(201).json(newMessage);
//   } catch (error) {
//     console.log("Error in sendMessage controller", error.message);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };

import User from "../models/user.model.js";
import Message from "../models/message.model.js";

import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    });

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    let imageUrl;
    if (image) {
      // Upload base64 image to cloudinary
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
    });

    await newMessage.save();

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};