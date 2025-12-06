# Testing & Verification Guide

## Quick Start Testing

### 1. Notification Flow Testing

**Prerequisites:**

- Two different browsers or one browser + one incognito window
- Both logged in as different users (buyer and seller)
- Chat page open in both

**Test Steps:**

```
STEP 1: Verify Device Token Saved
├─ Open DevTools (F12) in browser
├─ Go to Console tab
├─ Look for message: "✅ Device token saved successfully"
├─ If not found: Check Network tab for errors
├─ Expected: Log appears within 5 seconds of page load
└─ With retry logic: May see "⚠️ Failed attempt 1/3" before success

STEP 2: Test Notification Send (Chat Tab Open)
├─ Send message from User A
├─ Verify User B sees message immediately (no reload needed)
├─ In console, should see no logs (onMessage uses browser notification API)
├─ Expected: Notification appears as in-browser toast or browser notification
└─ Status: ✅ Real-time working if message appears instantly

STEP 3: Test Notification Send (Chat Tab Closed/Background)
├─ Open chat in User A's browser
├─ Close or minimize chat tab on User B's side
├─ Send message from User A
├─ Check User B's desktop for notification
├─ DevTools Console should show: "🔔 Background message received"
├─ If notification appears: ✅ Service worker working
├─ If not: Check browser notification settings or console for errors
└─ Click notification → should navigate to correct chat

STEP 4: Test Notification Click Navigation
├─ Service worker logs should show: "👆 Notification clicked"
├─ Check DevTools Console for: "🔍 Found X open windows"
├─ Should also show: "✅ Focusing existing window" or "📖 Opening new window"
├─ Expected: Clicking notification opens/focuses chat with correct user
└─ Verify chatId in URL: /chat?chatId=123 (query parameter format)
```

---

## Browser Console Testing

### What to Look For

#### SUCCESS LOGS:

```
✅ Device token saved successfully
   → Device tokens are being registered

🔔 Background message received: {payload}
   → Service worker received background message

📬 Showing notification: {title, body, chatId}
   → Notification is about to display

👆 Notification clicked: {notification}
   → User clicked notification

🔍 Found 2 open windows
   → Service worker found open windows

✅ Focusing existing window
   → Successfully focused existing chat window
```

#### ERROR LOGS:

```
❌ Failed attempt 1/3 to save device token
   → Retry logic kicking in (normal)

❌ Error showing notification: {error}
   → Notification display failed

❌ Error found: {error message}
   → Issue with notification system
```

---

## Real-Time Message Testing

### Test Case 1: Basic Real-Time Delivery

**Scenario:** User sends message, recipient should see it immediately

```
BEFORE FIX (Problem):
├─ User A sends message
├─ User B doesn't see it
├─ User B refreshes page
└─ Now User B sees message ❌

AFTER FIX (Expected):
├─ User A sends message
├─ User B sees message within 1 second ✅
├─ No page refresh needed ✅
├─ Message appears in ConversationView ✅
└─ Message has sender info and timestamp ✅
```

**How to Verify:**

1. Open two browser windows side-by-side
2. Login as different users
3. Navigate to same chat
4. User A types and sends message
5. Check User B's window - message should appear instantly
6. Open DevTools on User B side and check for any Firebase listener errors

---

### Test Case 2: Multiple Messages

**Scenario:** Send several messages in sequence

```
Expected Behavior:
├─ Message 1: Appears immediately ✅
├─ Message 2: Appears immediately ✅
├─ Message 3: Appears immediately ✅
├─ All have correct sender ✅
├─ All have correct timestamp ✅
└─ Proper styling applied to each ✅
```

**DevTools Check:**

- No errors in Console tab
- Network tab shows successful message POST
- Firebase listener active (check in DevTools Sources tab)

---

## UI/Styling Testing

### Message Bubbles

```
SELLER MESSAGES (Right side):
├─ Background: Pure black (#000000) ✓
├─ Text color: White ✓
├─ Font weight: font-medium (500) ✓
├─ Padding: 16px (px-4 py-3) ✓
├─ Border radius: 16px rounded ✓
├─ Shadow: Visible shadow ✓
├─ Hover effect: Enhanced shadow ✓
└─ Timestamp: Visible on hover ✓

BUYER MESSAGES (Left side):
├─ Background: White (#FFFFFF) ✓
├─ Border: 2px gray border ✓
├─ Text color: Black ✓
├─ Font weight: font-medium (500) ✓
├─ Padding: 16px (px-4 py-3) ✓
├─ Border radius: 16px rounded ✓
├─ Shadow: Subtle shadow ✓
└─ Timestamp: Visible on hover ✓

IMAGES IN MESSAGES:
├─ Display properly ✓
├─ Hover: Scale up (105%) ✓
├─ Rounded corners ✓
└─ Proper sizing ✓
```

