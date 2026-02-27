import { Bell, Trash2, Check, X } from "lucide-react";
import { useNotificationStore } from "../store/useNotificationStore";
import { useState, useRef, useEffect } from "react";

const NotificationBell = () => {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
  } = useNotificationStore();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const diff = now - new Date(timestamp);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-base-200 rounded-lg transition-colors"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 bg-base-100 rounded-lg shadow-xl border border-base-300 z-50 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-base-200 px-4 py-3 flex justify-between items-center border-b border-base-300">
            <h3 className="font-semibold text-sm">Notifications</h3>
            {notifications.length > 0 && (
              <div className="flex gap-2">
                <button
                  onClick={markAllAsRead}
                  className="text-xs px-2 py-1 hover:bg-base-300 rounded transition"
                  title="Mark all as read"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={clearAllNotifications}
                  className="text-xs px-2 py-1 hover:bg-error hover:text-error-content rounded transition"
                  title="Clear all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-base-content/50 text-sm">
                No notifications yet
              </div>
            ) : (
              <div className="divide-y divide-base-300">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 hover:bg-base-200 transition cursor-pointer ${
                      !notification.read ? "bg-base-200" : ""
                    }`}
                    onClick={() => {
                      if (!notification.read) {
                        markAsRead(notification.id);
                      }
                    }}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          notification.type === "message"
                            ? "bg-blue-500/20 text-blue-500"
                            : notification.type === "typing"
                            ? "bg-purple-500/20 text-purple-500"
                            : "bg-green-500/20 text-green-500"
                        }`}
                      >
                        <span>
                          {notification.type === "typing"
                            ? "✍"
                            : notification.type === "online"
                            ? "●"
                            : "💬"}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate text-base-content">
                          {notification.title}
                        </p>
                        <p className="text-xs text-base-content/60 line-clamp-2 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-base-content/40 mt-2">
                          {formatTimeAgo(notification.timestamp)}
                        </p>
                      </div>

                      {/* Delete Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                        className="hover:bg-base-300 p-1 rounded transition flex-shrink-0"
                        title="Delete notification"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
