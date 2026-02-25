import { useState, useRef, useEffect } from "react";
import { VALID_REACTIONS, canEditOrDelete } from "../lib/messageApi.js";

/**
 * ReactionPicker Component
 * Shows emoji reaction options for a message
 * Only allows receivers to react, not the sender
 */
export const ReactionPicker = ({
  onSelectReaction,
  messageCreatedAt,
  isSender,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const pickerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleEmojiSelect = (emoji) => {
    console.log("[ReactionPicker] Selected emoji:", emoji);
    onSelectReaction(emoji);
    setIsOpen(false);
  };

  // Only allow receivers to react
  if (isSender) {
    return null; // Don't render anything for senders
  }

  return (
    <div className="relative" ref={pickerRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          console.log("[ReactionPicker] Button clicked, isOpen was:", isOpen);
          setIsOpen(!isOpen);
        }}
        className="p-1.5 rounded-full hover:bg-slate-700 transition text-lg hover:scale-125 transform cursor-pointer"
        title="Add reaction"
      >
        🤍
      </button>

      {isOpen && (
        <div className="absolute top-10 left-1/2 transform -translate-x-1/2 bg-white dark:bg-slate-800 rounded-full shadow-lg border border-gray-200 dark:border-slate-700 p-2 flex gap-1 z-50">
          {VALID_REACTIONS.map((emoji) => (
            <button
              key={emoji}
              onClick={(e) => {
                e.stopPropagation();
                console.log("[ReactionPicker] Emoji clicked:", emoji);
                handleEmojiSelect(emoji);
              }}
              className="text-xl p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition hover:scale-125 transform cursor-pointer"
              title={`React with ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * MessageContextMenu Component
 * Displays edit, delete, and reaction options for messages
 */
export const MessageContextMenu = ({
  message,
  currentUserId,
  onEdit,
  onDeleteForMe,
  onDeleteForEveryone,
  onReact,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const isSender = message.senderId === currentUserId;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const canEditOrDeleteNow = canEditOrDelete(message.createdAt);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition"
        title="Message options"
      >
        ⋮
      </button>

      {isOpen && (
        <div className="absolute right-0 bottom-full mb-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10 min-w-48 max-h-96 overflow-y-auto">
          {/* Reactions - Only for receivers */}
          {!isSender && (
            <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 mb-2">React</p>
              <div className="flex flex-wrap gap-2">
                {VALID_REACTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      onReact(emoji);
                      setIsOpen(false);
                    }}
                    className="text-2xl p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition hover:scale-125 transform"
                    title={`React with ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Edit (sender only, within 10 minutes) */}
          {isSender && canEditOrDeleteNow && !message.deletedForEveryone && (
            <button
              onClick={() => {
                onEdit();
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition text-sm"
            >
              ✏️ Edit
            </button>
          )}

          {/* Delete For Me */}
          <button
            onClick={() => {
              onDeleteForMe();
              setIsOpen(false);
            }}
            className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition text-sm"
          >
            👁️ Delete for me
          </button>

          {/* Delete For Everyone (sender only, within 10 minutes) */}
          {isSender && canEditOrDeleteNow && !message.deletedForEveryone && (
            <button
              onClick={() => {
                if (
                  confirm(
                    "Delete this message for everyone? This cannot be undone.",
                  )
                ) {
                  onDeleteForEveryone();
                  setIsOpen(false);
                }
              }}
              className="w-full text-left px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900 transition text-sm text-red-600 dark:text-red-400"
            >
              🗑️ Delete for everyone
            </button>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * EditedIndicator Component
 * Shows that a message has been edited
 */
export const EditedIndicator = () => {
  return (
    <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
      (edited)
    </span>
  );
};

/**
 * MessageReactions Component
 * Displays grouped emoji reactions under message
 */
export const MessageReactions = ({
  reactions,
  onReactionClick,
  currentUserId,
}) => {
  if (!reactions || reactions.length === 0) {
    return null;
  }

  // Group reactions by emoji
  const groupedReactions = reactions.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = [];
    }
    acc[reaction.emoji].push(reaction.userId);
    return acc;
  }, {});

  return (
    <div className="flex flex-wrap gap-1 mt-2 relative z-10">
      {Object.entries(groupedReactions).map(([emoji, userIds]) => (
        <button
          key={emoji}
          onClick={() => onReactionClick(emoji)}
          className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-sm transition hover:scale-110 transform flex-shrink-0 whitespace-nowrap ${
            userIds.some((id) => id === currentUserId)
              ? "bg-blue-500/30 border border-blue-400 dark:border-blue-600"
              : "bg-gray-600/40 border border-gray-500 dark:border-gray-600 hover:bg-gray-600/50 dark:hover:bg-gray-600/60"
          }`}
          title={`Reacted by: ${userIds.length} user(s)`}
        >
          <span className="text-base">{emoji}</span>
          <span className="text-xs font-medium">{userIds.length}</span>
        </button>
      ))}
    </div>
  );
};

/**
 * FileUploadInput Component
 * Handles file selection and uploads with progress
 */
export const FileUploadInput = ({
  onUploadStart,
  onUploadProgress,
  onUploadComplete,
  onError,
}) => {
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > 100 * 1024 * 1024) {
      onError("File size exceeds 100MB limit");
      return;
    }

    setIsUploading(true);
    setProgress(0);

    onUploadStart?.(file);

    try {
      // Simulate upload progress (real progress handled by axios)
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      // Component will handle the actual upload
      onUploadProgress?.(file);

      clearInterval(progressInterval);
      setProgress(100);

      setTimeout(() => {
        onUploadComplete?.(file);
        setIsUploading(false);
        setProgress(0);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }, 500);
    } catch (error) {
      onError(error.message);
      setIsUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        disabled={isUploading}
        className="hidden"
        accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.mp3,.wav,.mp4,.webm"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        title="Attach file"
      >
        📎
      </button>

      {isUploading && (
        <div className="absolute bottom-12 left-0 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 min-w-48">
          <p className="text-sm font-medium mb-2">Uploading...</p>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">{progress}%</p>
        </div>
      )}
    </div>
  );
};

/**
 * FileMessagePreview Component
 * Shows uploaded file in message
 */
export const FileMessagePreview = ({ file, onDownload }) => {
  const { url, name, size, type } = file;

  const getFileIcon = (fileType) => {
    const icons = {
      image: "🖼️",
      document: "📄",
      audio: "🎵",
      video: "🎬",
    };
    return icons[fileType] || "📎";
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg mt-2">
      <span className="text-2xl">{getFileIcon(type)}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{name}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {formatFileSize(size)}
        </p>
      </div>
      {type === "image" && url && (
        <img
          src={url}
          alt="preview"
          className="w-12 h-12 object-cover rounded cursor-pointer hover:opacity-80"
          onClick={() => onDownload?.(url)}
          onError={(e) => {
            try {
              e.currentTarget.onerror = null;
              e.currentTarget.src = "/avatar.png";
            } catch (err) {
              console.error(err);
            }
          }}
        />
      )}
      {type !== "image" && (
        <button
          onClick={() => onDownload?.(url)}
          className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition"
        >
          Download
        </button>
      )}
    </div>
  );
};
