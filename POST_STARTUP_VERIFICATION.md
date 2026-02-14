# ✅ Post-Startup Verification Checklist

Run this after starting the application to confirm scheduled messages are working correctly.

## 🟢 Backend Verification Checklist

### Step 1: Check Backend Logs
After starting backend with `npm run dev`, you should see:

```
✅ "[Redis] Connected to Redis"
✅ "[MessageQueue] Queue initialized"
✅ "server is running on PORT:5000"
✅ Socket.io server initialized
```

**If missing:**
- ❌ Redis not running → Run `redis-server` in Terminal 3
- ❌ REDIS_HOST/PORT wrong → Check Backend/.env
- ❌ Port 5000 in use → Kill process or change PORT in .env

---

### Step 2: Test Redis Connection
In a new terminal, run:
```bash
redis-cli ping
```

**Expected Output:**
```
PONG
```

**If fails:**
- Restart Redis server
- Check REDIS_HOST and REDIS_PORT are correct

---

### Step 3: Check API Endpoints
Use curl or Postman to test:

```bash
# Test backend is running
curl http://localhost:5000/

# Expected: Should connect (no error)
```

---

## 🟢 Frontend Verification Checklist

### Step 1: Check Frontend Console
Open Browser DevTools (F12) → Console tab

**Expected:**
- ✅ No red errors
- ✅ Socket.io connected message
- ✅ Store initialized

**If you see errors:**
- Clear browser cache: Ctrl+Shift+Delete
- Hard refresh: Ctrl+Shift+R (or Cmd+Shift+R on Mac)

---

### Step 2: Check UI Elements
1. Open chat with a user
2. Look for **⏰ clock icon** in:
   - ✅ Chat message input area (next to send button)
   - ✅ Chat header (top-right area)

**If missing:**
- Close browser and reopen http://localhost:5173
- Check for console errors (F12)

---

### Step 3: Test Modal Opens
1. Click the ⏰ clock icon
2. A modal should appear with:
   - ✅ Date picker (calendar)
   - ✅ Time input field
   - ✅ "Schedule" button
   - ✅ Dark background

**If modal doesn't open:**
- F12 → Console: Check for errors
- Verify ScheduleModal.jsx exists
- Restart frontend: `npm run dev`

---

## 🟢 Feature Verification Checklist

### Test 1: Schedule a Message (Basic)
**Scenario**: Send message scheduled for 30 seconds from now

1. **In Chat Window:**
   - Type: `"Hello scheduled world"`
   - Click ⏰ clock icon
2. **In Modal:**
   - Click calendar icon, select **Today**
   - Set time to **now + 30 seconds**
   - Click **Schedule** button
3. **Check Message:**
   - Message appears **greyed out** ✅
   - Shows **⏰ clock icon** ✅
   - Says "Scheduled for [time] UTC" ✅
4. **After 30 seconds:**
   - Message **automatically turns normal** ✅
   - Status changes to **"sent"** ✅

**Result: ✅ PASS** or ❌ Review backend logs for errors

---

### Test 2: Cancel Scheduled Message
**Scenario**: Cancel a scheduled message before it sends

1. **Schedule a message** for 5 minutes from now (use Test 1)
2. **Right-click** on the greyed-out message
3. **Click "Cancel Schedule"**
4. **Verify:**
   - Message shows **strikethrough** ✅
   - Status says **"cancelled"** ✅
   - Greyed out appearance remains ✅

**Result: ✅ PASS** or ❌ Check browser console for errors

---

### Test 3: View Scheduled in Profile
**Scenario**: See all scheduled messages in profile

1. **Click "Profile"** button (top-right)
2. **Scroll down** to "Scheduled Messages" section
3. **Verify:**
   - Section title appears ✅
   - Lists pending messages ✅
   - Shows receiver name ✅
   - Shows scheduled time ✅
   - Has "Cancel" button ✅

**Result: ✅ PASS** or ❌ Check if ScheduledMessagesSection.jsx exists

---

### Test 4: Multi-User Real-time
**Scenario**: Schedule shows for both users in real-time

**Setup two browser windows:**
- Window 1: Logged in as User A
- Window 2: Logged in as User B

1. **Window 1**: Schedule message to User B for 45 seconds
2. **Check Window 1:**
   - Message shows greyed-out ✅
3. **Check Window 2:**
   - New scheduled message notification appears ✅ (optional: depends on socket setup)
4. **After 45 seconds in both windows:**
   - Message appears as "sent" ✅

**Result: ✅ PASS** (if both see it) or ⚠️ Check socket event emissions

---

### Test 5: Server Restart Recovery
**Scenario**: Scheduled messages survive server restart

1. **Schedule** a message for 3 minutes from now
2. **Verify** it appears greyed-out
3. **Restart backend:**
   - Press Ctrl+C in Terminal 1
   - Wait 2 seconds
   - Run `npm run dev` again
