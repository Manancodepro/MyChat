import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const protectRoute = async (req, res, next) => {
  try {
    // First try to get token from cookies (for backward compatibility)
    let token = req.cookies.jwt;

    // If not in cookies, try Authorization header
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.slice(7); // Remove "Bearer " prefix
      }
    }

    console.log("[protectRoute] Checking token...", {
      tokenExists: !!token,
      fromCookie: !!req.cookies.jwt,
      fromHeader: !!req.headers.authorization,
      authHeaderValue: req.headers.authorization ? req.headers.authorization.slice(0, 30) + "..." : "none",
      allHeaders: Object.keys(req.headers),
    });

    if (!token) {
      console.log("[protectRoute] ❌ No token found in cookies or headers");
      return res
        .status(401)
        .json({ message: "Not authorized, no token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded) {
      return res.status(401).json({ message: "Not authorized, invalid token" });
    }

    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    console.log("[protectRoute] ✅ User authenticated:", user.email);
    req.user = user;
    next();
  } catch (error) {
    console.log("❌ Error in protectRoute middleware", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};
