import { X, Smile, ArrowLeft } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { useState } from "react";

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
    <div className="px-2 sm:px-3 py-2 border-b border-base-300 bg-base-100">
      <div className="flex items-center justify-between gap-2 h-12 sm:h-14">
        {/* Left side - Back button + Avatar + User info */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          {/* Back Button Mobile */}
          {onBack && (
            <button
              onClick={onBack}
              className="md:hidden p-1 hover:bg-base-200 rounded transition flex-shrink-0"
              title="Back to chat list"
            >
              <ArrowLeft size={20} />
            </button>
          )}

          {/* Avatar */}
          <div className="avatar flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12">
            <div className="rounded-full">
              <img
                src={selectedUser.profilePic || "/avatar.png"}
                alt={selectedUser.fullName}
              />
            </div>
          </div>

          {/* User info */}
          <div className="min-w-0 flex-1">
            <h3 className="font-medium text-sm sm:text-base truncate">
              {selectedUser.fullName}
            </h3>
            <p className="text-xs sm:text-sm text-base-content/70 truncate">
              {onlineUsers.includes(String(selectedUser._id))
                ? "Online"
                : "Offline"}
            </p>
          </div>
        </div>

        {/* Right side - Action buttons */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Emoji button */}
          <div className="relative">
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-2 rounded-full hover:bg-base-200 transition"
              title="Send emoji"
            >
              <Smile size={20} />
            </button>

            {/* Emoji Picker */}
            {showEmojiPicker && (
              <div className="absolute -right-2 top-14 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl p-3 z-50 w-64 sm:w-72 max-h-64 overflow-y-auto">
                {/* Quick Emojis */}
                <div className="mb-3">
                  <p className="text-xs text-gray-400 mb-2 font-semibold">
                    Quick:
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {quickEmojis.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => handleEmojiSelect(emoji)}
                        className="text-xl p-2 rounded hover:bg-slate-700 transition hover:scale-110"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-slate-600 my-2"></div>

                {/* All Emojis */}
                <div>
                  <p className="text-xs text-gray-400 mb-2 font-semibold">
                    More:
                  </p>
                  <div className="grid grid-cols-6 gap-1">
                    {allEmojis.slice(0, 24).map((emoji, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleEmojiSelect(emoji)}
                        className="text-lg p-1 rounded hover:bg-slate-700 transition"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Close button */}
          <button
            onClick={() => setSelectedUser(null)}
            className="p-2 rounded-full hover:bg-base-200 transition"
            title="Close chat"
          >
            <X size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};
export default ChatHeader;
