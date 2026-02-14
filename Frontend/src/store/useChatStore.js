// import { create } from "zustand";
// import toast from "react-hot-toast";
// import { axiosInstance } from "../lib/axios";
// import { useAuthStore } from "./useAuthStore";

// export const useChatStore = create((set, get) => ({
//   messages: [],
//   users: [],
//   selectedUser: null,
//   isUsersLoading: false,
//   isMessagesLoading: false,

//   getUsers: async () => {
//     set({ isUsersLoading: true });
//     try {
//       const res = await axiosInstance.get("/messages/users");
//       set({ users: res.data });
//     } catch (error) {
//       toast.error(error.response.data.message);
//     } finally {
//       set({ isUsersLoading: false });
//     }
//   },

//   getMessages: async (userId) => {
//     set({ isMessagesLoading: true });
//     try {
//       const res = await axiosInstance.get(`/messages/${userId}`);
//       set({ messages: res.data });
//     } catch (error) {
//       toast.error(error.response.data.message);
//     } finally {
//       set({ isMessagesLoading: false });
//     }
//   },
//   sendMessage: async (messageData) => {
//     const { selectedUser, messages } = get();
//     try {
//       const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
//       set({ messages: [...messages, res.data] });
//     } catch (error) {
//       toast.error(error.response.data.message);
//     }
//   },

//   subscribeToMessages: () => { // function to listen new messages from socket
//     const { selectedUser } = get();
//     if (!selectedUser) return;

//     const socket = useAuthStore.getState().socket;

//     socket.on("newMessage", (newMessage) => {
//       const isMessageSentFromSelectedUser = newMessage.senderId === selectedUser._id;
//       if (!isMessageSentFromSelectedUser) return;

//       set({
//         messages: [...get().messages, newMessage],
//       });
//     });
//   },

//   unsubscribeFromMessages: () => { // function to stop listening new messages from socket
//     const socket = useAuthStore.getState().socket;
//     socket.off("newMessage");
//   },

//   setSelectedUser: (selectedUser) => set({ selectedUser }),
// }));

import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isMessagesLoading: false });
    }
  },
  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    try {
      const res = await axiosInstance.post(
        `/messages/send/${selectedUser._id}`,
        messageData,
      );
      set({ messages: [...messages, res.data] });
    } catch (error) {
      // toast.error(error.response.data.message);
      toast.error(error?.response?.data?.message || "Failed to send message");
    }
  },

  // subscribeToMessages: () => {
  //   const { selectedUser } = get();
  //   if (!selectedUser) return;

  //   const socket = useAuthStore.getState().socket;

  //   socket.on("newMessage", (newMessage) => {
  //     const isMessageSentFromSelectedUser = newMessage.senderId === selectedUser._id;
  //     if (!isMessageSentFromSelectedUser) return;

  //     set({
  //       messages: [...get().messages, newMessage],
  //     });
  //   });
  // },
  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.off("newMessage"); // ✅ VERY IMPORTANT

    socket.on("newMessage", (newMessage) => {
      const getIdString = (id) => {
        if (id === null || id === undefined) return "";
        if (typeof id === "string") return id;
        if (typeof id === "object") {
          if (id._id) return String(id._id);
          if (typeof id.toString === "function") return id.toString();
        }
        return String(id);
      };

      const senderId = getIdString(newMessage.senderId);
      const receiverId = getIdString(newMessage.receiverId);
      const selId = getIdString(selectedUser._id);

      if (senderId !== selId && receiverId !== selId) return;

      set((state) => ({
        messages: [...state.messages, newMessage],
      }));
    });
  },
  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
  },
  setSelectedUser: (selectedUser) => set({ selectedUser }),
}));
