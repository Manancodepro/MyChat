# 📌 Scheduled Messages - API Reference

## Base URL
```
http://localhost:5000/api/messages
```

## Authentication
All endpoints require `Authorization: Bearer <token>` header.

---

## 🎯 Endpoints

### 1. Schedule a Message
**POST** `/schedule/:id`

Schedule a message to be sent at a future time.

**URL Parameters:**
- `id` (string, required) - Recipient user ID

**Request Body:**
```json
{
  "text": "Hello! This message will be sent later",
  "image": "data:image/png;base64,...",
  "scheduledTime": "2024-01-20T15:30:00Z"
}
```

**Response - 201 Created:**
```json
{
  "success": true,
  "message": {
    "_id": "msg_123abc",
    "senderId": "user_456",
    "receiverId": "user_789",
    "text": "Hello! This message will be sent later",
    "image": "https://res.cloudinary.com/...",
    "status": "scheduled",
    "scheduledTime": "2024-01-20T15:30:00Z",
    "jobId": "job_xyz789",
    "createdAt": "2024-01-20T12:00:00Z"
  }
}
```

**Error - 400 Bad Request:**
```json
{
  "success": false,
  "error": "Scheduled time must be in the future"
}
```

**Error - 404 Not Found:**
```json
{
  "success": false,
  "error": "Recipient user not found"
}
```

**curl Example:**
```bash
curl -X POST http://localhost:5000/api/messages/schedule/user_456 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Meeting at 3pm",
    "scheduledTime": "2024-01-25T14:30:00Z"
  }'
```

---

### 2. Cancel Scheduled Message
**DELETE** `/cancel/:messageId`

Cancel a scheduled message before it's sent.

**URL Parameters:**
- `messageId` (string, required) - Message ID to cancel

**Response - 200 OK:**
```json
{
  "success": true,
  "message": {
    "_id": "msg_123abc",
    "text": "Hello! This message will be sent later",
    "status": "cancelled",
    "cancelledAt": "2024-01-20T12:05:00Z"
  }
}
```

**Error - 404 Not Found:**
```json
{
  "success": false,
  "error": "Message not found"
}
```

**Error - 403 Forbidden:**
```json
{
  "success": false,
  "error": "You can only cancel your own messages"
}
```

**Error - 400 Bad Request:**
```json
{
  "success": false,
  "error": "Cannot cancel a message that is not scheduled"
}
```

**curl Example:**
```bash
curl -X DELETE http://localhost:5000/api/messages/cancel/msg_123abc \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 3. Get All Scheduled Messages
**GET** `/scheduled/list`

Retrieve all pending scheduled messages for the current user.

**Query Parameters:**
None

**Response - 200 OK:**
```json
{
  "success": true,
  "messages": [
    {
      "_id": "msg_123abc",
      "senderId": "user_456",
      "receiverId": "user_789",
      "receiverName": "Alice Johnson",
      "text": "Team standup tomorrow at 9am",
      "image": null,
      "status": "scheduled",
      "scheduledTime": "2024-01-21T08:00:00Z",
      "createdAt": "2024-01-20T10:30:00Z",
      "timeUntilSend": "23h 30m"
    },
    {
      "_id": "msg_456def",
      "senderId": "user_456",
      "receiverId": "user_654",
      "receiverName": "Bob Smith",
      "text": "Happy Birthday!",
      "image": "https://res.cloudinary.com/...",
      "status": "scheduled",
      "scheduledTime": "2024-01-22T00:00:00Z",
      "createdAt": "2024-01-20T09:15:00Z",
      "timeUntilSend": "1d 12h"
    }
  ]
}
```

**Sort Order:** By `scheduledTime` (ascending - next scheduled first)

**curl Example:**
```bash
curl http://localhost:5000/api/messages/scheduled/list \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📡 Socket Events

These real-time events are emitted through Socket.io when scheduling operations occur.

### Server → Client Events

#### `messageScheduled`
Emitted when a message is successfully scheduled.

**Payload:**
```javascript
{
  messageId: "msg_123abc",
  status: "scheduled",
  scheduledTime: "2024-01-20T15:30:00Z",
  receiver: {
    id: "user_789",
    name: "Alice"
  }
}
```

#### `messageCancelled`
Emitted when a scheduled message is cancelled.

**Payload:**
```javascript
{
  messageId: "msg_123abc",
  status: "cancelled",
  cancelledBy: "user_456"  // Sender who cancelled
}
```

#### `scheduledMessageSent`
Emitted when a scheduled message is automatically delivered.

**Payload:**
```javascript
{
  messageId: "msg_123abc",
  status: "sent",
  deliveredAt: "2024-01-20T15:30:15Z",
  receiver: {
    id: "user_789",
    name: "Alice"
  }
}
```

