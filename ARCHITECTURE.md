# 🏗️ Advanced Messaging Architecture

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          FRONTEND (React 19)                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────────────┐    ┌──────────────────────────────┐      │
│  │  Message Components      │    │  Message API Utilities        │      │
│  │  ─────────────────────   │    │  ────────────────────────────│      │
│  │ • ReactionPicker         │    │ • uploadFileMessage()         │      │
│  │ • MessageContextMenu     │    │ • addReaction()               │      │
│  │ • EditedIndicator        │    │ • removeReaction()            │      │
│  │ • MessageReactions       │    │ • editMessage()               │      │
│  │ • FileUploadInput        │    │ • deleteForMe()               │      │
│  │ • FileMessagePreview     │    │ • deleteForEveryone()         │      │
│  └──────────────────────────┘    │ • Utilities (validate, format)│      │
│            ▲                      └──────────────────────────────┘      │
│            │                                    ▲                       │
│            │                                    │                       │
│  ┌─────────▼────────────────────┐   ┌──────────┴──────────────────┐    │
│  │   Zustand Store               │   │   API Client (Axios)        │    │
│  │   (useChatStore)              │   │                             │    │
│  │  ────────────────────────────│   │  baseURL: /api              │    │
│  │ • addReaction()               │   │  withCredentials: true       │    │
│  │ • removeReaction()            │   │                             │    │
│  │ • editMessage()               │   └─────────────────────────────┘    │
│  │ • deleteForMe()               │                  ▲                   │
│  │ • deleteForEveryone()         │                  │                   │
│  │ • uploadFile()                │                  │                   │
│  │ • Socket listeners (4 new)    │                  │                   │
│  │ • unsubscribe handlers        │                  │                   │
│  └──────────┬─────────────────────┘                  │                   │
│             │                                        │                   │
│             │            ┌────────────────────────────┘                   │
│             │            │                                               │
│             │            ▼ HTTP Requests                                │
│             │   ┌────────────────────────┐                              │
│             │   │  WS Socket Connection  │                              │
│             │   │  (Socket.io Client)     │                              │
│             └──▶│                         │                              │
│                 └────────────────────────┘                              │
└──────────┬──────────────────────────────────────────────────────────────┘
           │
           │ NETWORK (HTTP REST + WebSocket)
           │
