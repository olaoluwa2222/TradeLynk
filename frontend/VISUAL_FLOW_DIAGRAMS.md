# 📊 VISUAL MESSAGE & NOTIFICATION FLOW CHARTS

## 🔄 MESSAGE SENDING FLOW (Detailed)

```
┌─────────────────────────────────────────────────────────────────────┐
│                        USER SENDS MESSAGE                           │
│                      "Hello, are you there?"                        │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         ▼
        ┌────────────────────────────────┐
        │  ChatInput.tsx                 │
        │  User clicks Send              │
        │  onSend(message, [])           │
        └────────────┬───────────────────┘
                     │
                     ▼
        ┌────────────────────────────────┐
        │  ConversationView.tsx          │
        │  handleSendMessage()           │
        │  sendMessage(content, [])      │
        └────────────┬───────────────────┘
                     │
                     ▼
        ┌────────────────────────────────┐
        │  useChat Hook                  │
        │  sendMessage(content, [])      │
        │                                │
        │  Validation:                   │
        │  ✓ chatId exists?              │
        │  ✓ content not empty?          │
        │  ✓ currentUserId set?          │
        │                                │
        │  Log: 📤 Sending via API       │
        └────────────┬───────────────────┘
                     │
                     ▼
        ┌────────────────────────────────┐
        │  chatService.ts                │
        │  sendMessage()                 │
        │                                │
        │  Call: chatsApi.sendMessage({  │
        │    chatId,                     │
        │    content,                    │
        │    imageUrls                   │
        │  })                            │
        │                                │
        │  Log: 📤 Sending message       │
        └────────────┬───────────────────┘
                     │
                     ▼
        ┌────────────────────────────────────────────┐
        │  lib/api.ts                                │
        │  chatsApi.sendMessage()                    │
        │                                            │
        │  HTTP POST Request:                        │
        │  └─ URL: /api/v1/chats/messages           │
        │  └─ Method: POST                           │
        │  └─ Body: { chatId, content, imageUrls }   │
        │  └─ Auth: Bearer {token}                   │
        │  └─ Timeout: 10 seconds                    │
        └────────────┬────────────────────────────────┘
                     │
                     ▼
        ┌───────────────────────────────────────────────┐
        │  BACKEND API RECEIVES REQUEST                │
        │  POST /chats/messages                        │
        │                                              │
        │  Extract:                                    │
        │  - chatId = "chat_1_3_2"                   │
        │  - content = "Hello, are you there?"       │
        │  - senderId = 3 (from auth)                │
        │  - senderName = "John Doe"                 │
        │  - timestamp = 1732465320000               │
        └────────────┬────────────────────────────────┘
                     │
          ┌──────────┴──────────┬──────────────┐
          │                     │              │
          ▼                     ▼              ▼
    ┌──────────────┐    ┌───────────────┐  ┌────────────┐
    │ SUPABASE     │    │ FIREBASE RTDB │  │ FCM NOTIFY │
    │              │    │ (CRITICAL!)   │  │(IMPORTANT) │
    │ INSERT       │    │               │  │            │
    │ messages     │    │ WRITE to:     │  │ GET tokens │
    │ table        │    │ chats/{chatId}│  │ SEND FCM   │
    │              │    │ /messages/{id}│  │            │
    │ ✅ Status:  │    │               │  │ ❌ Status: │
    │ DONE         │    │ ❌ Status:    │  │ MISSING!   │
    │              │    │ MISSING!      │  │            │
    └──────────────┘    └───────────────┘  └────────────┘
          │                     │                  │
          │                     │                  │
          └─────────┬───────────┴──────────────────┘
                    │
                    ▼
         ┌──────────────────────────┐
         │ RETURN SUCCESS RESPONSE   │
         │ { success: true, data }   │
         └────────────┬─────────────┘
                      │
                      ▼
         ┌──────────────────────────────────────┐
         │ Frontend Waits for Firebase Listener │
         │                                      │
         │ Log: ⏳ Waiting for Firebase...    │
         └────────────┬─────────────────────────┘
                      │
         ┌────────────┴────────────┐
         │                         │
         ▼                         ▼
    ┌─────────────┐        ┌──────────────┐
    │ Firebase    │        │ Firebase     │
    │ writes msg  │        │ doesn't      │
    │ to RTDB     │        │ have msg     │
    │             │        │              │
    │ Listener    │        │ Periodic sync│
    │ fires!      │        │ catches it   │
    │             │        │ after 5s     │
    │ onChildAdded│        │              │
    │             │        │ (Fallback)   │
    │ 📨 Message  │        │              │
    │ received    │        │ Eventually   │
    │             │        │ appears      │
    └─────────────┘        └──────────────┘
         │                         │
         │ (Instant)              │ (After 5s)
         │ ~200-300ms             │ ~5 seconds
         │                         │
         └────────────┬────────────┘
                      │
                      ▼
         ┌────────────────────────────────┐
         │ Frontend Updates Messages State │
         │                                │
         │ setMessages([...prev, newMsg])  │
         │                                │
         │ Log: ✅ Adding new message     │
         └────────────┬───────────────────┘
                      │
                      ▼
         ┌────────────────────────────────┐
         │ React Re-renders ConversationView
         │                                │
         │ Maps through messages array    │
         │ For each message:              │
         │ - If isOwnMessage = true       │
         │   └─ RIGHT side (black)        │
         │ - If isOwnMessage = false      │
         │   └─ LEFT side (white/gray)    │
         │                                │
         │ MESSAGE VISIBLE TO USER! ✅   │
         └────────────────────────────────┘

TIME TO DISPLAY:
═══════════════════════════════════════════
✅ If backend writes to Firebase:
   User A sends → Backend saves → Firebase writes → Listener fires
   ~ 200-500ms total

❌ If backend doesn't write to Firebase:
   User A sends → Sits in UI until reload
   OR periodic sync picks up after 5 seconds
   ~ 5000ms total
```