#### `newMessage`
Regular message received (applies to scheduled too when delivered).

**Payload:**
```javascript
{
  _id: "msg_123abc",
  sender: { id: "user_456", name: "Bob", image: "..." },
  receiver: "user_789",
  text: "Scheduled and delivered!",
  image: null,
  status: "sent",
  createdAt: "2024-01-20T12:00:00Z",
  deliveredAt: "2024-01-20T15:30:15Z"
}
```

---

## 🔄 Message Status Flow

```
User schedules message
        ↓
[SCHEDULED] status in DB, BullMQ job enqueued
        ↓
Wait for scheduledTime
        ↓
BullMQ worker triggers (with auto-retry)
        ↓
Status updates to [SENT], deliveredAt timestamp added
        ↓
Socket events emitted to both parties
        ↓
Message displays with "sent" appearance to receiver


Alternative path - Cancellation:
[SCHEDULED] message
        ↓
User clicks cancel before time
        ↓
BullMQ job removed from queue
        ↓
Status updates to [CANCELLED]
        ↓
Socket event emitted
        ↓
Message displays with strikethrough appearance
```

---

## ⏱️ Timing Details

### Scheduled Time Format
- **Format**: ISO 8601 UTC (e.g., `2024-01-20T15:30:00Z`)
- **Timezone**: All times in UTC internally
- **Frontend Conversion**: Automatically converts to user's local timezone for display

### Delivery Window
- **Exact Time**: Message delivered within 1 second of scheduledTime
- **Precision**: Depends on BullMQ worker frequency (~100ms checks)
- **Max Delay**: System restart? Jobs persisted in Redis, re-queued on startup

### Time Validation
- **Minimum**: Must be at least 1 minute in the future
- **Maximum**: No limit (can schedule years ahead)
- **Past Dates**: Rejected with error message

---

## 🚨 Error Codes

| Code | Meaning | Solution |
|------|---------|----------|
| 400 | Bad Request | Check request format, ensure future scheduledTime |
| 401 | Unauthorized | Provide valid JWT token in header |
| 403 | Forbidden | Can only modify your own messages |
| 404 | Not Found | Message/recipient doesn't exist |
| 500 | Server Error | Check backend logs, restart server |

---

## 📊 Rate Limiting

Currently **no rate limits** implemented. For production:
- Consider limiting to 50 scheduled messages per user
- Consider limiting to 5 schedules per minute per user
- Implement with express-rate-limit middleware

---

## 🧪 Testing Examples

### Schedule with JavaScript (Frontend):
```javascript
const scheduleMessage = async (recipientId, text, scheduledTime) => {
  const response = await fetch('/api/messages/schedule/' + recipientId, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    body: JSON.stringify({
      text,
      scheduledTime
    })
  });
  return await response.json();
};

// Usage:
const futureTime = new Date();
futureTime.setMinutes(futureTime.getMinutes() + 30);
await scheduleMessage('user_123', 'See you later!', futureTime.toISOString());
```

### Schedule with JavaScript (Test):
```javascript
// Schedule for 2 minutes from now
const now = new Date();
const in2Minutes = new Date(now.getTime() + 2 * 60000);
const scheduledTime = in2Minutes.toISOString();

console.log('Scheduling for:', scheduledTime);
```

### Check Redis Queue Status:
```bash
# Connect to Redis CLI
redis-cli

# List all active jobs
KEYS *

# Get job details
GET bull:messageQueue:job:123

# Monitor real-time activity
MONITOR
```

---

## 🔐 Security Considerations

1. **Authorization Check**: Verified on every endpoint
2. **Ownership Validation**: Can only cancel your own messages
3. **Timestamp Validation**: Prevents scheduling in past
4. **Input Sanitization**: Text and images validated before storage
5. **Token Expiry**: JWT tokens expire per auth.middleware

---

## 📈 Performance Notes

- **Database Query**: Scheduled messages indexed on `(status, scheduledTime)`
- **Queue Memory**: Redis stores job metadata (not full message)
- **Worker Frequency**: Checks for due jobs every 100ms
- **Retry Policy**: 5 attempts with exponential backoff (2s, 4s, 8s, 16s, 32s)
- **Max Payload**: 50MB for images as base64

---

## 🔗 Related Documentation

- Full Setup: [SCHEDULED_MESSAGES_SETUP.md](SCHEDULED_MESSAGES_SETUP.md)
- Quick Start: [SCHEDULED_MESSAGES_QUICKSTART.md](SCHEDULED_MESSAGES_QUICKSTART.md)
- Architecture: See Backend section in SCHEDULED_MESSAGES_SETUP.md

---

**Last Updated**: Version 1.0
**Status**: Production Ready ✅