┌──────────▼──────────────────────────────────────────────────────────────┐
│                        BACKEND (Express.js)                             │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────────────────────────────────────────────────┐         │
│  │  REST API Routes (Message Routes)                         │         │
│  │  ────────────────────────────────────────────────────────│         │
│  │  POST   /messages/upload/:id                              │         │
│  │  POST   /messages/:messageId/reaction                    │         │
│  │  DELETE /messages/:messageId/reaction                    │         │
│  │  PATCH  /messages/:messageId/edit                        │         │
│  │  DELETE /messages/:messageId/deleteForMe                │         │
│  │  DELETE /messages/:messageId/deleteForEveryone          │         │
│  └────────────────────────────────────────────────────────────┘         │
│                      ▲                                                  │
│                      │                                                  │
│  ┌───────────────────┴──────────────────────────────────┐              │
│  │   Message Controllers                                │              │
│  │   ──────────────────────────────────────────────────│              │
│  │  • uploadFileMessage()     ─────────────┐            │              │
│  │  • addReaction()           ─────────────┼┐           │              │
│  │  • removeReaction()        ─────────────┼┼┐          │              │
│  │  • editMessage()           ─────────────┼┼┼┐         │              │
│  │  • deleteForMe()           ─────────────┼┼┼┼┐        │              │
│  │  • deleteForEveryone()     ─────────────┼┼┼┼┼┐       │              │
│  └───────────────────────────────────────────────┼┼┼┼┼┐  │              │
│                                                  ▼▼▼▼▼│  │              │
│  ┌─────────────────────────────────────────────────────┐  │              │
│  │  Multer File Upload Middleware                      │  │              │
│  │  ────────────────────────────────────────────────  │  │              │
│  │  • Disk storage config                              │  │              │
│  │  • File type validation                             │  │              │
│  │  • Size limit (100MB)                               │  │              │
│  │  • Extension matching                              │  │              │
│  │  • Error handling                                   │  │              │
│  │  • Filename generation                              │  │              │
│  └──────────────────┬─────────────────────────────────┘  │              │
│                     │                                    │              │
│                     ▼                                    │              │
│  ┌──────────────────────────────────────────┐           │              │
│  │  Local File System                       │           │              │
│  │  (Production: Cloud Storage S3/GCS/Azure)│           │              │
│  │  ──────────────────────────────────────│           │              │
│  │  /uploads/                               │           │              │
│  │    └── image/     (*.jpg, *.png, ...)    │           │              │
│  │    └── document/  (*.pdf, *.docx, ...)   │           │              │
│  │    └── audio/     (*.mp3, *.wav)         │           │              │
│  │    └── video/     (*.mp4, *.webm)        │           │              │
│  └──────────────────────────────────────────┘           │              │
│                                                          │              │
│  ┌───────────────────────────────────────────┐          │              │
│  │  Message Model                            │          │              │
│  │  ──────────────────────────────────────── │          │              │
│  │  Field Schema:                            │          │              │
│  │  ├─ senderId (ObjectId)                   │          │              │
│  │  ├─ receiverId (ObjectId)                 │          │              │
│  │  ├─ text (String)                         │────────┐ │              │
│  │  ├─ image (String - Cloudinary)           │        │ │              │
│  │  ├─ file Object                           │        │ │              │
│  │  │  ├─ url                                │        │ │              │
│  │  │  ├─ name                               │        │ │              │
│  │  │  ├─ size                               │        │ │              │
│  │  │  ├─ mimeType                           │        │ │              │
│  │  │  ├─ type (image|document|audio|video)  │        │ │              │
│  │  │  └─ uploadedAt                         │        │ │              │
│  │  ├─ reactions Array[Object]               │        │ │              │
│  │  │  ├─ emoji (String)                     │        │ │              │
│  │  │  ├─ userId (ObjectId)                  │        │ │              │
│  │  │  └─ reactedAt (Date)                   │        │ │              │
│  │  ├─ editHistory Array[Object]             │        │ │              │
│  │  │  ├─ originalText                       │        │ │              │
│  │  │  └─ editedAt                           │        │ │              │
│  │  ├─ isEdited (Boolean)                    │        │ │              │
│  │  ├─ editedAt (Date)                       │        │ │              │
│  │  ├─ isDeleted (Boolean)                   │        │ │              │
│  │  ├─ deletedFor Array[ObjectId]            │        │ │              │
│  │  ├─ deletedForEveryone (Boolean)          │        │ │              │
│  │  ├─ deletedAt (Date)                      │        │ │              │
│  │  ├─ status (sent|scheduled|cancelled)     │        │ │              │
│  │  ├─ scheduledTime (Date)                  │        │ │              │
│  │  ├─ deliveredAt (Date)                    │        │ │              │
│  │  ├─ createdAt (Date)                      │        │ │              │
│  │  └─ updatedAt (Date)                      │        │ │              │
│  └──────────────────────────────────────────┘        │ │              │
│                                                      │ │              │
│  ┌──────────────────────────────────────────┐       │ │              │
│  │ Socket.io Events (Real-time Updates)    │       │ │              │
│  │ ──────────────────────────────────────── │       │ │              │
│  │ emit: reactionAdded                      │───────┘ │              │
│  │ emit: reactionRemoved                    │─────────┘              │
│  │ emit: messageEdited                      │                        │
│  │ emit: messageDeleted                     │                        │
│  │ (+ existing: newMessage, scheduled, etc) │                        │
│  └──────────────────────────────────────────┘                        │
│             ▲                                                         │
│             │                                                         │
│  ┌──────────┴──────────────────────────────┐                         │
│  │  MongoDB Database                       │                         │
│  │  ──────────────────────────────────────│                         │
│  │  Collections:                           │                         │
│  │  ├─ messages                            │                         │
│  │  │  ├─ Indexes:                         │                         │
│  │  │  ├─ status + scheduledTime           │                         │
│  │  │  ├─ senderId + receiverId + date     │                         │
│  │  │  ├─ reactions.userId                 │                         │
│  │  │  └─ deletedForEveryone               │                         │
│  │  ├─ users                               │                         │
│  │  └─ other collections                   │                         │
│  └─────────────────────────────────────────┘                         │
│                                                                       │
└────────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagrams

### File Upload Flow
```
User selects file
        ↓
Validate file size & type (client)
        ↓
FormData: {file, text}
        ↓
POST /api/messages/upload/:receiverId
        ↓
Backend: Validate MIME + Extension
        ↓
Multer: Store in /uploads/{type}/
        ↓
Create Message with file metadata
        ↓
Save to MongoDB
        ↓
Response: Message object
        ↓
Zustand: Add to messages array
        ↓
Socket.io: Emit newMessage to receiver
        ↓
Display in chat with file preview
```

### Message Reaction Flow
```
User clicks emoji button
        ↓
onSelect: emoji
        ↓
POST /api/messages/:id/reaction {emoji}
        ↓
Backend: Validate emoji whitelist
        ↓
Remove user's existing reaction (if any)
        ↓
Add new reaction
        ↓
Save to MongoDB
        ↓
Socket.io: Emit reactionAdded
        ↓
Zustand: Update message.reactions
        ↓
Display: grouped emojis with counts
```

### Edit Message Flow
```
User clicks "Edit"
        ↓
Show edit input
        ↓
Check time: < 10 minutes?
        ↓
User modifies text
        ↓
PATCH /api/messages/:id/edit {text}
        ↓
Backend: Verify sender
        ↓
Check time again (server-side)
        ↓
Save to editHistory
        ↓
Update message.text & isEdited
        ↓
Save to MongoDB
        ↓
Socket.io: Emit messageEdited
        ↓
Zustand: Update message
        ↓
Display: Show updated text + "(edited)"
```

