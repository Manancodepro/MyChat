// ============================================
// EXAMPLE INTEGRATION INTO YOUR CHAT COMPONENTS
// ============================================

// ===== IN YOUR MESSAGE INPUT COMPONENT =====

import { useState } from "react";
import { useChatStore } from "@/store/useChatStore";
import { FileUploadInput } from "@/components/MessageComponents";
import toast from "react-hot-toast";

export const MessageInputExample = ({ receiverId }) => {
  const [text, setText] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const { uploadFile, sendMessage } = useChatStore();

  const handleFileSelect = (file) => {
    setSelectedFile(file);
    toast.success(`File selected: ${file.name}`);
  };

  const handleSendMessage = async () => {
    if (!text.trim() && !selectedFile) {
      toast.error("Enter text or select a file");
      return;
    }

    // If file selected, upload it
    if (selectedFile) {
      await uploadFile(receiverId, selectedFile, text);
      setText("");
      setSelectedFile(null);
    }
    // Otherwise send regular text message
    else {
      await sendMessage({ text });
      setText("");
    }
  };

  return (
    <div className="flex items-end gap-2 p-4 border-t">
      {/* File Upload Button */}
      <FileUploadInput
        onUploadProgress={(file) => handleFileSelect(file)}
        onError={(err) => toast.error(err)}
      />

      {/* Message Input */}
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type a message..."
        className="flex-1 px-4 py-2 border rounded-lg"
      />

      {/* Send Button */}
      <button
        onClick={handleSendMessage}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
      >
        Send
      </button>
    </div>
  );
};

// ===== IN YOUR MESSAGE DISPLAY COMPONENT =====

import {
  MessageReactions,
  MessageContextMenu,
  FileMessagePreview,
  EditedIndicator,
} from "@/components/MessageComponents";
import {
  canEditOrDelete,
  getTimeRemaining,
  formatFileSize,
} from "@/lib/messageApi";

export const MessageExample = ({ message, currentUserId }) => {
  const {
    addReaction,
    removeReaction,
    editMessage,
    deleteForMe,
    deleteForEveryone,
  } = useChatStore();

  const isSender = message.senderId === currentUserId;
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.text);

  const handleReact = async (emoji) => {
    // Check if user already has this emoji reaction
    const userReaction = message.reactions?.find(
      (r) => r.userId === currentUserId && r.emoji === emoji,
    );

    if (userReaction) {
      // Remove existing reaction
      await removeReaction(message._id);
    } else {
      // Add new reaction
      await addReaction(message._id, emoji);
    }
  };

  const handleEdit = async () => {
    if (editText.trim() === message.text) {
      setIsEditing(false);
      return;
    }
    await editMessage(message._id, editText);
    setIsEditing(false);
  };

  const handleDeleteForMe = async () => {
    if (confirm("Delete this message for you?")) {
      await deleteForMe(message._id);
    }
  };

  const handleDeleteForEveryone = async () => {
    if (confirm("Delete this message for everyone?")) {
      await deleteForEveryone(message._id);
    }
  };

  // If message deleted for everyone
  if (message.deletedForEveryone) {
    return (
      <div className="text-center text-gray-500 italic">
        This message was deleted
      </div>
    );
  }

  // If deleted for current user, don't show
  if (message.deletedFor?.includes(currentUserId)) {
    return null;
  }

  return (
    <div className={`flex ${isSender ? "justify-end" : "justify-start"} mb-4`}>
      <div
        className={`max-w-xs p-3 rounded-lg ${
          isSender
            ? "bg-blue-500 text-white"
            : "bg-gray-200 text-black dark:bg-gray-700 dark:text-white"
        }`}
      >
        {/* Message Text */}
        {isEditing ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="flex-1 px-2 py-1 rounded text-black"
              autoFocus
            />
            <button
              onClick={handleEdit}
              className="px-2 bg-green-500 rounded text-white"
            >
              Save
            </button>
            <button
              onClick={() => {
                setEditText(message.text);
                setIsEditing(false);
              }}
              className="px-2 bg-red-500 rounded text-white"
            >
              Cancel
            </button>
          </div>
        ) : (
          <>
            <p>{message.text}</p>
            {message.isEdited && (
              <EditedIndicator editedAt={message.editedAt} />
            )}
          </>
        )}

        {/* File Display */}
        {message.file && (
          <FileMessagePreview
            file={message.file}
            onDownload={(url) => window.open(url, "_blank")}
          />
        )}

        {/* Message Reactions */}
        {!isEditing && message.reactions?.length > 0 && (
          <MessageReactions
            reactions={message.reactions}
            onReactionClick={handleReact}
            currentUserId={currentUserId}
          />
        )}

        {/* Context Menu */}
        {!isEditing && (
          <div className="absolute top-0 right-0 -mt-8 opacity-0 group-hover:opacity-100 transition">
            <MessageContextMenu
              message={message}
              currentUserId={currentUserId}
              onEdit={() => setIsEditing(true)}
              onDeleteForMe={handleDeleteForMe}
              onDeleteForEveryone={handleDeleteForEveryone}
              onReact={handleReact}
            />
          </div>
        )}
      </div>
    </div>
  );
};

