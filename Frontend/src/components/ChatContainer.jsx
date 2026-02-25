import { useChatStore } from "../store/useChatStore.js";
import { useEffect, useRef, useState } from "react";
import ChatHeader from "./ChatHeader.jsx";
import MessageInput from "./MessageInput.jsx";
import MessageSkeleton from "./Skeletons/MessageSkeleton.jsx";
import { useAuthStore } from "../store/useAuthStore.js";
import { formatMessageTime } from "../lib/utils.js";
import { Clock, Trash2, MoreVertical, Play, Download } from "lucide-react";
import { toast } from "react-hot-toast";
import {
  addReaction as apiAddReaction,
  removeReaction as apiRemoveReaction,
  editMessage as apiEditMessage,
  deleteForMe as apiDeleteForMe,
  deleteForEveryone as apiDeleteForEveryone,
  canEditOrDelete,
} from "../lib/messageApi.js";
import {
  ReactionPicker,
  MessageReactions,
  EditedIndicator,
} from "./MessageComponents.jsx";

// Helper: Format file size safely
const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

// Audio Player Component
const AudioPlayer = ({ src, fileName }) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const formatTime = (time) => {
    if (!time || !isFinite(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="mt-2 bg-gradient-to-r from-slate-700 to-slate-800 rounded-2xl p-4 w-72 max-w-sm shadow-lg border border-slate-600">
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
      />
      <div className="flex items-center gap-3">
        <button
          onClick={togglePlay}
          className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-full transition flex-shrink-0 shadow-md hover:shadow-lg transform hover:scale-105"
        >
          <span className="text-white">{isPlaying ? "⏸" : "▶"}</span>
        </button>
        <div className="flex-1 min-w-0">
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-2 bg-slate-600 rounded-full cursor-pointer appearance-none"
            style={{
              background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(currentTime / duration) * 100}%, #475569 ${(currentTime / duration) * 100}%, #475569 100%)`,
            }}
          />
          <div className="flex justify-between text-xs text-gray-300 mt-2">
            <span className="font-medium">{formatTime(currentTime)}</span>
            <span className="font-medium">{formatTime(duration)}</span>
          </div>
        </div>
      </div>
      <p className="text-xs text-gray-300 mt-3 truncate text-center font-medium">
        {fileName}
      </p>
    </div>
  );
};