4. **Verify:**
   - Message still shows as scheduled ✅
   - Status unchanged ✅
   - Will still deliver at scheduled time ✅

**Result: ✅ PASS** - Jobs persisted in Redis

---

## 🟠 Optional: Advanced Verification

### Check Database Records
```bash
# Connect to MongoDB (use your MongoDB client)

# Query scheduled messages
db.messages.find({ status: "scheduled" })

# Should return all pending scheduled messages with:
# - _id, senderId, receiverId, status: "scheduled"
# - scheduledTime, jobId, createdAt
```

---

### Monitor Queue in Redis
```bash
redis-cli

# List all keys
KEYS *

# Should show keys with pattern: bull:messageQueue:...

# Get job count
LLEN bull:messageQueue:wait

# Monitor real-time activity
MONITOR
```

---

### Check Browser Network Tab
1. Open DevTools (F12) → Network tab
2. Schedule a message
3. Look for requests:
   - ✅ POST `/api/messages/schedule/:id` - 201 Created
   - ✅ Socket event: `messageScheduled`

---

## 🚨 Troubleshooting Matrix

If a test **FAILS**, use this guide:

| Issue | Symptoms | Solution |
|-------|----------|----------|
| **Redis not connected** | Backend logs show Redis error | Run `redis-server`, check .env REDIS_HOST/PORT |
| **Modal doesn't open** | Clock icon clicked, nothing happens | F12 Console check, verify ScheduleModal.jsx exists |
| **Message not greyed out** | Scheduled message looks normal | Check ChatContainer.jsx, restart frontend |
| **Message doesn't deliver** | Stays greyed-out after time | Check backend logs, verify receiver online |
| **Right-click no context menu** | Can't see cancel option | Browser might block context menu, use delete key |
| **Profile section missing** | No scheduled messages in profile | Verify ProfilePage.jsx imports ScheduledMessagesSection |
| **Real-time not working** | Other user doesn't see schedule immediately | Check Socket.io connection, verify socket listener setup |
| **"Cannot find module" error** | npm/dependency error | Run `npm install` in Backend or Frontend |

---

## ✅ Success Criteria Checklist

Print this out and check each box:

- [ ] Backend starts with "Redis Connected" log
- [ ] Frontend loads without console errors
- [ ] Clock icon visible in chat
- [ ] Schedule modal opens and closes smoothly
- [ ] Can schedule message for 30 seconds ahead
- [ ] Scheduled message appears greyed-out
- [ ] Message automatically sends after 30 seconds
- [ ] Message turns normal color after sending
- [ ] Can right-click and cancel scheduled message
- [ ] Profile shows scheduled messages section
- [ ] Can cancel from profile section
- [ ] Server restart preserves scheduled messages
- [ ] Multi-user real-time works (optional)

**If all checked: ✅ FEATURE COMPLETE**

---

## 🎓 Understanding Message Timeline

```
T=0s        User clicks "Schedule" with scheduledTime=now+30s
├─ Message created with status="scheduled"
├─ BullMQ job enqueued with 30s delay
└─ Socket event sent to sender

T=0-30s     Message displayed greyed-out in UI
            Job waiting in Redis queue
            Receiver doesn't see it yet (optional)

T=30s       BullMQ worker triggers
├─ Message status → "sent"
├─ deliveredAt ← current timestamp
├─ Socket event "scheduledMessageSent" emitted
└─ Receiver gets message

T=30+s      Message appears normal (sent) in both UIs
            Perfect! ✅
```

---

## 📞 Quick Support Guide

**"Message scheduled but didn't send"**
→ Check backend logs: Worker triggered? Redis queue running?

**"Can't see scheduled in profile"**
→ Navigate to profile after scheduling, might need page refresh

**"Times are wrong/confusing"**
→ Remember: Internally UTC, displayed in your timezone

**"Scheduled messages disappeared"**
→ Redis flushed? Check with `redis-cli DBSIZE`

---

## 📝 Notes Section

Use this space to document your setup:

```
Backend URL: _________________________
Frontend URL: _________________________
Redis Host: _________________________
Redis Port: _________________________
Database: _________________________
Issues Found: _________________________
```

---

**Checklist Created**: [date]
**Test Started**: [time]
**Result**: ✅ PASS / ❌ FAIL
**Notes**: _______________________________________________

---

For detailed help, see:
- [SCHEDULED_MESSAGES_SETUP.md](SCHEDULED_MESSAGES_SETUP.md) - Full setup guide
- [API_REFERENCE.md](API_REFERENCE.md) - API details
- [SCHEDULED_MESSAGES_QUICKSTART.md](SCHEDULED_MESSAGES_QUICKSTART.md) - Quick start