### Chat Input

```
INPUT FIELD:
├─ Background: White ✓
├─ Border: 2px gray-300 ✓
├─ Border radius: 32px (rounded-2xl) ✓
├─ Text: font-medium ✓
├─ Focus: Black ring (2px) ✓
└─ Placeholder: Gray text ✓

SEND BUTTON:
├─ Background: Black ✓
├─ Text: White ✓
├─ Font: font-semibold ✓
├─ Disabled: Gray ✓
├─ Hover: Darker background ✓
├─ Active: Scale down (95%) ✓
└─ Shadow: Visible and lifts on hover ✓

IMAGE PREVIEW:
├─ Thumbnail visible ✓
├─ Rounded corners ✓
├─ Remove button shows on hover ✓
└─ Hover: Shadow enhancement ✓
```

### Chat List

```
SEARCH INPUT:
├─ Border radius: 32px ✓
├─ Border: 2px gray ✓
├─ Focus: Black ring ✓
└─ Placeholder: "🔍 Search conversations..." ✓

FILTER TABS:
├─ Active: Black background, white text ✓
├─ Inactive: Gray background ✓
├─ All tabs rounded-full ✓
└─ Smooth transitions ✓

CHAT ITEMS:
├─ Image: Rounded-xl ✓
├─ Image: w-14 h-14 (56px) ✓
├─ User name: font-bold ✓
├─ Item title: Showing ✓
├─ Last message: font-medium ✓
├─ Time: Relative time format ✓
├─ Selected: Black left border ✓
└─ Unread badge: Black background ✓
```

### Conversation Header

```
├─ Border: 2px gray-300 ✓
├─ Shadow: shadow-sm ✓
├─ User name: font-bold text-lg ✓
├─ Role + Item: "Buyer • Old Bike" format ✓
├─ Status: Proper emoji + color ✓
├─ Menu button: Transitions on hover ✓
└─ Back button: Visible on mobile ✓
```

---

## Responsive Design Testing

### Mobile View (375px - iPhone SE)

```
Chat List:
├─ Chat items stack properly ✓
├─ Search input takes full width ✓
├─ Filter tabs responsive ✓
└─ Images: Proper sizing ✓

Chat Window:
├─ Header fits on screen ✓
├─ Messages area scrollable ✓
├─ Input area at bottom ✓
├─ Message bubbles max-width set ✓
└─ Images responsive ✓

Input Area:
├─ Buttons visible ✓
├─ Text input responsive ✓
├─ Emoji button visible ✓
└─ Attachment button visible ✓
```

### Tablet View (768px)

```
├─ All components properly spaced ✓
├─ Message bubbles readable ✓
├─ Input area not cramped ✓
└─ Overall layout balanced ✓
```

### Desktop View (1920px)

```
├─ Chat list: Proper width ✓
├─ Conversation area: Readable width ✓
├─ Message bubbles: Good line length ✓
└─ Overall layout balanced ✓
```

---

## Error Handling Testing

### Test Case: Network Error During Send

```
Steps:
1. Open DevTools Network tab
2. Throttle to "Offline"
3. Try to send message
4. Expected: Error message in UI
5. Check styling: Red background, red border
6. Re-enable network
7. Try again: Should succeed
```

### Test Case: Missing Chat ID

```
Expected behavior:
├─ Navigation: Should not crash ✓
├─ Error handling: Should show user message ✓
├─ Console: Should show debug logs ✓
└─ Recovery: Should be possible ✓
```

---

## Backend Verification Checklist

Before assuming frontend is working, verify backend:

```
1. Device Token Storage
   ├─ Open Supabase → device_tokens table
   ├─ Check: Token exists for test user ✓
   ├─ Check: Last registered timestamp recent ✓
   └─ Check: Correct user_id ✓

2. Message Delivery
   ├─ Check Firebase RTDB: /chats/{chatId}/messages
   ├─ New messages should appear here ✓
   ├─ Should have: id, senderId, content, timestamp ✓
   └─ Should be written within 2 seconds ✓

3. Notification Sending
   ├─ Backend should call: admin.messaging().send(message) ✓
   ├─ Message should include: data.chatId, data.senderId ✓
   ├─ Should handle: Failed tokens, retry logic ✓
   └─ Should log: Successes and failures ✓

4. Error Logs
   ├─ Check backend logs for errors ✓
   ├─ Check Firebase logs for rejected messages ✓
   └─ No auth errors should appear ✓
```

---

## Performance Testing

### Load Testing

