import express from "express";
import { login, logout, signup } from "../controllers/auth.controllers.js"; // putting .js is mandatory in es6 module

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

export default router;