// Video Player Component
const VideoPlayer = ({ src, fileName }) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const formatTime = (time) => {
    if (!time || !isFinite(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="mt-2 max-w-sm rounded-2xl overflow-hidden shadow-lg border border-slate-600">
      <div className="bg-black relative group">
        <video
          ref={videoRef}
          src={src}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
          className="w-full h-auto max-h-96 object-cover"
        />
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center">
          <button
            onClick={togglePlay}
            className="p-4 bg-blue-600 hover:bg-blue-700 rounded-full transition opacity-0 group-hover:opacity-100 shadow-lg transform hover:scale-110"
          >
            <span className="text-white text-xl">{isPlaying ? "⏸" : "▶"}</span>
          </button>
        </div>
      </div>
      <div className="bg-gradient-to-r from-slate-700 to-slate-800 p-3">
        <div className="flex items-center gap-3">
          <button
            onClick={togglePlay}
            className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-full transition flex-shrink-0"
          >
            <span className="text-white text-sm">{isPlaying ? "⏸" : "▶"}</span>
          </button>
          <div className="flex-1 min-w-0">
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-2 bg-slate-600 rounded-full cursor-pointer appearance-none"
              style={{
                background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(currentTime / duration) * 100}%, #475569 ${(currentTime / duration) * 100}%, #475569 100%)`,
              }}
            />
            <div className="flex justify-between text-xs text-gray-300 mt-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-300 mt-2 truncate text-center font-medium">
          {fileName}
        </p>
      </div>
    </div>
  );
};

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    refreshMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
    cancelScheduledMessage,
  } = useChatStore();

  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [selectedMessageForMenu, setSelectedMessageForMenu] = useState(null);
  const [hoveredMessageId, setHoveredMessageId] = useState(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editText, setEditText] = useState("");
  const [showReactionPicker, setShowReactionPicker] = useState(false);

  // Load & subscribe
  useEffect(() => {
    if (!selectedUser?._id) return;

    getMessages(selectedUser._id);
    subscribeToMessages();

    // Polling fallback: refetch messages every 3 seconds to catch missed scheduled deliveries
    const pollInterval = setInterval(() => {
      refreshMessages(selectedUser._id);
    }, 3000);

    return () => {
      clearInterval(pollInterval);
      unsubscribeFromMessages();
    };
  }, [
    selectedUser?._id,
    getMessages,
    refreshMessages,
    subscribeToMessages,
    unsubscribeFromMessages,
  ]);

  // Auto scroll only on new messages, not on message updates
  useEffect(() => {
    // Only scroll if we have messages and this is the latest message
    if (messages.length > 0 && messageEndRef.current) {
      // Delay scroll slightly to ensure DOM is updated
      const scrollTimeout = setTimeout(() => {
        messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 50);
      return () => clearTimeout(scrollTimeout);
    }
  }, [messages.length]); // Only depend on length, not entire array

  const handleOpenContextMenu = (message, x = 0, y = 0) => {
    const isMine = message.senderId === authUser._id;

    if (message.status === "scheduled") {
      setContextMenu({ x, y, type: "scheduled" });
    } else {
      setContextMenu({ x, y, type: "message", isSender: isMine });
    }
    setSelectedMessageForMenu(message);
    setShowReactionPicker(false);
  };

  const handleRightClick = (e, message) => {
    e.preventDefault();
    handleOpenContextMenu(message, e.clientX, e.clientY);
  };

  const handleAddReaction = async (messageId, emoji) => {
    try {
      await apiAddReaction(messageId, emoji);
    } catch {
      toast.error("Failed to add reaction");
    }
  };

  const handleRemoveReaction = async (messageId) => {
    try {
      await apiRemoveReaction(messageId);
    } catch {
      toast.error("Failed to remove reaction");
    }
  };

  const handleEditMessage = async () => {
    if (!editText.trim()) {
      toast.error("Message cannot be empty");
      return;
    }
    try {
      await apiEditMessage(selectedMessageForMenu._id, editText);
      setEditingMessageId(null);
      setEditText("");
      setContextMenu(null);
      setSelectedMessageForMenu(null);
      toast.success("Message edited");
    } catch (error) {
      toast.error(error?.error || "Failed to edit message");
    }
  };

  const handleDeleteForMe = async () => {
    try {
      await apiDeleteForMe(selectedMessageForMenu._id);
      setContextMenu(null);
      setSelectedMessageForMenu(null);
      toast.success("Message deleted for you");
    } catch (error) {
      toast.error(error?.error || "Failed to delete message");
    }
  };

  const handleDeleteForEveryone = async () => {
    try {
      if (
        !confirm("Delete this message for everyone? This cannot be undone.")
      ) {
        return;
      }
      await apiDeleteForEveryone(selectedMessageForMenu._id);
      setContextMenu(null);
      setSelectedMessageForMenu(null);
      toast.success("Message deleted for everyone");
    } catch (error) {
      toast.error(error?.error || "Failed to delete message");
    }
  };

  const handleCancelSchedule = async () => {
    if (selectedMessageForMenu) {
      await cancelScheduledMessage(selectedMessageForMenu._id);
      setContextMenu(null);
      setSelectedMessageForMenu(null);
    }
  };

  // Close context menu on click outside
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  if (!selectedUser) {
    return (
      <div className="flex-1 flex items-center justify-center">
        Select a chat
      </div>
    );
  }

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <ChatHeader />

      <div className="flex-1 overflow-y-auto p-4 space-y-4 relative">
        {messages.map((message, index) => {
          const normalizeId = (id) => {
            if (id === null || id === undefined) return "";
            if (typeof id === "string") return id;
            if (typeof id === "object") {
              if (id._id) return String(id._id);
              if (typeof id.toString === "function") return id.toString();
            }
            return String(id);
          };

          const msgSenderId = normalizeId(message.senderId);
          const isMine = msgSenderId === String(authUser._id);
          const isScheduled = message.status === "scheduled";
          const isCancelled = message.status === "cancelled";
          const isDeletedForMe =
            message.deletedFor && message.deletedFor.includes(authUser._id);
          const isDeletedForEveryone = message.deletedForEveryone;

          // Skip rendering if deleted for me but not deleted for everyone (unless I'm the sender)
          if (isDeletedForMe && !isDeletedForEveryone) return null;

          return (
            <div
              key={message._id}
              className={`chat ${isMine ? "chat-end" : "chat-start"} group`}
              ref={index === messages.length - 1 ? messageEndRef : null}
              onContextMenu={(e) => handleRightClick(e, message)}
              onMouseEnter={() => setHoveredMessageId(message._id)}
              onMouseLeave={() => setHoveredMessageId(null)}
            >
              <div className="chat-image avatar">
                <div className="size-10 rounded-full border">
                  <img
                    src={
                      isMine
                        ? authUser.profilePic || "/avatar.png"
                        : selectedUser.profilePic || "/avatar.png"
                    }
                    alt="profile"
                    onError={(e) => {
                      try {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "/avatar.png";
                      } catch (err) {
                        console.error(err);
                      }
                    }}
                  />
                </div>
              </div>

              <div className="chat-header mb-1">
                <time className="text-xs opacity-50 ml-1">
                  {message.status === "scheduled"
                    ? `Scheduled: ${formatMessageTime(message.scheduledTime)}`
                    : message.status === "sent" && message.deliveredAt
                      ? `Sent: ${formatMessageTime(message.deliveredAt)}`
                      : formatMessageTime(message.createdAt)}
                </time>
              </div>

              <div className="relative group overflow-visible">
                <div
                  className={`chat-bubble flex flex-col transition-all overflow-visible ${
                    isScheduled
                      ? "opacity-60 bg-orange-900/30 border border-orange-500/50"
                      : isCancelled
                        ? "opacity-40 line-through"
                        : ""
                  }`}
                >
                  {isScheduled && (
                    <div className="flex items-center gap-1 mb-2 text-orange-300 text-xs">
                      <Clock size={14} />
                      <span>
                        Scheduled for{" "}
                        {new Date(message.scheduledTime).toLocaleString()}
                      </span>
                    </div>
                  )}

                  {isCancelled && (
                    <div className="text-xs text-gray-400 mb-2">Cancelled</div>
                  )}

                  {isDeletedForEveryone ? (
                    <p className="text-gray-400 italic">
                      This message was deleted
                    </p>
                  ) : editingMessageId === message._id ? (
                    <div className="flex gap-2 mt-2">
                      <input
                        type="text"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="flex-1 px-2 py-1 bg-slate-700 rounded text-sm"
                        placeholder="Edit message..."
                        autoFocus
                      />
                      <button
                        onClick={handleEditMessage}
                        className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-xs"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingMessageId(null)}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      {message.text && (
                        <p className="break-words text-sm md:text-base leading-snug max-w-xs sm:max-w-sm overflow-hidden">
                          {message.text}
                        </p>
                      )}

                      {message.file && (
                        <>
                          {message.file.type === "image" && (
                            <div className="mt-2 max-w-sm">
                              <a
                                href={message.file.url}
                                download={message.file.name}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block relative group"
                              >
                                <div className="relative overflow-hidden rounded-2xl shadow-lg">
                                  <img
                                    src={message.file.url}
                                    alt={message.file.name}
                                    className="w-full h-auto max-h-96 object-cover rounded-2xl transition-transform duration-300 group-hover:scale-105"
                                    onError={(e) => {
                                      try {
                                        console.error("Image load error:", e);
                                        e.currentTarget.onerror = null;
                                        e.currentTarget.src = "/avatar.png";
                                      } catch (err) {
                                        console.error(err);
                                      }
                                    }}
                                  />
                                  {/* Overlay on hover */}
                                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-2xl transition-all duration-300 flex items-center justify-center">
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                      <Download className="w-8 h-8 text-white drop-shadow-lg" />
                                    </div>
                                  </div>
                                </div>
                              </a>
                              <p className="text-xs text-gray-400 mt-2 truncate ml-1">
                                {message.file.name}
                              </p>
                            </div>
                          )}

                          {message.file.type === "audio" && (
                            <AudioPlayer
                              src={message.file.url}
                              fileName={message.file.name}
                            />
                          )}

                          {message.file.type === "video" && (
                            <VideoPlayer
                              src={message.file.url}
                              fileName={message.file.name}
                            />
                          )}

                          {message.file.type === "document" && (
                            <a
                              href={message.file.url}
                              download={message.file.name}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block mt-2 max-w-sm group cursor-pointer"
                            >
                              <div className="p-4 bg-gradient-to-br from-slate-700 to-slate-800 rounded-2xl shadow-lg border border-slate-600 hover:border-slate-500 hover:shadow-xl transition-all duration-300 group-hover:from-slate-600 group-hover:to-slate-700">
                                <div className="flex items-start gap-3">
                                  <div className="p-3 bg-blue-600/20 rounded-xl flex-shrink-0 group-hover:bg-blue-500/30 transition-colors">
                                    <span className="text-2xl">📄</span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-white truncate group-hover:text-blue-200 transition-colors">
                                      {message.file.name}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                      {formatFileSize(message.file.size)}
                                    </p>
                                  </div>
                                  <div className="flex-shrink-0 p-2 bg-blue-600/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity group-hover:bg-blue-500/30">
                                    <Download className="w-4 h-4 text-blue-300" />
                                  </div>
                                </div>
                              </div>
                            </a>
                          )}
                        </>
                      )}

                      {message.isEdited && <EditedIndicator />}
                    </>
                  )}
                </div>

                {/* Reaction Picker on Hover (only for non-deleted messages) */}
                {!isDeletedForEveryone &&
                  hoveredMessageId === message._id &&
                  !isScheduled &&
                  !isCancelled && (
                    <div className="absolute -top-14 left-1/2 transform -translate-x-1/2 flex gap-2 bg-slate-800 rounded-full p-2 shadow-lg z-20">
                      <ReactionPicker
                        onSelectReaction={(emoji) =>
                          handleAddReaction(message._id, emoji)
                        }
                        messageCreatedAt={message.createdAt}
                        isSender={isMine}
                      />
                      {isMine && canEditOrDelete(message.createdAt) && (
                        <button
                          onClick={(e) => {
                            const rect =
                              e.currentTarget.getBoundingClientRect();
                            handleOpenContextMenu(
                              message,
                              rect.right,
                              rect.top,
                            );
                          }}
                          className="p-1 rounded hover:bg-slate-700 transition"
                          title="More options"
                        >
                          <MoreVertical size={16} />
                        </button>
                      )}
                    </div>
                  )}
              </div>

              {/* Message Reactions */}
              {message.reactions && message.reactions.length > 0 && (
                <MessageReactions
                  reactions={message.reactions}
                  onReactionClick={(emoji) => {
                    const hasReacted = message.reactions.some(
                      (r) => r.emoji === emoji && r.userId === authUser._id,
                    );
                    if (hasReacted) {
                      handleRemoveReaction(message._id);
                    } else {
                      handleAddReaction(message._id, emoji);
                    }
                  }}
                  currentUserId={authUser._id}
                />
              )}
            </div>
          );
        })}

        {/* Context Menu */}
        {contextMenu && selectedMessageForMenu && (
          <div
            className="fixed bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-50 min-w-max max-w-48"
            style={{
              top: Math.min(contextMenu.y, window.innerHeight - 200) + "px",
              left: Math.min(contextMenu.x, window.innerWidth - 220) + "px",
            }}
          >
            {contextMenu.type === "scheduled" && (
              <button
                onClick={handleCancelSchedule}
                className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-slate-700 flex items-center gap-2 rounded-lg"
              >
                <Trash2 size={14} />
                Cancel Schedule
              </button>
            )}

            {contextMenu.type === "message" && (
              <>
                {/* Edit - only for sender within 10 minutes */}
                {contextMenu.isSender &&
                  canEditOrDelete(selectedMessageForMenu.createdAt) && (
                    <button
                      onClick={() => {
                        setEditingMessageId(selectedMessageForMenu._id);
                        setEditText(selectedMessageForMenu.text);
                        setContextMenu(null);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-blue-400 hover:bg-slate-700 flex items-center gap-2"
                    >
                      ✏️ Edit
                    </button>
                  )}

                {/* Delete for Everyone - only for sender within 10 minutes */}
                {contextMenu.isSender &&
                  canEditOrDelete(selectedMessageForMenu.createdAt) && (
                    <button
                      onClick={handleDeleteForEveryone}
                      className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-slate-700 flex items-center gap-2 rounded-lg"
                    >
                      <Trash2 size={14} />
                      Delete Message
                    </button>
                  )}
              </>
            )}
          </div>
        )}
      </div>

      <MessageInput />
    </div>
  );
};

export default ChatContainer;
