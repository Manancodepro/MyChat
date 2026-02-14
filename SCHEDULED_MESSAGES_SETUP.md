# Scheduled Messages Feature - Setup & Usage Guide

## 📋 Overview
This guide provides complete setup instructions and usage details for the Scheduled Messages feature in the Chatty application.

## 🚀 Installation & Setup

### Step 1: Install Dependencies

**Backend:**
```bash
cd Backend
npm install
```

**Frontend:**
```bash
cd ../Frontend
npm install
```

New packages added:
- **Backend**: `bullmq` (^5.0.0), `redis` (^4.6.0)
- **Frontend**: `react-datepicker` (^4.18.0), `date-fns` (^3.0.0)

### Step 2: Redis Setup

The scheduled messages feature requires a running Redis server.

**Option 1: Local Redis Installation**
```bash
# macOS (using Homebrew)
brew install redis
brew services start redis

# Windows (using WSL)
wsl
sudo apt-get update
sudo apt-get install redis-server
redis-server

# Linux
sudo apt-get update
sudo apt-get install redis-server
sudo service redis-server start
```

**Option 2: Docker (Recommended)**
```bash
docker run -d -p 6379:6379 redis:latest
```

**Option 3: Verify Redis Installation**
```bash
redis-cli ping
# Expected response: PONG
```

### Step 3: Environment Variables

Update your `Backend/.env` file with Redis configuration:
```env
# Existing variables
MONGODB_URI=mongodb+srv://...
PORT=5000
JWT_SECRET=mysecretkey
NODE_ENV=development
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# New Redis variables (optional if using localhost)
REDIS_HOST=localhost
REDIS_PORT=6379
# REDIS_PASSWORD=your_password  # if needed

# Optional: Set frontend origin
CLIENT_ORIGIN=http://localhost:5173
```

### Step 4: Database Migration

The Message model has been updated with new fields:
- `status`: "sent" | "scheduled" | "cancelled"
- `scheduledTime`: Date when message should be sent
- `deliveredAt`: Actual delivery timestamp
- `jobId`: BullMQ job ID for tracking

**Note**: Existing messages will retain their default status as "sent".

### Step 5: Start Services

**Terminal 1 - Backend:**
```bash
cd Backend
npm install  # Install new dependencies
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd Frontend
npm install  # Install new dependencies  
npm run dev
```

**Terminal 3 - Redis (if not using Docker):**
```bash
redis-server
```

Expected backend logs:
```
[Redis] Connected to Redis
[MessageQueue] Queue initialized
server is running on PORT:5000
```

## 🎯 Feature Usage

### Scheduling a Message

#### Method 1: Using Clock Icon in Chat Header
1. Open a chat with a user
2. Click the ⏰ **Clock icon** in the top-right of the chat header
3. A modal appears with date and time pickers
4. Select desired date and time (UTC)
5. Click **"Schedule"** button

#### Method 2: Using Clock Icon in Message Input
1. Type your message or select an image
2. Click the **Clock icon** (orange) in the message input area
3. Select date and time
4. Click **"Schedule"**

#### Message Preview:
- Message appears immediately as a **greyed-out bubble** (opacity 60%)
- Shows ⏰ **clock icon**
- Displays: **"Scheduled for [date] [time] UTC"**

### Cancelling a Scheduled Message

1. **Right-click** on the scheduled message bubble
2. A context menu appears with **"Cancel Schedule"** option
3. Click to cancel
4. Message status changes to **"cancelled"** with strikethrough

### Viewing All Scheduled Messages

1. Go to **Profile** page
2. Scroll down to **"Scheduled Messages"** section
3. View all pending scheduled messages
4. Click **🗑️ trash icon** to cancel any scheduled message

### Socket Events

The feature emits real-time updates:

| Event | Payload | Use |
|-------|---------|-----|
| `messageScheduled` | `{messageId, status, scheduledTime}` | Schedule confirmation |
| `messageCancelled` | `{messageId, status}` | Cancel confirmation |
| `scheduledMessageSent` | `{messageId, status, deliveredAt}` | Message delivery |

## 🔧 Backend Architecture

### File Structure
```
Backend/
├── src/
│   ├── lib/
│   │   ├── messageQueue.js      (✨ New) BullMQ manager
│   │   ├── redis.js             (✨ New) Redis connection
│   │   └── ...
│   ├── controllers/
│   │   └── message.controller.js (Updated) ✨ New handlers
│   ├── routes/
│   │   └── message.routes.js    (Updated) ✨ New endpoints
│   ├── models/
│   │   └── message.model.js     (Updated) ✨ New fields
│   └── index.js                 (Updated) ✨ Queue init + shutdown
```

### API Endpoints

#### Schedule a Message
```http
POST /api/messages/schedule/:receiverId
Content-Type: application/json
Cookie: jwt=...

{
  "text": "Hello, this is a scheduled message",
  "image": "data:image/jpeg;base64,...",  # optional
  "scheduledTime": "2026-02-15T10:30:00Z"
}

Response (201):
{
  "_id": "msg_id",
  "senderId": "user_id",
  "receiverId": "user_id",
  "text": "Hello...",
  "status": "scheduled",
  "scheduledTime": "2026-02-15T10:30:00Z",
  "jobId": "message-msg_id",
  "createdAt": "...",
  "updatedAt": "..."
}
```

#### Get Scheduled Messages
```http
GET /api/messages/scheduled/list
Cookie: jwt=...

Response (200):
[
  { scheduled message objects },
  ...
]
```

#### Cancel Scheduled Message
```http
DELETE /api/messages/cancel/:messageId
Cookie: jwt=...

Response (200):
{
  "message": "Message cancelled",
  "data": { updated message object }
}
```

