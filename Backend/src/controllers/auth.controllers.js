import User from "../models/user.model.js";
import { generateToken } from "../lib/utils.js";
import bcrypt from "bcryptjs";
import cloudinary from "../lib/cloudinary.js";
export const signup = async (req, res) => {
  // res.send("Signup route");
  try {
    const { fullName, email, password } = req.body;
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters long" });
    }

    const user = await User.findOne({ email }); // checking if user with the email already exists
    if (user) return res.status(400).json({ message: "Email already exists" }); // if user exists return 400 bad request

    //hash the password before saving to the database

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      // creating a new user instance
      fullName,
      email,
      password: hashedPassword,
    });

    if (newUser) {
      //generate jwt token here and send it to the user
      generateToken(newUser._id, res);
      await newUser.save();

      res.status(201).json({
        _id: newUser._id,
        fullName: newUser.fullName, // sending only necessary user details in response
        email: newUser.email,
        profilePic: newUser.profilePic,
      }); // 201 created because new resource is created
    } else {
      res.status(400).json({ message: "Ivalid user data" });
    }
  } catch (error) {
    console.log("Error in singup controller", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const login = async (req, res) => {
  // res.send("Login route");
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    generateToken(user._id, res);

    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
    });
  } catch (error) {
    console.log("Error in Login controller", error.message);
    res.status(500).json({ message: " Internal Server Error" });
  }
};

export const logout = (req, res) => {
  // res.send("Logout route");
  try {
    res.cookie("jwt", "", { maxAge: 0 });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.log("Error in Logout controller", error.message);
    res.status(500).json({ message: " Internal Server Error" });
  }
};

export const updateProfile = async (req, res) => {
  //updates user profile picture
  try {
    const { profilePic } = req.body; // getting profilePic from request body
    const userId = req.user._id; // getting userId from req.user which is set in protectRoute middleware

    if (!profilePic) {
      res.status(400).json({ message: "Profile picture is required" });
    }
    const uploadProfilePic = await cloudinary.uploader.upload(profilePic); // uploading profilePic to cloudinary
    const updatedUser = await User.findByIdAndUpdate(userId, {
      profilePic: uploadProfilePic.secure_url,
    }); // updating user profilePic in database

    res.status(200).json(updatedUser);
  } catch (error) {
    console.log("Error in updateProfile controller", error.message);``
    res.status(500).json({ message: " Internal Server Error" });
  }
};

export const checkAuth = (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (error) {
    console.log("Error in checkAuth controller", error.message);
    res.status(500).json({ message: " Internal Server Error" });
  }
};
