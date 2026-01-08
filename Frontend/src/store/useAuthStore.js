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
import { User } from "lucide-react";
export const useAuthStore = create((set) => ({
  authUser: null,
  isSingingUp: false,
  isLoggingIn: false,
  isUpadtingProfile: false,
  isCheckingAuth: true,

  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/check");
      set({ authUser: res.data });
    } catch (error) {
      console.log("Error in CheckAuth:", error);
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data) => {
    set({ isSingingUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", data);
      set({ authUser: res.data });
      toast.success("Account created successfully");
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isSingingUp: false });
    }
  },
}));
