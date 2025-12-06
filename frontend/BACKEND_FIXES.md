# 🛠️ Backend Code Examples & Fixes

## Your Frontend Works! Here's What Backend Needs

---

## Problem #1: Backend Not Writing to Firebase

### Current Backend Flow (Incomplete)

```
Message → Supabase Database → Done ❌
```

### Fixed Backend Flow (Complete)

```
Message → Supabase Database → Firebase RTDB → Frontend Listener Triggers ✅
```

---

## Example 1: Python Backend (FastAPI)

### ❌ INCOMPLETE CODE (What You Probably Have)

```python
from fastapi import APIRouter, HTTPException
from supabase import create_client
import os

router = APIRouter()

@router.post("/chats/messages")
async def send_message(request: dict):
    """
    Current implementation - MISSING Firebase write!
    """
    try:
        # ✅ Save to Supabase
        message = supabase.table('messages').insert({
            'chat_id': request['chatId'],
            'sender_id': request['senderId'],
            'sender_name': request['senderName'],
            'content': request['content'],
            'image_urls': request.get('imageUrls', []),
            'timestamp': int(time.time() * 1000),
            'read': False
        }).execute()

        # ❌ MISSING: Write to Firebase RTDB
        # This is why frontend listener doesn't trigger!

        return {'success': True, 'message': message.data[0]}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

### ✅ COMPLETE CODE (What It Should Be)

```python
from fastapi import APIRouter, HTTPException
from supabase import create_client
import firebase_admin
from firebase_admin import db
import time
import os

router = APIRouter()
supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

