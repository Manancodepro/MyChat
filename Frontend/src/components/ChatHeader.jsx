import { X, Smile, Bell, ArrowLeft } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { useState } from "react";
import NotificationBell from "./NotificationBell";

const ChatHeader = ({ onBack }) => {
  const { selectedUser, setSelectedUser, sendMessage } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Quick access emojis
  const quickEmojis = ["👍", "❤️", "😂", "😮", "😢", "🔥"];

  // All emojis (limited for performance)
  const allEmojis = [
    "😀",
    "😃",
    "😄",
    "😁",
    "😆",
    "😅",
    "🤣",
    "😂",
    "🙂",
    "🙃",
    "😉",
    "😊",
    "😇",
    "🥰",
    "😍",
    "🤩",
    "😘",
    "😗",
    "😚",
    "😙",
    "🥲",
    "😋",
    "😛",
    "😜",
    "🤪",
    "😌",
    "😔",
    "😑",
    "😐",
    "😶",
    "😏",
    "😒",
    "🙄",
    "😬",
    "🤐",
    "😌",
    "😔",
    "😪",
    "🤤",
    "😴",
    "😷",
    "🤒",
    "🤕",
    "🤮",
    "🤢",
    "🤮",
    "🤮",
    "🤮",
    "👋",
    "👏",
    "🙏",
    "💪",
    "👍",
    "👎",
    "❤️",
    "🧡",
    "💛",
    "💚",
    "💙",
    "💜",
    "🔥",
    "✨",
    "⭐",
    "🌟",
    "💫",
    "🎉",
    "🎊",
    "🎈",
    "🎁",
    "🎀",
    "😂",
    "😂",
    "😂",
    "😂",
    "😂",
    "😂",
    "😂",
    "😂",
    "😂",
    "😂",
  ];

  const handleEmojiSelect = (emoji) => {
    try {
      sendMessage({ text: emoji });
      setShowEmojiPicker(false);
    } catch (error) {
      console.error("Failed to send emoji:", error);
    }
  };

  return (
    <div className="p-2 sm:p-2.5 border-b border-base-300">
      <div className="flex items-center justify-between gap-2 sm:gap-3">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Back Button Mobile */}
          {onBack && (
            <button
              onClick={onBack}
              className="md:hidden p-1 hover:bg-base-200 rounded transition"
              title="Back to chat list"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          
          {/* Avatar */}
          <div className="avatar flex-shrink-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full relative">
              <img
                src={selectedUser.profilePic || "/avatar.png"}
                alt={selectedUser.fullName}
              />
            </div>
          </div>

          {/* User info - hidden on very small screens */}
          <div className="min-w-0">
            <h3 className="font-medium text-sm sm:text-base truncate">{selectedUser.fullName}</h3>
            <p className="text-xs sm:text-sm text-base-content/70">
              {onlineUsers.includes(String(selectedUser._id))
                ? "Online"
                : "Offline"}
            </p>
          </div>
        </div>

        {/* Notification Bell - New */}
        <div className="hidden sm:flex">
          <NotificationBell />
        </div>

        {/* Emoji & Close buttons */}
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <div className="relative">
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-1.5 sm:p-2 rounded-full hover:bg-base-200 transition"
              title="Send emoji"
            >
              <Smile size={18} className="sm:w-5 sm:h-5" />
            </button>

            {/* Emoji Picker - positioned to the left, fits on screen */}
            {showEmojiPicker && (
              <div className="absolute -right-2 top-12 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl p-2 sm:p-3 z-50 w-64 sm:w-72 max-h-64 sm:max-h-72 overflow-y-auto">
                {/* Quick Emojis - Horizontal */}
                <div className="mb-2 sm:mb-3">
                  <p className="text-xs text-gray-400 mb-2 font-semibold">
                    Quick:
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {quickEmojis.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => handleEmojiSelect(emoji)}
                        className="text-lg sm:text-2xl p-1.5 sm:p-2 rounded hover:bg-slate-700 transition hover:scale-110 transform"
                        title={emoji}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-slate-600 my-2"></div>

                {/* All Emojis - Grid Layout */}
                <div>
                  <p className="text-xs text-gray-400 mb-2 font-semibold">
                    More:
                  </p>
                  <div className="grid grid-cols-5 sm:grid-cols-6 gap-1">
                    {allEmojis.slice(0, 24).map((emoji, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleEmojiSelect(emoji)}
                        className="text-lg sm:text-xl p-1 rounded hover:bg-slate-700 transition hover:scale-125 transform"
                        title={emoji}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setSelectedUser(null)}
            className="p-1.5 sm:p-2 rounded-full hover:bg-base-200 transition"
            title="Close chat"
          >
            <X size={18} className="sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
export default ChatHeader;
