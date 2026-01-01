# 💬 MyChat — Real-Time Chat Application

<p align="center">
  <img src="https://user-images.githubusercontent.com/00000000/chat-banner.png" alt="MyChat Banner" width="80%" />
</p>

<p align="center">
  🚀 A modern real-time chat application built with the <b>MERN Stack</b>, featuring secure authentication and scalable architecture.
</p>

---

## ✨ Features

✅ User Signup & Login (JWT Authentication)  
✅ Secure Password Hashing (bcrypt)  
✅ HTTP-Only Cookies for Security 🍪  
✅ MongoDB Atlas Cloud Database ☁️  
✅ Modular & Scalable Backend Architecture  
✅ RESTful APIs  
✅ Ready for Real-Time Messaging (Socket.IO)  

---

## 🧠 Tech Stack

### 🔹 Backend
- 🟢 Node.js
- ⚡ Express.js
- 🍃 MongoDB Atlas
- 🔐 JWT (JSON Web Tokens)
- 🔑 bcrypt.js

### 🔹 Frontend
- ⚛️ React (Vite)
- 🎨 CSS / Tailwind (optional)

### 🔹 Tools & DevOps
- 🧪 Postman (API testing)
- 🧠 MongoDB Compass
- 🧑‍💻 VS Code
- 🗂 Git & GitHub (SSH based auth)

---

## 🏗 Project Structure

```txt
MyChat/
│
├── Backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   └── auth.controllers.js
│   │   ├── models/
│   │   │   └── user.model.js
│   │   ├── routes/
│   │   │   └── auth.routes.js
│   │   ├── lib/
│   │   │   ├── db.js
│   │   │   └── utils.js
│   │   └── index.js
│   ├── .env
│   └── package.json
│
├── Frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
└── README.md
