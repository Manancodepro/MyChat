import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const protectRoute = async (req, res, next) => {
  try {
    const token = req.cookies.jwt; // we write here jwt because in utils.js while setting cookie we set the cookie name as jwt
    if (!token) {
      return res
        .status(401)
        .json({ message: "Not authorized, no token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded) {
      return res.status(401).json({ message: "Not authorized, invalid token" });
    }

    const user = await User.findById(decoded.userId).select("-password"); // fetching user from database excluding password field

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    req.user = user;
    next(); // calling next middleware or controller
  } catch (error) {
    console.log("Error in protectRoute middleware", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};
