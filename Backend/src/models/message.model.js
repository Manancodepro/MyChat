import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
    },
    image: {
      type: String,
    },
    // ===== FILE UPLOAD =====
    file: {
      url: String,
      name: String,
      size: Number, // in bytes
      mimeType: String,
      type: {
        type: String,
        enum: ["image", "document", "audio", "video"],
      },
      uploadedAt: {
        type: Date,
        default: Date.now,
      },
    },

    // ===== MESSAGE REACTIONS =====
    reactions: [
      {
        emoji: {
          type: String,
          enum: ["👍", "❤️", "😂", "😮", "😢", "🔥"],
        },
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        reactedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // ===== EDIT TRACKING =====
    editHistory: [
      {
        originalText: String,
        editedAt: Date,
        editedBy: mongoose.Schema.Types.ObjectId, // for future group chat support
      },
    ],
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: Date,

    // ===== DELETION STATUS =====
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedFor: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ], // users who deleted for themselves
    deletedForEveryone: {
      type: Boolean,
      default: false,
    },
    deletedAt: Date,

    // ===== SCHEDULED MESSAGING (EXISTING) =====
    status: {
      type: String,
      enum: ["sent", "scheduled", "cancelled"],
      default: "sent",
    },
    scheduledTime: {
      type: Date,
      default: null,
    },
    deliveredAt: {
      type: Date,
      default: null,
    },
    jobId: {
      type: String,
      default: null,
    },
  },
  { timestamps: true },
);

// Indexes for optimized queries
MessageSchema.index({ status: 1, scheduledTime: 1 });
MessageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });
MessageSchema.index({ "reactions.userId": 1 });
MessageSchema.index({ deletedForEveryone: 1 });

const Message = mongoose.model("Message", MessageSchema);
export default Message;
