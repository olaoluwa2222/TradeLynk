# 🎯 BACKEND REQUIREMENTS - What Your Backend MUST Do

Based on analysis of your frontend code, here's **exactly** what your backend needs to do when a message is sent.

---

## 📨 MESSAGE FLOW (What Backend Must Implement)

### **When POST /chats/messages is called:**

```
┌──────────────────────────────────────────────────┐
│  Backend Receives: POST /chats/messages          │
│  Request Body:                                    │
│  {                                                │
│    "chatId": "chat_1_3_2",                      │
│    "content": "Hello!",                         │
│    "imageUrls": []                              │
│  }                                                │
└────────────────┬─────────────────────────────────┘
                 │
    ┌────────────┴────────────┐
    │                         │
    ▼                         ▼
┌──────────────┐      ┌──────────────────┐
│ STEP 1       │      │ STEP 2           │
│              │      │ (CRITICAL!)      │
│ Save to      │      │ Write to         │
│ Supabase     │      │ Firebase RTDB    │
│ (Already     │      │ (MISSING!)       │
│  doing this) │      │                  │
└──────────────┘      └────────┬─────────┘
    ✅                         │
                               ▼
                        ┌──────────────────┐
                        │ STEP 3           │
                        │ Send FCM         │
                        │ Notification     │
                        │ (MISSING!)       │
                        └──────────────────┘
                              ✅
```

---

## 🔥 STEP 1: What You're Probably Already Doing

### Save to Supabase

```sql
-- Your current code probably does something like:
INSERT INTO messages (
  id,
  chat_id,
  sender_id,
  content,
  image_urls,
  timestamp,
  read
) VALUES (
  'msg-12345',
  'chat_1_3_2',
  3,
  'Hello!',
  '[]',
  1732465320000,
  false
);
```

✅ **This is good! Keep doing this.**

---

## 🚨 STEP 2: CRITICAL - Write to Firebase RTDB

### This is what's MISSING

**Why it's critical:**

- Frontend has a real-time listener on `chats/{chatId}/messages`
- When backend writes here, Firebase sends instant update to all connected clients
- **If you don't do this → Messages won't appear in real-time!**

### **Example Implementation (Node.js/JavaScript):**

```typescript
// Backend - After saving to Supabase, ALSO write to Firebase

import * as admin from "firebase-admin";

export async function sendMessage(
  chatId: string,
  senderId: number,
  senderName: string,
  content: string,
  imageUrls: string[] = []
) {
  // ✅ STEP 1: Save to Supabase
  const supabaseResponse = await supabase
    .from("messages")
    .insert({
      chat_id: chatId,
      sender_id: senderId,
      sender_name: senderName,
      content: content,
      image_urls: imageUrls,
      timestamp: Date.now(),
      read: false,
    })
    .select()
    .single();

  const messageId = supabaseResponse.data.id;
  console.log("✅ Message saved to Supabase:", messageId);

  // 🔥 STEP 2: CRITICAL - Write to Firebase RTDB
  const firebaseRef = admin
    .database()
    .ref(`chats/${chatId}/messages/${messageId}`);

  await firebaseRef.set({
    senderId: senderId,
    senderName: senderName,
    content: content,
    imageUrls: imageUrls || [],
    timestamp: Date.now(),
    read: false,
  });

  console.log("🔥 Message written to Firebase RTDB:", messageId);

  // 🚀 STEP 3: Send FCM Notifications
  await sendNotifications(chatId, senderId, senderName, content);

  return {
    success: true,
    data: {
      id: messageId,
      senderId: senderId,
      content: content,
      timestamp: Date.now(),
    },
  };
}
```

### **Key Points:**

```typescript
// Firebase path structure MUST match frontend listener:
// Frontend listens to: chats/{chatId}/messages
// So backend must write to: chats/{chatId}/messages/{messageId}

const firebaseRef = admin
  .database()
  .ref(`chats/${chatId}/messages/${messageId}`);

// Message object MUST have these fields:
const messageData = {
  senderId: number,              // ✅ Required
  senderName: string,            // ✅ Required
  content: string,               // ✅ Required
  timestamp: number,             // ✅ Required
  imageUrls: string[],           // Optional
  read: boolean,                 // Optional (default: false)
  readAt: number                 // Optional
};

await firebaseRef.set(messageData);
```

