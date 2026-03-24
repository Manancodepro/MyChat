// What problem does Axios solve?
// Your frontend cannot access database directly.
// So the flow is:
// React UI → API request → Backend → Database → Response → UI
// Axios is the tool that sends those HTTP requests.
// 🔹 What is Axios?
// Axios is a promise-based HTTP client for JavaScript.
// In simple words:
// Axios helps your React app talk to your backend server.
// 🔹 Why not just use fetch()?
// You can, but Axios gives extra power.

// Feature	                 fetch	 axios
// Automatic JSON parsing	❌	    ✅
// Interceptors	            ❌	    ✅
// Request cancellation	    ❌	    ✅
// Global headers	        ❌	   ✅
// Better error handling	❌	   ✅

// React components lose data when you refresh or navigate.
// Example:
// Logged-in user
// Theme
// Notifications
// Chat messages
// Passing props becomes hell:
// App → Navbar → Chat → Message → Reply → ...
// This is called prop drilling.
// 🔹 What is Zustand?
// Zustand is a global state manager.
// In simple words:
// Zustand is a shared memory store for your entire app.
// 🔹 Why Zustand over Redux?
// Feature	        Redux	Zustand
// Boilerplate	    Huge	Minimal
// Learning curve	Hard	Easy
// Performance	    OK	   Very fast
// Hooks based	    ❌	   ✅

// Zustand feels like React on steroids.

import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const SOCKET_URL =
  import.meta.env.MODE === "development"
    ? "http://localhost:8001"
    : import.meta.env.VITE_BACKEND_URL
      ? import.meta.env.VITE_BACKEND_URL.replace("/api", "")
      : `${window.location.protocol}//${window.location.hostname}.onrender.com`;

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  onlineUsers: [],
  socket: null,

  checkAuth: async () => {
    try {
      // First check if token exists in localStorage
      const token = localStorage.getItem("authToken");
      if (!token) {
        console.log(
          "[checkAuth] No token in localStorage, skipping auth check",
        );
        set({ isCheckingAuth: false });
        return;
      }

      const res = await axiosInstance.get("/auth/check-auth");
      set({ authUser: res.data });
      get().connectSocket();
    } catch (error) {
      console.log("Error in checkAuth:", error);
      set({ authUser: null });
      localStorage.removeItem("authToken"); // ✅ Remove invalid token
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", data);
      set({ authUser: res.data });
      if (res.data.token) {
        localStorage.setItem("authToken", res.data.token); // ✅ Store token in localStorage
      }
      toast.success("Account created successfully");
      get().connectSocket();
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      set({ authUser: res.data });
      if (res.data.token) {
        localStorage.setItem("authToken", res.data.token);
        console.log(
          "[auth] ✅ Token stored in localStorage:",
          res.data.token.slice(0, 20) + "...",
        );
      } else {
        console.log("[auth] ⚠️ No token in login response:", res.data);
      }
      toast.success("Logged in successfully");
      get().connectSocket();
    } catch (error) {
      console.log("[auth] ❌ Login error:", error);
      toast.error(error.response.data.message);
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      set({ authUser: null });
      localStorage.removeItem("authToken"); // ✅ Remove token from localStorage
      toast.success("Logged out successfully");
      get().disconnectSocket();
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await axiosInstance.put("/auth/update-profile", data);
      set({ authUser: res.data });
      toast.success("Profile updated successfully");
    } catch (error) {
      console.log("error in update profile:", error);
      toast.error(error.response.data.message);
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  connectSocket: () => {
    const { authUser } = get();
    if (!authUser || get().socket?.connected) return;

    console.log("[useAuthStore] connectSocket ->", {
      SOCKET_URL,
      authUserId: authUser?._id,
    });

    // Send userId via socket auth (preferred) and query (fallback)
    const socket = io(SOCKET_URL, {
      auth: { userId: String(authUser._id) },
      query: { userId: String(authUser._id) },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socket.on("connect", () => {
      console.log("[socket] connected ✅", socket.id);
    });

    socket.on("connect_error", (err) => {
      console.error("[socket] connect_error ❌", err);
    });

    socket.on("disconnect", () => {
      console.log("[socket] disconnected");
    });

    set({ socket: socket });

    socket.on("getOnlineUsers", (userIds) => {
      // Normalize IDs to strings to avoid type mismatch between ObjectId and string
      try {
        const ids = Array.isArray(userIds)
          ? userIds.map((id) => String(id))
          : [];
        console.log("[socket] getOnlineUsers 🟢", ids);
        set({ onlineUsers: ids });
      } catch (e) {
        console.log("[socket] getOnlineUsers (raw) 🔴", userIds);
        set({ onlineUsers: userIds });
      }
    });
  },
  disconnectSocket: () => {
    if (get().socket?.connected) get().socket.disconnect();
  },
}));