```
1. Send 50 messages rapidly
   ├─ Messages should all appear ✓
   ├─ UI should remain responsive ✓
   ├─ No memory leaks ✓
   └─ Scrolling smooth ✓

2. Open 10 different chats
   ├─ Each should load properly ✓
   ├─ No performance degradation ✓
   └─ Memory usage reasonable ✓
```

### Notification Performance

```
1. Receive 10 notifications rapidly
   ├─ All should display ✓
   ├─ Device should not slow down ✓
   ├─ Clicking any should work ✓
   └─ No duplicate notifications ✓
```

---

## Browser Compatibility Testing

### Chrome/Edge (Chromium)

```
├─ Notifications: ✓ Supported
├─ Service Workers: ✓ Supported
├─ Firebase: ✓ Working
└─ CSS: ✓ All features
```

### Firefox

```
├─ Notifications: ✓ Supported
├─ Service Workers: ✓ Supported
├─ Firebase: ✓ Working
└─ CSS: ✓ All features
```

### Safari

```
├─ Notifications: ⚠️ Limited support
├─ Service Workers: ⚠️ Limited support
├─ Firebase: ✓ Working
└─ CSS: ✓ All features
```

---

## Quick Verification Steps

### 1-Minute Check

```
1. Open chat page
2. Send a message
3. Check if it appears instantly on other user ✓
4. Check browser console for errors ✓
5. Verify message bubble styling ✓
```

### 5-Minute Check

```
1. Test in two different browsers
2. Send message with image
3. Verify real-time delivery
4. Close one chat window
5. Send message and verify notification appears
6. Click notification → should navigate
7. Check console for logs
```

### Full 15-Minute Test

```
1. Real-time delivery test
2. Notification background test
3. UI styling verification
4. Mobile responsiveness check
5. Error handling test
6. Performance test (multiple messages)
7. Browser DevTools inspection
8. Notification click navigation test
```

---

## Troubleshooting Guide

### Problem: Messages Not Appearing in Real-Time

**Check Points:**

```
1. Console for Firebase listener errors
   └─ Should show active listener, no errors

2. Network tab → Firebase requests
   └─ Should see rtdb.firebaseio.com requests

3. Firebase RTDB permissions
   └─ User must have read/write access

4. Backend writing to RTDB
   └─ Check backend code: Is it writing to Firebase?
   └─ Not just Supabase?

5. Chat ID normalization
   └─ Check: chat.id vs chat.chatId
   └─ Should use: chat.id (defined in Chat interface)
```

### Problem: Notifications Not Showing

**Check Points:**

```
1. Browser notification permission
   └─ Settings → Check browser permissions
   └─ Should be "Allow" not "Block"

2. Service worker registration
   └─ DevTools → Application → Service Workers
   └─ Should show registered and active

3. Device token saved
   └─ Console should show: "✅ Device token saved"
   └─ Supabase device_tokens table should have entry

4. Backend not sending FCM
   └─ Check backend logs for FCM send calls
   └─ Verify Firebase Admin SDK is configured
   └─ Check token validity in backend

5. VAPID key configuration
   └─ Should be in .env.local
   └─ Verify: NEXT_PUBLIC_FIREBASE_VAPID_KEY set
```

### Problem: Wrong Styling/Colors

**Check Points:**

```
1. Clear browser cache
   └─ DevTools → Network → "Disable cache"
   └─ Reload page: Ctrl+Shift+R

2. Check Tailwind compilation
   └─ Verify: tailwind.config.ts includes all paths
   └─ Check: CSS file compiled with new classes

3. Inspect element in DevTools
   └─ Right-click → Inspect
   └─ Check: Applied styles vs computed styles
   └─ Verify: Class names applied correctly

4. Check class names
   └─ Should use: rounded-2xl not rounded-xl
   └─ Should use: bg-black not bg-gray-900
   └─ Should use: border-2 not border
```

---

## Sign-Off Checklist

- [ ] ✅ Real-time messages delivering
- [ ] ✅ Notifications working (both foreground & background)
- [ ] ✅ Message bubbles styled correctly (black/white)
- [ ] ✅ Chat input styled modernly
- [ ] ✅ Chat list updated with new theme
- [ ] ✅ Header styling improved
- [ ] ✅ Mobile responsiveness working
- [ ] ✅ Console logs clear (no errors)
- [ ] ✅ Notification click navigation working
- [ ] ✅ Device tokens saving
- [ ] ✅ Service worker active
- [ ] ✅ Browser notification permission granted
- [ ] ✅ Styling consistent across all components
- [ ] ✅ Hover effects working smoothly
- [ ] ✅ Performance acceptable with multiple messages

Once all items checked: **READY FOR PRODUCTION** ✅
