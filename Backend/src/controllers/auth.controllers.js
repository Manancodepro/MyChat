import User from "../models/user.model.js";
import { generateToken } from "../lib/utils.js";
import bcrypt from "bcryptjs";
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

export const login = (req, res) => {
  res.send("Login route");
};

export const logout = (req, res) => {
  res.send("Logout route");
};