@router.post("/chats/messages")
async def send_message(request: dict):
    """
    Fixed implementation - includes Firebase write
    """
    try:
        chat_id = request['chatId']
        sender_id = request['senderId']
        sender_name = request['senderName']
        content = request['content']
        image_urls = request.get('imageUrls', [])
        timestamp = int(time.time() * 1000)

        # 1. ✅ Save to Supabase (persistent storage)
        print(f"💾 Saving message to Supabase for chat {chat_id}")
        message = supabase.table('messages').insert({
            'chat_id': chat_id,
            'sender_id': sender_id,
            'sender_name': sender_name,
            'content': content,
            'image_urls': image_urls,
            'timestamp': timestamp,
            'read': False
        }).execute()

        message_id = message.data[0]['id']
        print(f"✅ Message saved to Supabase with ID: {message_id}")

        # 2. ✅ WRITE TO FIREBASE for real-time sync
        print(f"🔥 Writing to Firebase at /chats/{chat_id}/messages")
        firebase_message = {
            'senderId': sender_id,
            'senderName': sender_name,
            'content': content,
            'imageUrls': image_urls,
            'timestamp': timestamp,
            'read': False,
            'readAt': None
        }

        ref = db.reference(f'chats/{chat_id}/messages')
        ref.push(firebase_message)
        print(f"✅ Message pushed to Firebase RTDB")

        # 3. ✅ SEND NOTIFICATIONS
        print(f"📱 Sending notifications for chat {chat_id}")
        await send_notification_to_user(
            chat_id=chat_id,
            sender_id=sender_id,
            sender_name=sender_name,
            message_content=content
        )

        return {
            'success': True,
            'message': {
                'id': message_id,
                'chatId': chat_id,
                'senderId': sender_id,
                'senderName': sender_name,
                'content': content,
                'imageUrls': image_urls,
                'timestamp': timestamp,
                'read': False
            }
        }

    except Exception as e:
        print(f"❌ Error sending message: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


async def send_notification_to_user(chat_id: str, sender_id: int, sender_name: str, message_content: str):
    """
    Send FCM notification to the recipient
    """
    try:
        # 1. Get chat and recipient ID
        chat = supabase.table('chats').select('*').eq('id', chat_id).execute()
        if not chat.data:
            print(f"❌ Chat not found: {chat_id}")
            return

        chat_data = chat.data[0]
        recipient_id = chat_data['buyer_id'] if chat_data['seller_id'] == sender_id else chat_data['seller_id']

        print(f"📱 Getting device tokens for user {recipient_id}")

        # 2. Get recipient's device tokens
        tokens_response = supabase.table('device_tokens').select('*').eq('user_id', recipient_id).execute()
        tokens = [t['device_token'] for t in tokens_response.data]

        if not tokens:
            print(f"⚠️ No device tokens found for user {recipient_id}")
            return

        print(f"📱 Found {len(tokens)} device tokens for user {recipient_id}")

        # 3. Send FCM to all devices
        from firebase_admin import messaging

        print(f"📤 Sending FCM notification to {len(tokens)} devices...")

        message = messaging.MulticastMessage(
            tokens=tokens,
            notification=messaging.Notification(
                title=f"New message from {sender_name}",
                body=message_content[:100],  # Limit to 100 chars
            ),
            data={
                'chatId': str(chat_id),
                'senderId': str(sender_id),
                'senderName': sender_name,
                'type': 'message'
            }
        )

        response = messaging.send_multicast(message)
        print(f"✅ Successfully sent to {response.success_count} devices")
        print(f"❌ Failed to send to {response.failure_count} devices")

        if response.failure_count > 0:
            for idx, exception in enumerate(response.exceptions):
                print(f"  Device {idx}: {str(exception)}")

    except Exception as e:
        print(f"❌ Error sending notification: {str(e)}")
```

### Setup Firebase Admin SDK (Python)

```python
# 1. Install Firebase Admin
# pip install firebase-admin

# 2. Download service account JSON from Firebase Console
# - Go to Firebase Console → Settings → Service Accounts
# - Click "Generate New Private Key"
# - Save as `serviceAccountKey.json`

# 3. Initialize in your main app file
import firebase_admin
from firebase_admin import credentials, db, messaging

# Initialize Firebase
cred = credentials.Certificate("path/to/serviceAccountKey.json")
firebase_admin.initialize_app(cred, {
    'databaseURL': 'https://YOUR-PROJECT.firebaseio.com'
})

print("✅ Firebase Admin SDK initialized")
```

---

## Example 2: Node.js/Express Backend

### ✅ COMPLETE CODE

```javascript
const express = require("express");
const admin = require("firebase-admin");
const { createClient } = require("@supabase/supabase-js");
const router = express.Router();

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Firebase Admin already initialized in app.js

router.post("/chats/messages", async (req, res) => {
  try {
    const { chatId, senderId, senderName, content, imageUrls = [] } = req.body;
    const timestamp = Date.now();

    // 1. Save to Supabase
    console.log(`💾 Saving message to Supabase for chat ${chatId}`);
    const { data: messageData, error: dbError } = await supabase
      .from("messages")
      .insert({
        chat_id: chatId,
        sender_id: senderId,
        sender_name: senderName,
        content: content,
        image_urls: imageUrls,
        timestamp: timestamp,
        read: false,
      })
      .select();

    if (dbError) {
      throw new Error(`Supabase error: ${dbError.message}`);
    }

    console.log(`✅ Message saved to Supabase`);

    // 2. Write to Firebase RTDB
    console.log(`🔥 Writing to Firebase at /chats/${chatId}/messages`);
    const firebaseMessage = {
      senderId: senderId,
      senderName: senderName,
      content: content,
      imageUrls: imageUrls,
      timestamp: timestamp,
      read: false,
      readAt: null,
    };

    const ref = admin.database().ref(`chats/${chatId}/messages`);
    await ref.push(firebaseMessage);
    console.log(`✅ Message pushed to Firebase RTDB`);

    // 3. Send notifications
    console.log(`📱 Sending notifications for chat ${chatId}`);
    await sendNotificationToUser(chatId, senderId, senderName, content);

    res.json({
      success: true,
      message: {
        id: messageData[0].id,
        chatId: chatId,
        senderId: senderId,
        senderName: senderName,
        content: content,
        imageUrls: imageUrls,
        timestamp: timestamp,
        read: false,
      },
    });
  } catch (error) {
    console.error(`❌ Error sending message:`, error);
    res.status(500).json({ error: error.message });
  }
});

async function sendNotificationToUser(
  chatId,
  senderId,
  senderName,
  messageContent
) {
  try {
    // 1. Get recipient ID
    const { data: chats } = await supabase
      .from("chats")
      .select("*")
      .eq("id", chatId);

    if (!chats || chats.length === 0) {
      console.log(`❌ Chat not found: ${chatId}`);
      return;
    }

    const chat = chats[0];
    const recipientId =
      chat.seller_id === senderId ? chat.buyer_id : chat.seller_id;

    console.log(`📱 Getting device tokens for user ${recipientId}`);

    // 2. Get recipient's device tokens
    const { data: tokensData } = await supabase
      .from("device_tokens")
      .select("*")
      .eq("user_id", recipientId);

    const tokens = tokensData.map((t) => t.device_token);

    if (tokens.length === 0) {
      console.log(`⚠️ No device tokens found for user ${recipientId}`);
      return;
    }

    console.log(
      `📱 Found ${tokens.length} device tokens for user ${recipientId}`
    );

    // 3. Send FCM
    console.log(`📤 Sending FCM notification to ${tokens.length} devices...`);

    const message = {
      notification: {
        title: `New message from ${senderName}`,
        body: messageContent.substring(0, 100),
      },
      data: {
        chatId: String(chatId),
        senderId: String(senderId),
        senderName: senderName,
        type: "message",
      },
      tokens: tokens,
    };

    const response = await admin.messaging().sendMulticast(message);
    console.log(`✅ Successfully sent to ${response.successCount} devices`);
    console.log(`❌ Failed to send to ${response.failureCount} devices`);

    if (response.failureCount > 0) {
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          console.log(`  Device ${idx}: ${resp.error.message}`);
        }
      });
    }
  } catch (error) {
    console.error(`❌ Error sending notification:`, error);
  }
}

