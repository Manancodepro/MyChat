import { create } from "zustand";

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,

  // Add a new notification
  addNotification: (notification) => {
    const id = Date.now().toString();
    const newNotification = {
      id,
      timestamp: new Date(),
      read: false,
      ...notification,
    };

    set((state) => ({
      notifications: [newNotification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));

    return id;
  },

  // Mark notification as read
  markAsRead: (notificationId) => {
    set((state) => {
      const notification = state.notifications.find(
        (n) => n.id === notificationId,
      );
      if (!notification || notification.read) return state;

      return {
        notifications: state.notifications.map((n) =>
          n.id === notificationId ? { ...n, read: true } : n,
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      };
    });
  },

  // Mark all as read
  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    }));
  },

  // Delete notification
  deleteNotification: (notificationId) => {
    set((state) => {
      const notification = state.notifications.find(
        (n) => n.id === notificationId,
      );
      return {
        notifications: state.notifications.filter(
          (n) => n.id !== notificationId,
        ),
        unreadCount:
          notification && !notification.read
            ? state.unreadCount - 1
            : state.unreadCount,
      };
    });
  },

  // Clear all notifications
  clearAllNotifications: () => {
    set({
      notifications: [],
      unreadCount: 0,
    });
  },

  // Get unread notifications
  getUnreadNotifications: () => {
    return get().notifications.filter((n) => !n.read);
  },
}));
