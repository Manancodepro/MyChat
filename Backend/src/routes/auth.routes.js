import express from "express";
import { login, logout, signup , updateProfile, checkAuth } from "../controllers/auth.controllers.js"; // putting .js is mandatory in es6 module
import { protectRoute } from "../middleware/auth.middleware.js";
const router = express.Router();
// router.post("/signup", (req, res) => {
//     res.send("signup route");
// });
router.post("/signup", signup); // calling function from controller function signup

// router.post("/login", (req, res) => {
//     res.send("Login route");
// });

router.post("/login", login); // calling function from controller function login

// router.post("/logout", (req, res) => {
//     res.send("Logout route");
// }); this is manaual way of creating route

router.post("/logout", logout); // calling function from controller function logout, to logout user

router.put("/update-profile", protectRoute, updateProfile); // calling function from controller function updateProfile

router.get("/check-auth", protectRoute,checkAuth); // route to check if user is authenticated or not
export default router;
