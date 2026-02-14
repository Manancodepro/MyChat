# 🚀 Scheduled Messages - Quick Start Checklist

## ✅ Pre-Flight Setup (5 minutes)

### 1. Install Redis
Choose ONE of these methods:

**Docker (Easiest):**
```bash
docker run -d -p 6379:6379 redis:latest
```

**Homebrew (macOS):**
```bash
brew install redis && brew services start redis
```

**WSL/Linux:**
```bash
sudo apt-get install redis-server && redis-server
```

**Verify Redis:**
```bash
redis-cli ping
# Should output: PONG
```

### 2. Install Dependencies

**Backend:**
```bash
cd Backend
npm install
```

**Frontend:**
```bash
cd Frontend
npm install
```

### 3. Configure Environment

Update `Backend/.env`:
```
REDIS_HOST=localhost
REDIS_PORT=6379
```

## 🚀 Start Application (3 steps, 3 terminals)

### Terminal 1 - Backend
```bash
cd Backend
npm run dev
```
✅ Wait for: `[Redis] Connected to Redis`

### Terminal 2 - Frontend
```bash
cd Frontend  
npm run dev
```
✅ Wait for: `Local: http://localhost:5173`

### Terminal 3 - Redis (if not using Docker)
```bash
redis-server
```

## 🎯 Test the Feature (2 minutes)

### 1. Open Two Browser Windows
- **Window 1**: http://localhost:5173 (logged in as User1)
- **Window 2**: http://localhost:5173 (logged in as User2)

### 2. Test Schedule in Window 1
1. Select a chat with a user
2. Type: `"Test scheduled message"`
3. Click ⏰ clock icon in input or header
4. Select **Today** date
5. Set time to **2 minutes from now**
6. Click **Schedule**

✅ Expected: Message appears as **greyed-out** with clock icon

### 3. Verify Delivery
- Wait 2+ minutes
- **Message automatically becomes "sent"** and turns normal color
- Check backend logs for: `[MessageQueue] Successfully sent scheduled message`

### 4. Test Cancellation (Optional)
1. Schedule another message for 5 minutes from now
2. **Right-click** on the message
3. Click **Cancel Schedule**
4. Verify message status changes to **"cancelled"** (strikethrough)

### 5. View All Scheduled (Optional)
1. Click **Profile** in top-right
2. Scroll down to **Scheduled Messages** section
3. See all your pending scheduled messages

## 🐛 Troubleshooting

### Redis Connection Error
```
Error: connect ECONNREFUSED

Solution:
1. Check Redis is running: redis-cli ping
2. Verify REDIS_HOST and REDIS_PORT in .env
3. Default: localhost:6379
```

### Module Not Found: bullmq
```
Error: Cannot find module 'bullmq'

Solution:
cd Backend
npm install bullmq redis
```

### Message Not Sending After Time
```
Error: Message stays "scheduled" after time passes

Solution:
1. Check Backend logs for worker errors
2. Verify Redis connection
3. Check if receiver is still connected
4. Try cancel and reschedule
```

### Modal Doesn't Open
```
Error: Clock icon clicked but nothing happens

Solution:
1. Open browser Developer Tools (F12)
2. Check Console tab for JavaScript errors
3. Verify ScheduleModal import in ChatHeader.jsx
```

## 📊 Quick Stats

| Component | Status | File |
|-----------|--------|------|
| Backend endpoints | ✅ 3 new | `message.routes.js` |
| Frontend modal | ✅ Complete | `ScheduleModal.jsx` |
| Database model | ✅ Updated | `message.model.js` |
| BullMQ queue | ✅ Setup | `messageQueue.js` |
| Redis service | ✅ Required | External service |
| Socket events | ✅ 3 new | `useChatStore.js` |

## 🎓 Key Files Changed

```
Backend/
  ✨ NEW:
    - src/lib/messageQueue.js
    - src/lib/redis.js
  📝 MODIFIED:
    - src/index.js (queue init + shutdown)
    - src/models/message.model.js (new fields)
    - src/controllers/message.controller.js (3 new handlers)
    - src/routes/message.routes.js (3 new endpoints)
    - package.json (bullmq, redis)

Frontend/
  ✨ NEW:
    - src/components/ScheduleModal.jsx
    - src/components/ScheduledMessagesSection.jsx
  📝 MODIFIED:
    - src/components/ChatHeader.jsx (clock icon)
    - src/components/MessageInput.jsx (clock button)
    - src/components/ChatContainer.jsx (display + cancel)
    - src/pages/ProfilePage.jsx (add section)
    - src/store/useChatStore.js (schedule functions)
    - package.json (date-fns, react-datepicker)

📚 NEW:
  - SCHEDULED_MESSAGES_SETUP.md (full documentation)
  - SCHEDULED_MESSAGES_QUICKSTART.md (this file)
```

## 💡 Pro Tips

1. **Test with small delays**: Set schedule for 10 seconds to quickly test
2. **Check browser DevTools Network tab**: Watch the socket events in real-time
3. **Monitor Redis**: Use `redis-cli MONITOR` to see queue activity
4. **Use UTC**: Always schedule in UTC; frontend converts for display
5. **Multi-device**: Schedule on one device, verify delivery on another

## 🔗 Next Steps

### After Verification
- [ ] Read full docs: [SCHEDULED_MESSAGES_SETUP.md](SCHEDULED_MESSAGES_SETUP.md)
- [ ] Deploy to production with proper Redis setup
- [ ] Monitor BullMQ queue health
- [ ] Consider implementing time zone preferences

### Optional Enhancements
- [ ] Add notification 5 minutes before send
- [ ] Implement message templates
- [ ] Add scheduling analytics
- [ ] Support recurring messages

## ✨ Feature Summary

| Feature | Status |
|---------|--------|
| Schedule messages | ✅ Ready |
| Cancel scheduled | ✅ Ready |
| View pending | ✅ Ready |
| Real-time updates | ✅ Ready |
| Auto-retry (5x) | ✅ Ready |
| UTC time handling | ✅ Ready |
| Server restart recovery | ✅ Ready |

---

**Ready to go!** Follow the 3-step startup above and test in 5 minutes. 🎉

Need help? Check the full setup guide or review troubleshooting section above.
