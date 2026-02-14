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

// import { create } from "zustand";
// import { axiosInstance } from "../lib/axios.js";
// import toast from "react-hot-toast";
// import { io } from "socket.io-client";

// const BASE_URL = "http://localhost:5000";
// export const useAuthStore = create((set , get) => ({
//   authUser: null,
//   isSigningUp: false,
//   isLoggingIn: false,
//   isUpadtingProfile: false,
//   isCheckingAuth: true,
//   onlineUsers: [],
//   socket: null,

//   checkAuth: async () => {
//     try {
//       const res = await axiosInstance.get("/auth/check-auth");
//       set({ authUser: res.data });
//       get().connectSocket();
//     } catch (error) {
//       console.log("Error in CheckAuth:", error);
//       set({ authUser: null });
//     } finally {
//       set({ isCheckingAuth: false });
//     }
//   },

//   signup: async (data) => {
//     set({ isSigningUp: true });
//     try {
//       const res = await axiosInstance.post("/auth/signup", data);
//       console.log("Signup response:", res.data);
//       set({ authUser: res.data });
//       toast.success("Account created successfully");
//       get().connectSocket();
//       return res.data;
//     } catch (error) {
//       console.error("Signup error full:", error);
//       console.error("Error response:", error.response);

//       let errorMessage = "Signup failed";

//       if (error.response?.data?.message) {
//         errorMessage = error.response.data.message;
//       } else if (error.message) {
//         errorMessage = error.message;
//       }

//       console.error("Final error message:", errorMessage);
//       toast.error(errorMessage);
//     } finally {
//       set({ isSigningUp: false });
//     }
//   },
//   logout: async () => {
//     try {
//       await axiosInstance.post("/auth/logout");
//       set({ authUser: null });
//       get().disconnectSocket();
//       toast.success("Logged out successfully");
//     } catch (error) {
//       toast.error(error.response.data.message);
//     }
//   },
//   login: async (data) => {
//     set({ isLoggingIn: true });

//     try {
//       const res = await axiosInstance.post("/auth/login", data);
//       set({ authUser: res.data });
//       toast.success("Logged in successfully.");
//       get().connectSocket();
//       return res.data;
//     } catch (error) {
//       let errorMessage = "Login failed";
//       if (error.response?.data?.message) {
//         errorMessage = error.response.data.message;
//       } else if (error.message) {
//         errorMessage = error.message;
//       }
//       toast.error(errorMessage);
//     } finally {
//       set({ isLoggingIn: false });
//     }
//   },
//   updateProfile: async (data) => {
//     set({ isUpdatingProfile: true });
//     try {
//       // axios automatically detects FormData and sets multipart/form-data header
//       // If FormData is sent, axios will NOT stringify it (keeping it as binary)
//       // If JSON is sent, axios will stringify and set application/json
//       const res = await axiosInstance.put("/auth/update-profile", data);
//       console.log("Update profile response:", res.data);
//       set({ authUser: res.data });
//       toast.success("Profile updated successfully.");
//       return res.data;
//     } catch (error) {
//       console.error("Profile update error:", error);
//       const errorMessage =
//         error.response?.data?.message || "Failed to update profile";
//       toast.error(errorMessage);
//     } finally {
//       set({ isUpdatingProfile: false });
//     }
//   },
//   connectSocket: () => {
//     const { authUser } = get();
//     if (!authUser || get().socket?.connected) return;
//     const socket = io(BASE_URL, {
//       query: {
//         userId: authUser._id,
//       }
//     });

//     socket.connect();

//     set({ socket: socket });
//     socket.on("GetOnlineUsers", (userId) => {
//       set({ onlineUsers: userId });
//     });
//   },
//   disconnectSocket: () => {
//     if(get().socket?.connected) get().socket.disconnect();
//   }
// }));

import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const BASE_URL =
  import.meta.env.MODE === "development" ? "http://localhost:5000" : "/";

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
      const res = await axiosInstance.get("/auth/check-auth");

      set({ authUser: res.data });
      get().connectSocket();
    } catch (error) {
      console.log("Error in checkAuth:", error);
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", data);
      set({ authUser: res.data });
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
      toast.success("Logged in successfully");

      get().connectSocket();
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      set({ authUser: null });
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
      BASE_URL,
      authUserId: authUser?._id,
    });

    // Send userId via socket auth (preferred) and query (fallback)
    const socket = io(BASE_URL, {
      auth: { userId: String(authUser._id) },
      query: { userId: String(authUser._id) },
    });

    socket.on("connect", () => {
      console.log("[socket] connected", socket.id);
    });
    socket.on("connect_error", (err) => {
      console.error("[socket] connect_error", err);
    });

    set({ socket: socket });

    socket.on("getOnlineUsers", (userIds) => {
      // Normalize IDs to strings to avoid type mismatch between ObjectId and string
      try {
        const ids = Array.isArray(userIds)
          ? userIds.map((id) => String(id))
          : [];
        console.log("[socket] getOnlineUsers", ids);
        set({ onlineUsers: ids });
      } catch (e) {
        console.log("[socket] getOnlineUsers (raw)", userIds);
        set({ onlineUsers: userIds });
      }
    });
  },
  disconnectSocket: () => {
    if (get().socket?.connected) get().socket.disconnect();
  },
}));