### Delete Message Flow
```
User right-clicks message
        ↓
Choose: "Delete for me" or "Delete for everyone"
        ↓
if (Delete for me):
    │
    └─→ DELETE /api/messages/:id/deleteForMe
           ↓
        Add userId to deletedFor array
           ↓
        Save to MongoDB
           ↓
        Zustand: Remove from messages array
           ↓
        Message hidden for this user only

else if (Delete for everyone):
    │
    └─→ Verify sender
           ↓
        Check time: < 10 minutes?
           ↓
        DELETE /api/messages/:id/deleteForEveryone
           ↓
        Delete file from storage (if exists)
           ↓
        Set deletedForEveryone = true
           ↓
        Set text = "This message was deleted"
           ↓
        Save to MongoDB
           ↓
        Socket.io: Emit messageDeleted
           ↓
        Zustand: Update all clients
           ↓
        Message deleted for everyone
```

## State Management Flow

```
React Component
        ↓
±─────────────────────────────────────┐
│ useChatStore (Zustand)              │
│ ─────────────────────────────────── │
│ State:                              │
│  • messages []                      │
│  • selectedUser                     │
│  • isMessagesLoading                │
│                                     │
│ Actions:                            │
│  • addReaction()                    │
│  • removeReaction()                 │
│  • editMessage()                    │
│  • deleteForMe()                    │
│  • deleteForEveryone()              │
│  • uploadFile()                     │
│  • subscribeToMessages()            │
│  • unsubscribeFromMessages()        │
│  • [existing actions...]            │
│                                     │
│ Socket Listeners:                   │
│  • reactionAdded ──→ Update state   │
│  • reactionRemoved ──→ Update state │
│  • messageEdited ──→ Update state   │
│  • messageDeleted ──→ Update state  │
│  • [existing listeners...]          │
└─────────────────────────────────────┘
        ↓
    API Layer
        ↓
  Socket.io / Axios
        ↓
    Backend API
        ↓
   MongoDB
```

## Component Hierarchy

```
ChatContainer
├── MessageList
│   └── MessageExample[] (for each message)
│       ├── MessageContextMenu
│       │   ├── ReactionPicker
│       │   ├── Edit Option
│       │   ├── Delete For Me
│       │   └── Delete For Everyone
│       ├── MessageReactions (display)
│       ├── FileMessagePreview (if file)
│       ├── EditedIndicator (if edited)
│       └── Message Text/Image
│
└── MessageInput
    ├── FileUploadInput
    │   └── Progress Bar
    ├── Text Input
    └── Send Button
```

## Time Constraints

```
Message Created
        ↓
┌───────┴───────┬──────────────────────┐
│               │                      │
0 min        5 min                10 min
│               │                      │
Can Edit ✓      │                Can Edit ✓
Can React ✓     │                Can React ✓
Can Delete ✓    │                Can Delete Today ✗
                │                (Time window closed)
                │
            5 minutes remaining ✓
            Show countdown on UI
```

## Error Handling Flow

```
Request
    ↓
┌───────────────────────────────┐
│ Validation Layer              │
│ • File size > 100MB?          │
│ • Unsupported mime type?      │
│ • Invalid sender?             │
│ • Time limit exceeded?        │
│ • Unauthorized user?          │
└───────────┬───────────────────┘
            ↓
        Success ✓ ─→ Process Request
            ↓
        Failure ✗ ─→ Return Error
                    {
                      error: "Code",
                      message: "Readable message"
                    }
                         ↓
                    Client Toast
                    (Error message)
```

## Security Layers

```
Request
    ↓
Authentication Middleware
├─ Token verified?
└─ User exists?
    ↓
Authorization Check
├─ Sender = Current user? (for edit/delete)
├─ Receiver in chat? (for access)
└─ Sufficient permissions?
    ↓
Input Validation
├─ MIME type whitelist
├─ File extension check
├─ Text not empty
├─ Emoji in whitelist
└─ Time validation
    ↓
Business Logic
├─ 10-minute window
├─ One reaction per user
└─ Soft-delete preserves ID
    ↓
Database Operation
├─ Transaction safety
├─ Audit trail
└─ Error rollback
    ↓
Response
├─ Success (200-201)
└─ Error (400-500)
```

---

## Integration Points

1. **Store Integration**: All components use `useChatStore()`
2. **Socket Integration**: Real-time sync via Socket.io
3. **API Integration**: RESTful endpoints via Axios
4. **File System**: `/uploads/` directory for storage
5. **Database**: MongoDB with proper indexing
6. **Authentication**: JWT token middleware

---

## Performance Considerations

- **Database Queries**: Optimized with indexes
- **File Upload**: Streaming with multer
- **Socket Events**: Batched where possible
- **Component Rendering**: Memoization recommended
- **State Management**: Zustand for minimal re-renders
- **Storage**: Organized by type for quick access