module.exports = router;
```

### Setup Firebase Admin SDK (Node.js)

```bash
# 1. Install Firebase Admin
npm install firebase-admin

# 2. Download service account JSON from Firebase Console
# - Go to Firebase Console → Settings → Service Accounts
# - Click "Generate New Private Key"
# - Save as `serviceAccountKey.json` in your project root

# 3. Initialize in app.js
```

```javascript
// app.js
const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://YOUR-PROJECT.firebaseio.com",
});

console.log("✅ Firebase Admin SDK initialized");
```

---

## Example 3: Java Backend (Spring Boot)

### ✅ COMPLETE CODE

```java
@RestController
@RequestMapping("/api/chats")
public class ChatController {

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private FirebaseDatabase firebaseDatabase;

    @PostMapping("/messages")
    public ResponseEntity<?> sendMessage(@RequestBody SendMessageRequest request) {
        try {
            long timestamp = System.currentTimeMillis();
            String chatId = request.getChatId();

            // 1. Save to database
            System.out.println("💾 Saving message to database");
            Message message = new Message();
            message.setChatId(chatId);
            message.setSenderId(request.getSenderId());
            message.setSenderName(request.getSenderName());
            message.setContent(request.getContent());
            message.setImageUrls(request.getImageUrls());
            message.setTimestamp(timestamp);
            message.setRead(false);

            Message savedMessage = messageRepository.save(message);
            System.out.println("✅ Message saved to database");

            // 2. Write to Firebase RTDB
            System.out.println("🔥 Writing to Firebase at /chats/" + chatId + "/messages");

            Map<String, Object> firebaseMessage = new HashMap<>();
            firebaseMessage.put("senderId", request.getSenderId());
            firebaseMessage.put("senderName", request.getSenderName());
            firebaseMessage.put("content", request.getContent());
            firebaseMessage.put("imageUrls", request.getImageUrls());
            firebaseMessage.put("timestamp", timestamp);
            firebaseMessage.put("read", false);
            firebaseMessage.put("readAt", null);

            DatabaseReference ref = firebaseDatabase.getReference()
                .child("chats")
                .child(chatId)
                .child("messages");

            ref.push().setValueAsync(firebaseMessage);
            System.out.println("✅ Message pushed to Firebase RTDB");

            // 3. Send notifications
            System.out.println("📱 Sending notifications");
            notificationService.sendMessageNotification(
                chatId,
                request.getSenderId(),
                request.getSenderName(),
                request.getContent()
            );

            return ResponseEntity.ok(new MessageResponse(savedMessage));

        } catch (Exception e) {
            System.err.println("❌ Error sending message: " + e.getMessage());
            return ResponseEntity.status(500).body(
                new ErrorResponse("Failed to send message: " + e.getMessage())
            );
        }
    }
}

@Service
public class NotificationService {

    @Autowired
    private ChatRepository chatRepository;

    @Autowired
    private DeviceTokenRepository deviceTokenRepository;