---

## 📬 NOTIFICATION FLOW (Foreground)

```
┌─────────────────────────────────────────────┐
│  Message Arrives                            │
│  Backend sends FCM via Firebase Cloud       │
│  Messaging to device token                  │
└────────────────┬──────────────────────────────┘
                 │
                 ▼
      ┌──────────────────────────┐
      │  Firebase Cloud Messaging│
      │  Routes message to:      │
      │  Device Token: abc123... │
      │                          │
      │  Payload:                │
      │  {                       │
      │    notification: {       │
      │      title: "Message",   │
      │      body: "Hello!"      │
      │    },                    │
      │    data: {               │
      │      chatId: "chat_1_3_2"│
      │    }                     │
      │  }                       │
      └────────────┬─────────────┘
                   │
                   ▼
      ┌─────────────────────────────────────┐
      │ Browser Receives FCM (App OPEN)     │
      │                                     │
      │ onMessage handler triggers:         │
      │ (from notificationService.ts)       │
      └────────────┬────────────────────────┘
                   │
                   ▼
      ┌─────────────────────────────────────┐
      │ Extract Notification Data:          │
      │ - title = "New message from John"   │
      │ - body = "Hello!"                   │
      │ - chatId = "chat_1_3_2"             │
      │                                     │
      │ Log: 📬 Foreground message received │
      └────────────┬────────────────────────┘
                   │
                   ▼
      ┌─────────────────────────────────────┐
      │ Create Browser Notification:        │
      │                                     │
      │ new Notification(title, {           │
      │   body: body,                       │
      │   icon: "/favicon.ico",             │
      │   badge: "/badge.png",              │
      │   tag: chatId,                      │
      │   requireInteraction: false,        │
      │   data: { chatId, ... }             │
      │ })                                  │
      │                                     │
      │ Log: 🔔 Showing notification...     │
      └────────────┬────────────────────────┘
                   │
                   ▼
      ┌─────────────────────────────────────┐
      │ Browser Shows Notification:         │
      │                                     │
      │ ┌─────────────────────────────────┐│
      │ │ New message from John            ││
      │ │ Hello!                           ││
      │ │                                  ││
      │ │ [Click to open]                  ││
      │ └─────────────────────────────────┘│
      │                                     │
      │ Log: ✅ Notification shown!         │
      └────────────┬────────────────────────┘
                   │
                   ▼
      ┌──────────────────────────────────────┐
      │ User Clicks Notification (Optional)  │
      │                                      │
      │ notification.onclick = () => {       │
      │   window.location.href =             │
      │   `/chat?chatId=chat_1_3_2`         │
      │ }                                    │
      │                                      │
      │ Log: 👆 Notification clicked         │
      └──────────────────────────────────────┘
```

---

## 📱 NOTIFICATION FLOW (Background - Service Worker)

