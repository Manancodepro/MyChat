import jwt from "jsonwebtoken";

export const generateToken = (userId, user) => {
    
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: "7d",
    })

    res.cookie("jwt", token, {
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        httpsOnly: true,//prevent XSS attacks 
        sameSite: "strict",// csrf attacks cross site request forgery attacks
        secure: process.env.NODE_ENV !== "developement", // set secure flag to true in production
    })
    return token;
}