    public void sendMessageNotification(String chatId, long senderId, String senderName, String messageContent) {
        try {
            // 1. Get recipient ID
            Chat chat = chatRepository.findById(chatId)
                .orElseThrow(() -> new Exception("Chat not found"));

            long recipientId = chat.getSellerId() == senderId ? chat.getBuyerId() : chat.getSellerId();

            System.out.println("📱 Getting device tokens for user " + recipientId);

            // 2. Get device tokens
            List<DeviceToken> tokens = deviceTokenRepository.findByUserId(recipientId);

            if (tokens.isEmpty()) {
                System.out.println("⚠️ No device tokens found for user " + recipientId);
                return;
            }

            System.out.println("📱 Found " + tokens.size() + " device tokens");

            // 3. Send FCM
            System.out.println("📤 Sending FCM to " + tokens.size() + " devices");

            List<String> tokenList = tokens.stream()
                .map(DeviceToken::getToken)
                .collect(Collectors.toList());

            MulticastMessage message = MulticastMessage.builder()
                .addAllTokens(tokenList)
                .setNotification(Notification.builder()
                    .setTitle("New message from " + senderName)
                    .setBody(messageContent.substring(0, Math.min(100, messageContent.length())))
                    .build())
                .putData("chatId", String.valueOf(chatId))
                .putData("senderId", String.valueOf(senderId))
                .putData("senderName", senderName)
                .putData("type", "message")
                .build();

            BatchResponse response = FirebaseMessaging.getInstance().sendMulticast(message);
            System.out.println("✅ Sent to " + response.getSuccessCount() + " devices");
            System.out.println("❌ Failed on " + response.getFailureCount() + " devices");

        } catch (Exception e) {
            System.err.println("❌ Error sending notification: " + e.getMessage());
        }
    }
}
```

### Setup Firebase Admin SDK (Java)

```xml
<!-- pom.xml -->
<dependency>
    <groupId>com.google.firebase</groupId>
    <artifactId>firebase-admin</artifactId>
    <version>9.1.1</version>
</dependency>
```

```java
// FirebaseConfig.java
@Configuration
public class FirebaseConfig {

    @Bean
    public FirebaseApp firebaseApp() throws IOException {
        // Download service account JSON from Firebase Console
        // Place in src/main/resources/serviceAccountKey.json

        InputStream serviceAccount =
            FirebaseConfig.class.getResourceAsStream("/serviceAccountKey.json");

        FirebaseOptions options = FirebaseOptions.builder()
            .setCredentials(GoogleCredentials.fromStream(serviceAccount))
            .setDatabaseUrl("https://YOUR-PROJECT.firebaseio.com")
            .build();

        System.out.println("✅ Firebase Admin SDK initialized");
        return FirebaseApp.initializeApp(options);
    }

    @Bean
    public FirebaseDatabase firebaseDatabase(FirebaseApp firebaseApp) {
        return FirebaseDatabase.getInstance(firebaseApp);
    }
}
```

---

## Checklist to Add to Your Backend

- [ ] **Import Firebase Admin SDK**

  - Python: `pip install firebase-admin`
  - Node.js: `npm install firebase-admin`
  - Java: Add Firebase Admin dependency

- [ ] **Download Service Account JSON**

  - Firebase Console → Settings → Service Accounts
  - Generate new private key
  - Add to backend (don't commit to git!)

- [ ] **Initialize Firebase Admin**

  - Add to app startup
  - Point to your Firebase database URL

- [ ] **Update Message Endpoint**

  - After saving to Supabase, write to Firebase: `ref.push(data)`
  - Add logging at each step

- [ ] **Add Notification Function**

  - Get device tokens for recipient
  - Call Firebase Admin messaging.sendMulticast()
  - Add logging for success/failure

- [ ] **Call Notification Function**

  - After writing to Firebase, call notification function
  - Don't wait for response (async is fine)

- [ ] **Test**
  - Send message from frontend
  - Check backend logs show all steps completed
  - Verify message appears in Firebase Console
  - Verify notification appears in browser

---

## Firebase Rules (Important!)

Add this to your Firebase Realtime Database Rules:

```json
{
  "rules": {
    "chats": {
      "$chatId": {
        "messages": {
          "$messageId": {
            ".write": "auth != null",
            ".read": "auth != null"
          }
        },
        "typing": {
          "$userId": {
            ".write": "auth.uid == $userId",
            ".read": "auth != null"
          }
        }
      }
    },
    "users": {
      "$userId": {
        ".write": "auth.uid == $userId",
        ".read": "auth != null"
      }
    }
  }
}
```

Then click **Publish**

---

## Quick Test Script

Use this to verify everything works:

```python
# test_backend.py
import requests
import json

BASE_URL = "http://localhost:8000"  # Your backend URL

def test_send_message():
    payload = {
        "chatId": "chat_2_3_2",
        "senderId": 2,
        "senderName": "Buyer Name",
        "content": "Test message from backend test",
        "imageUrls": []
    }

    response = requests.post(
        f"{BASE_URL}/api/chats/messages",
        json=payload,
        headers={"Authorization": "Bearer YOUR_TOKEN"}
    )

    print("Status:", response.status_code)
    print("Response:", json.dumps(response.json(), indent=2))

if __name__ == "__main__":
    test_send_message()
```

---

That's it! Once your backend writes to Firebase and sends FCM, everything will work!