// ===== COMPLETE CHAT CONTAINER EXAMPLE =====

export const ChatContainerExample = () => {
  const { messages, selectedUser } = useChatStore();
  const { authUser } = useAuthStore();

  if (!selectedUser) {
    return (
      <div className="flex-1 flex items-center justify-center">
        Select a user
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message._id} className="group">
            <MessageExample message={message} currentUserId={authUser._id} />
          </div>
        ))}
      </div>

      {/* Input Area */}
      <MessageInputExample receiverId={selectedUser._id} />
    </div>
  );
};

// ===== EXAMPLE: LISTENING TO SOCKET EVENTS =====

// In your useEffect:
useEffect(() => {
  const { socket } = useAuthStore.getState();

  // Listen for real-time reactions
  socket.on("reactionAdded", ({ messageId, reactions }) => {
    console.log(`Reactions updated for message ${messageId}:`, reactions);
    // Store will automatically update via subscribeToMessages
  });

  // Listen for edits
  socket.on("messageEdited", ({ messageId, text, editedAt }) => {
    console.log(`Message ${messageId} edited:`, text);
    // Store will automatically update
  });

  // Listen for deletions
  socket.on("messageDeleted", ({ messageId, deletedForEveryone }) => {
    console.log(
      `Message ${messageId} deleted for everyone:`,
      deletedForEveryone,
    );
    // Store will automatically update
  });

  return () => {
    socket.off("reactionAdded");
    socket.off("messageEdited");
    socket.off("messageDeleted");
  };
}, []);

// ===== STYLING SUGGESTION =====

/*
Add to your CSS or Tailwind:

.message-group {
  @apply relative group;
}

.message-group:hover .message-actions {
  @apply opacity-100;
}

.message-actions {
  @apply absolute top-0 right-0 -mt-8 opacity-0 transition-opacity duration-200 flex gap-1;
}

.file-preview {
  @apply flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg mt-2;
}

.emoji-reactions {
  @apply flex flex-wrap gap-1 mt-2;
}

.emoji-button {
  @apply flex items-center gap-1 px-2 py-1 rounded-full text-sm transition;
}

.emoji-button.active {
  @apply bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700;
}

.emoji-button:hover {
  @apply bg-gray-200 dark:bg-gray-700;
}

.edit-window {
  @apply text-xs text-gray-500 dark:text-gray-400;
}

.deleted-message {
  @apply text-center text-gray-500 italic py-2;
}
*/

// ===== ERROR HANDLING EXAMPLE =====

const handleUploadWithErrorHandling = async (file, receiverId, text) => {
  try {
    // Validate file size
    if (file.size > 100 * 1024 * 1024) {
      throw new Error("File exceeds 100MB limit");
    }

    // Show loading toast
    const toastId = toast.loading("Uploading...");

    // Upload
    await uploadFile(receiverId, file, text);

    // Update toast
    toast.success("File uploaded!", { id: toastId });
  } catch (error) {
    toast.error(error.message || "Upload failed");
  }
};

// ===== USE STORE ACTIONS =====

const {
  // Reactions
  addReaction,
  removeReaction,

  // Edit & Delete
  editMessage,
  deleteForMe,
  deleteForEveryone,

  // Upload
  uploadFile,

  // Other existing actions
  sendMessage,
  getMessages,
  subscribeToMessages,
} = useChatStore();

// ===== TIPS & BEST PRACTICES =====

/*
1. REACTIONS:
   - Allow changing reactions (replaces old)
   - Show count per emoji
   - Highlight user's own reactions

2. EDIT:
   - Show time remaining (10 minutes)
   - Disable edit button after time expires
   - Show "(edited)" indicator

3. DELETE:
   - Offer two options: "for me" and "for everyone"
   - "For everyone" needs confirmation dialog
   - Soft delete (keep message ID)

4. FILE UPLOAD:
   - Show progress bar
   - Validate file type/size client-side
   - Show file preview
   - Download button for non-images

5. PERFORMANCE:
   - Lazy load images
   - Paginate old messages
   - Debounce edit input
   - Cache file downloads

6. UX:
   - Show tooltip with 10-minute window
   - Disable expired actions
   - Confirm destructive actions
   - Clear error messages
   - Success/error toasts
*/
