import Navbar from "./components/Navbar";

import HomePage from "./pages/HomePage";
import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";

import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/useAuthStore";
import { useThemeStore } from "./store/useThemeStore";
import { useNotificationStore } from "./store/useNotificationStore";
import { useEffect } from "react";

import { Loader } from "lucide-react";
import { Toaster } from "react-hot-toast";
import { io } from "socket.io-client";

const App = () => {
  const { authUser, checkAuth, isCheckingAuth, onlineUsers, socket } =
    useAuthStore();
  const { theme } = useThemeStore();
  const { addNotification } = useNotificationStore();

  console.log({ onlineUsers });

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Socket.IO notification listeners
  useEffect(() => {
    if (!socket || !authUser) return;

    // Listen for new messages
    socket.on("newMessage", (message) => {
      addNotification({
        type: "message",
        title: `New message from ${message.senderName || "Someone"}`,
        message: message.text || "Sent a file",
      });
    });

    // Listen for typing indicators
    socket.on("userTyping", (data) => {
      addNotification({
        type: "typing",
        title: `${data.userName} is typing`,
        message: "...",
      });
    });

    // Listen for user online status
    socket.on("userOnline", (data) => {
      addNotification({
        type: "online",
        title: `${data.userName} came online`,
        message: "Now available",
      });
    });

    return () => {
      socket.off("newMessage");
      socket.off("userTyping");
      socket.off("userOnline");
    };
  }, [socket, authUser, addNotification]);

  console.log({ authUser });

  if (isCheckingAuth && !authUser)
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="size-10 animate-spin" />
      </div>
    );

  return (
    <div data-theme={theme}>
      <Navbar />

      <Routes>
        <Route
          path="/"
          element={authUser ? <HomePage /> : <Navigate to="/login" />}
        />
        <Route
          path="/signup"
          element={!authUser ? <SignUpPage /> : <Navigate to="/" />}
        />
        <Route
          path="/login"
          element={!authUser ? <LoginPage /> : <Navigate to="/" />}
        />
        <Route path="/settings" element={<SettingsPage />} />
        <Route
          path="/profile"
          element={authUser ? <ProfilePage /> : <Navigate to="/login" />}
        />
      </Routes>

      <Toaster />
    </div>
  );
};
export default App;