---

## 🔔 STEP 3: Send FCM Notifications

### After writing to Firebase, send notifications

**Why:**

- User might not be looking at chat window
- Or app might be closed
- Notification will alert them about new message

### **Implementation:**

```typescript
async function sendNotifications(
  chatId: string,
  senderIdWhoSent: number,
  senderName: string,
  messageContent: string
) {
  try {
    // Step 1: Get the other user in this chat
    // (The recipient of the message)
    const chat = await supabase
      .from("chats")
      .select("buyer_id, seller_id")
      .eq("id", chatId)
      .single();

    const senderId = senderIdWhoSent;
    const recipientId =
      chat.data.buyer_id === senderId
        ? chat.data.seller_id
        : chat.data.buyer_id;

    console.log("📬 Sending notification to user:", recipientId);

    // Step 2: Get recipient's device tokens from your database
    const tokensResponse = await supabase
      .from("device_tokens")
      .select("device_token")
      .eq("user_id", recipientId);

    const deviceTokens =
      tokensResponse.data
        ?.map((row) => row.device_token)
        .filter((token) => token) || [];

    console.log(
      `🔔 Found ${deviceTokens.length} device tokens for user ${recipientId}`
    );

    if (deviceTokens.length === 0) {
      console.log("⚠️ No device tokens found for recipient, skipping FCM");
      return;
    }

    // Step 3: Prepare FCM message
    const fcmMessage = {
      notification: {
        title: `New message from ${senderName}`,
        body: messageContent.substring(0, 100), // First 100 chars
      },
      data: {
        chatId: chatId,
        senderId: String(senderId),
        senderName: senderName,
      },
    };

    console.log("📤 FCM Message to send:", fcmMessage);

    // Step 4: Send to all device tokens
    const response = await admin.messaging().sendMulticast({
      tokens: deviceTokens,
      notification: fcmMessage.notification,
      data: fcmMessage.data,
    });

    console.log("✅ FCM Send Result:", {
      successCount: response.successCount,
      failureCount: response.failureCount,
      responses: response.responses.map((r) => ({
        success: r.success,
        messageId: r.messageId,
        error: r.error?.message,
      })),
    });

    // Step 5: Handle failed tokens (remove invalid ones)
    const failedTokens = [];
    response.responses.forEach((resp, idx) => {
      if (!resp.success && resp.error) {
        const error = resp.error;
        // If token is invalid, mark for deletion
        if (
          error.code === "messaging/invalid-registration-token" ||
          error.code === "messaging/registration-token-not-registered"
        ) {
          failedTokens.push(deviceTokens[idx]);
          console.warn("🗑️ Removing invalid token:", deviceTokens[idx]);
        }
      }
    });

    // Delete failed tokens from database
    if (failedTokens.length > 0) {
      await supabase
        .from("device_tokens")
        .delete()
        .in("device_token", failedTokens);
      console.log("✅ Removed", failedTokens.length, "invalid tokens");
    }
  } catch (error) {
    console.error("❌ Error sending FCM notifications:", error);
    // Don't throw - notification failure shouldn't block message delivery
  }
}
```

---

## 📋 Complete Backend Endpoint (Full Example)