### BullMQ Implementation

**Job Processing Workflow:**
1. User schedules message → Job added to queue with calculated `delay`
2. Job waits until `delay` passes
3. Worker processes job:
   - Updates message `status` → `"sent"`
   - Sets `deliveredAt` timestamp
   - Emits socket events to sender & receiver
4. Message removed from queue (success) or retried (failure)

**Retry Configuration:**
- **Attempts**: 5
- **Backoff**: Exponential (starts at 2 seconds)
- **Max Delay**: Auto-calculated
- **OnFail**: Jobs logged but not removed (for debugging)

**Sample Job Flow:**
```
Schedule time: 2026-02-15 10:30 UTC
Current time:  2026-02-15 10:00 UTC
Delay: 30 minutes

↓ 30 minutes pass

Worker processes → Updates DB → Emits events → Marks complete
```

## 🛡️ Edge Cases Handled

| Scenario | Behavior |
|----------|----------|
| **Server Restart** | Redis persists queue; jobs resume on startup |
| **Negative Delay** | Validation prevents scheduling in the past |
| **Timezone Mismatch** | All times stored in UTC; frontend handles conversion |
| **Redis Crash** | Graceful error handling; queue operations fail safely |
| **User Logout** | Messages stay scheduled; job executes regardless |
| **Edit Before Send** | Not implemented (future feature) |
| **Message > 50MB** | Request rejected (413 Payload Too Large) |

## 🎨 Frontend Architecture

### Components

| Component | File | Purpose |
|-----------|------|---------|
| `ScheduleModal` | `ScheduleModal.jsx` | Date/time picker modal |
| `ChatHeader` | `ChatHeader.jsx` | Clock icon button |
| `MessageInput` | `MessageInput.jsx` | Clock button in input area |
| `ChatContainer` | `ChatContainer.jsx` | Display & cancel scheduled messages |
| `ScheduledMessagesSection` | `ScheduledMessagesSection.jsx` | Profile page view |

### Store (Zustand)

**useChatStore additions:**
- `scheduledMessages`: Array of scheduled messages
- `isScheduling`: Loading state
- `scheduleMessage(data)`: Schedule a message
- `cancelScheduledMessage(id)`: Cancel schedule
- `getScheduledMessages()`: Fetch user's pending messages

**Socket Listeners:**
- `messageScheduled`: Confirmation toast
- `messageCancelled`: List update
- `scheduledMessageSent`: Status change animation

## 📱 UI/UX Details

### Scheduled Message Bubble Styling
```
- Background: Orange semi-transparent (orange-900/30)
- Border: Orange with opacity (orange-500/50)
- Opacity: 60% (reduced to show "draft" status)
- Icon: Clock ⏰ in orange-300
- Label: "Scheduled for [date] [time] UTC"
```

### Context Menu (Right-Click)
```
Position: Follows mouse
Options:
  - Cancel Schedule (red text)
Trigger: Only on scheduled messages
```

### Modal (Date/Time Picker)
```
- Dark theme (slate-800 background)
- Date picker: react-datepicker
- Time input: HTML5 time picker
- Min date: Today
- Timezone: Always UTC
- Display: Local timezone for user, stores as UTC
```

## 🔍 Debugging

### Enable Verbose Logging

Add to `Backend/src/lib/messageQueue.js`:
```javascript
messageQueue.on('progress', (job, progress) => {
  console.log(`[MessageQueue] Job ${job.id}: ${progress}% complete`);
});
```

### Monitor Queue Status

```bash
# Start Redis CLI
redis-cli

# Monitor events
MONITOR

# Check queue keys
KEYS bullmq:*
```

### Test Scheduled Message (Quick)

Frontend Console:
```javascript
const { scheduleMessage } = useChatStore.getState();
await scheduleMessage({
  text: "Quick test",
  image: null,
  scheduledTime: new Date(Date.now() + 60000) // 1 minute from now
});
```

### Common Issues

| Issue | Solution |
|-------|----------|
| **"ERR_REDIS_CONNECTION"** | Ensure Redis is running; check `redis-cli ping` |
| **"Message not found"** | Database sync issue; check MongoDB connection |
| **Modal not opening** | Check browser console for errors; verify `ScheduleModal` import |
| **Job stuck in queue** | Check worker logs; may need manual job cleanup via Redis CLI |
| **Message not sent** | Check if receiver is online; retry logic will attempt 5 times |

## 🚀 Performance Tips

1. **Base64 Optimization**: Images are compressed to 50MB max; consider smaller images
2. **Batch Scheduling**: Stagger scheduled times to avoid thundering herd
3. **Redis Memory**: Monitor with `redis-cli INFO memory`
4. **Database Indexes**: Scheduled messages query uses indexed fields: `status`, `scheduledTime`

## 🧪 Future Enhancements

- [ ] Edit scheduled message before send
- [ ] 5-minute pre-send notification
- [ ] Recurring scheduled messages (cron-based)
- [ ] Message template scheduling
- [ ] Bulk schedule operations
- [ ] Schedule message statistics/analytics

## 📚 Documentation References

- [BullMQ Docs](https://docs.bullmq.io)
- [Redis Documentation](https://redis.io/docs/)
- [react-datepicker](https://reactdatepicker.com)
- [Socket.IO Events Guide](https://socket.io/docs/v4/emitting-events/)

## 🤝 Support

For issues or questions:
1. Check logs in Backend and Frontend consoles
2. Verify Redis connectivity
3. Ensure all dependencies are installed
4. Check that `.env` file has correct configuration
5. Review the edge cases section above

---

**Feature Status**: ✅ Production Ready

Last Updated: February 14, 2026