```
┌─────────────────────────────────────────────┐
│  Message Arrives                            │
│  App is in BACKGROUND (or closed)           │
│  Backend sends FCM to device token          │
└────────────────┬──────────────────────────────┘
                 │
                 ▼
      ┌──────────────────────────┐
      │  Firebase Cloud Messaging│
      │  Routes to browser       │
      │  (App is closed/bg)      │
      └────────────┬─────────────┘
                   │
                   ▼
      ┌──────────────────────────────────────┐
      │ Service Worker Wakes Up:             │
      │ (public/firebase-messaging-sw.js)    │
      │                                      │
      │ onBackgroundMessage handler fires:   │
      │                                      │
      │ messaging.onBackgroundMessage(       │
      │   (payload) => {                     │
      │     // Handle background message     │
      │   }                                  │
      │ )                                    │
      │                                      │
      │ Log: 🔧 Service Worker initialized   │
      └────────────┬────────────────────────┘
                   │
                   ▼
      ┌──────────────────────────────────────┐
      │ Extract Message Data:                │
      │ - title = notification.title         │
      │ - body = notification.body           │
      │ - chatId = data.chatId               │
      │                                      │
      │ Log: 🔔 Background message received  │
      └────────────┬────────────────────────┘
                   │
                   ▼
      ┌──────────────────────────────────────┐
      │ Service Worker Shows Notification:   │
      │                                      │
      │ self.registration.showNotification(  │
      │   title,                             │
      │   {                                  │
      │     body: body,                      │
      │     icon: "/favicon.ico",            │
      │     badge: "/badge.png",             │
      │     tag: chatId,                     │
      │     data: payload.data               │
      │   }                                  │
      │ )                                    │
      │                                      │
      │ Log: 📬 Showing notification         │
      │                                      │
      │ User sees DESKTOP NOTIFICATION ✅   │
      └────────────┬────────────────────────┘
                   │
                   ▼
      ┌──────────────────────────────────────┐
      │ User Clicks Desktop Notification:    │
      │                                      │
      │ self.addEventListener(               │
      │   'notificationclick',               │
      │   (event) => {                       │
      │     const chatId = event.notification
      │       .data.chatId                   │
      │     const url = `/chat?chatId=${...}`│
      │                                      │
      │     clients.matchAll()               │
      │     if (found existing window)       │
      │       focus existing window          │
      │     else                             │
      │       open new window                │
      │   }                                  │
      │ )                                    │
      │                                      │
      │ Log: 👆 Notification clicked         │
      │ Log: ✅ Focusing existing window     │
      │ OR                                   │
      │ Log: 📖 Opening new window           │
      └──────────────────────────────────────┘
                   │
                   ▼
      ┌──────────────────────────────────────┐
      │ Browser Opens/Focuses Chat Window    │
      │ URL: localhost:3000/chat?chatId=...  │
      │                                      │
      │ Chat conversation loads ✅           │
      └──────────────────────────────────────┘
```

---

## ❌ FAILURE SCENARIOS

### **Scenario 1: Message appears on Sender, not Receiver**

```
Sender (A)                          Receiver (B)
   │                                   │
   ├─→ Sends message                   │
   │   ✅ Appears immediately          │
   │   (optimistic update)             │
   │                                   │
   │                                   ├─→ NOT seeing message
   │                                   │   ❌ No notification
   │
   │◄─── Backend doesn't write to Firebase RTDB
        ↓
   │   Message exists in Supabase only
   │   Firebase has NO record
   │   Firebase listener never fires
   │   Receiver must reload to see (API fetch)

ROOT CAUSE: Backend missing this:
   await firebase.database().ref(`chats/${chatId}/messages/${id}`).set(...)
```

---

### **Scenario 2: Notification Works Once, Then Stops**

```
Time: T=0
├─→ User gets notification ✅
├─→ Device token in database: valid_token_xyz

Time: T=5 minutes
├─→ User doesn't get notification ❌
│   └─ Token still exists in database
│   └─ But backend can't send to it

POSSIBLE CAUSES:
1. Token expired (Firebase rejected it)
2. Browser cleared storage (forgot token)
3. Service worker unregistered
4. User revoked notification permission
5. Token not refreshing every 24 hours

SOLUTION:
Implement token refresh (added in notificationService.ts):
│
└─→ Every 24 hours, generate new token
└─→ Save new token to backend
└─→ This keeps notifications working long-term
```

---

### **Scenario 3: Notification Permission Never Asked**

```
User Opens App
   │
   ├─→ useChat.ts loads
   │   └─→ Calls initializeNotifications()
   │
   ├─→ initializeNotifications checks:
   │   └─→ if ('Notification' in window)
   │       └─→ if permission !== 'granted'
   │           └─→ Notification.requestPermission()
   │
   ├─→ Browser shows dialog:
   │   "localhost wants to show notifications"
   │   [Allow] [Block]
   │
   ├─→ User clicks "Block" ❌
   │   └─→ permission = 'denied'
   │   └─→ No further requests shown
   │
   └─→ To fix: User must:
       1. Click lock icon in address bar
       2. Change Notifications to "Allow"
       3. Refresh page
       4. Grant permission again

CONSOLE LOGS:
❌ "User denied notification permission"
   No further logs about notifications

If you see this:
Get user to manually enable in settings!
```

---

## 🎯 QUICK REFERENCE TABLE

| Scenario                 | Cause                                | Evidence                              | Fix                           |
| ------------------------ | ------------------------------------ | ------------------------------------- | ----------------------------- |
| **Real-time fails**      | Backend not writing to Firebase RTDB | No "📨 Firebase message received" log | Add Firebase write in backend |
| **Notification fails**   | Backend not sending FCM              | Token saved but no notification       | Add FCM send in backend       |
| **Notification stops**   | Token expires                        | Works first time, then stops          | Token refresh (now in place)  |
| **Permission denied**    | User clicked "Block"                 | Notification permission: "denied"     | User must enable in settings  |
| **Service worker fails** | Not registered                       | DevTools → Application → none shown   | Hard refresh (Ctrl+Shift+R)   |
| **Firebase rules block** | Rules too restrictive                | Firebase operations fail silently     | Adjust Firebase rules         |

---

Use these diagrams to trace exactly where your issue is! 🔍