```typescript
// Backend POST /chats/messages endpoint

import * as admin from "firebase-admin";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export async function postChatMessage(req, res) {
  try {
    const { chatId, content, imageUrls } = req.body;
    const currentUserId = req.user.id; // From auth middleware
    const userName = req.user.name;

    // ✅ Validation
    if (!chatId || !content?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Missing chatId or content",
      });
    }

    console.log("📨 Received message:", { chatId, userId: currentUserId });

    // ✅ STEP 1: Save to Supabase
    const { data: messageData, error: dbError } = await supabase
      .from("messages")
      .insert({
        chat_id: chatId,
        sender_id: currentUserId,
        sender_name: userName,
        content: content,
        image_urls: imageUrls || [],
        timestamp: Date.now(),
        read: false,
      })
      .select()
      .single();

    if (dbError) {
      console.error("❌ Database error:", dbError);
      return res.status(500).json({
        success: false,
        message: "Failed to save message",
      });
    }

    const messageId = messageData.id;
    console.log("✅ Message saved to Supabase:", messageId);

    // 🔥 STEP 2: CRITICAL - Write to Firebase RTDB
    try {
      const firebaseRef = admin
        .database()
        .ref(`chats/${chatId}/messages/${messageId}`);

      await firebaseRef.set({
        senderId: currentUserId,
        senderName: userName,
        content: content,
        imageUrls: imageUrls || [],
        timestamp: Date.now(),
        read: false,
      });

      console.log("🔥 Message written to Firebase RTDB:", messageId);
    } catch (firebaseError) {
      console.error("❌ Firebase RTDB error:", firebaseError);
      // Still respond success since message is saved to DB
      // but log this for debugging
    }

    // 🔔 STEP 3: Send FCM Notifications (Background task)
    // This runs async and doesn't block response
    sendNotifications(chatId, currentUserId, userName, content).catch((err) =>
      console.error("❌ FCM error (non-blocking):", err)
    );

    // ✅ Respond to client
    return res.status(200).json({
      success: true,
      data: {
        id: messageId,
        senderId: currentUserId,
        content: content,
        timestamp: Date.now(),
      },
    });
  } catch (error) {
    console.error("❌ Unexpected error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}
```

---

## 🎯 WHAT TO CHECK IN YOUR BACKEND

1. **Is Firebase Admin SDK initialized?**

   ```typescript
   import * as admin from "firebase-admin";

   admin.initializeApp({
     credential: admin.credential.cert(serviceAccountKey),
     databaseURL: "https://your-project.firebaseio.com",
   });
   ```

2. **Does message endpoint write to Firebase?**

   ```typescript
   // After saving to Supabase, look for:
   admin.database().ref(`chats/${chatId}/messages/${messageId}`).set(...)

   // If this is missing → ADD IT!
   ```

3. **Does it send FCM notifications?**

   ```typescript
   // After writing to Firebase, look for:
   admin.messaging().sendMulticast({
     tokens: deviceTokens,
     notification: { ... },
     data: { chatId, ... }
   });

   // If missing → ADD IT!
   ```

4. **Are device tokens being retrieved?**

   ```typescript
   // Should query device_tokens table for recipient:
   const tokens = await db.query(
     "SELECT device_token FROM device_tokens WHERE user_id = ?",
     [recipientUserId]
   );

   // If not retrieving → ADD IT!
   ```

---

## 🔍 HOW TO VERIFY IT'S WORKING

### **Test 1: Check Firebase RTDB**

1. Send message from app
2. Go to Firebase Console → Realtime Database
3. Look for: `chats/chat_1_3_2/messages/-OeZ8F7_711...`
4. Should see message data with senderId, content, timestamp
5. **If not there → Backend not writing to Firebase!**

### **Test 2: Check Notifications**

1. Send message from app
2. Check console logs in backend
3. Should see:
   ```
   ✅ Message saved to Supabase: msg-12345
   🔥 Message written to Firebase RTDB: msg-12345
   📬 Sending notification to user: 1
   🔔 Found 2 device tokens
   ✅ FCM Send Result: { successCount: 2, failureCount: 0 }
   ```
4. **If not seeing these logs → Backend missing implementation!**

---

## 📞 SUMMARY

Your backend MUST do 3 things when message is received:

| Step | What                   | Required? | Status           |
| ---- | ---------------------- | --------- | ---------------- |
| 1    | Save to Supabase       | ✅ Yes    | ✅ Probably Done |
| 2    | Write to Firebase RTDB | ✅ Yes    | ❌ Missing       |
| 3    | Send FCM Notification  | ✅ Yes    | ❌ Missing       |

**If you're only doing Step 1 → Messages won't appear in real-time and notifications won't work!**

**Complete Steps 2 & 3 and everything will work! 🚀**
