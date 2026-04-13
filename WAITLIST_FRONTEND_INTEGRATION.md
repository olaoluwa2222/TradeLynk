# Waitlist API - Frontend Integration Guide

## Quick Reference

### Endpoint
```
POST https://tradelynk-api-t598w.ondigitalocean.app/api/v1/waitlist
```

### Request
```json
{
  "email": "user@example.com",
  "source": "go.tradelynk.app"  // optional
}
```

### Response (Success - New)
```json
{
  "success": true,
  "message": "Email added to waitlist successfully - thanks for your interest!",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "source": "go.tradelynk.app",
    "createdAt": "2026-04-13T10:30:00Z",
    "isDuplicate": false
  }
}
```

### Response (Success - Duplicate)
```json
{
  "success": true,
  "message": "Email already on waitlist - we've already got you down!",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "source": "go.tradelynk.app",
    "createdAt": "2026-04-13T09:15:00Z",
    "isDuplicate": true
  }
}
```

### Response (Error)
```json
{
  "success": false,
  "message": "Email must be a valid email address",
  "data": null
}
```

## Frontend Implementation

### React Hook Example
```javascript
import { useState } from 'react';

export function WaitlistForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isDuplicate, setIsDuplicate] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setIsDuplicate(false);

    try {
      const response = await fetch('https://tradelynk-api-t598w.ondigitalocean.app/api/v1/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          source: 'go.tradelynk.app'
        })
      });

      const data = await response.json();

      if (data.success) {
        setIsDuplicate(data.data.isDuplicate);
        setMessage(
          data.data.isDuplicate 
            ? '✅ You\'re already on our waitlist!' 
            : '🎉 You\'ve been added to the waitlist! Thank you!'
        );
        setEmail('');
      } else {
        setMessage('❌ ' + (data.message || 'Something went wrong. Please try again.'));
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage('❌ Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="waitlist-form">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
        required
        disabled={loading}
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Adding...' : 'Join Waitlist'}
      </button>
      {message && <p className={isDuplicate ? 'message info' : 'message success'}>{message}</p>}
    </form>
  );
}
```

### HTML/JavaScript Example
```html
<form id="waitlistForm">
  <input 
    type="email" 
    id="emailInput" 
    placeholder="Enter your email" 
    required
  />
  <button type="submit">Join Waitlist</button>
  <div id="message" style="display:none;"></div>
</form>

<script>
document.getElementById('waitlistForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('emailInput').value;
  const messageDiv = document.getElementById('message');
  
  try {
    const response = await fetch('https://tradelynk-api-t598w.ondigitalocean.app/api/v1/waitlist', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email.trim(),
        source: 'go.tradelynk.app'
      })
    });

    const data = await response.json();

    messageDiv.style.display = 'block';
    if (data.success) {
      messageDiv.textContent = data.data.isDuplicate 
        ? '✅ Already on waitlist!' 
        : '🎉 Thanks for signing up!';
      messageDiv.className = 'success';
      document.getElementById('emailInput').value = '';
    } else {
      messageDiv.textContent = '❌ ' + data.message;
      messageDiv.className = 'error';
    }
  } catch (error) {
    messageDiv.style.display = 'block';
    messageDiv.textContent = '❌ Network error. Please try again.';
    messageDiv.className = 'error';
  }
});
</script>
```

### Next.js API Route (Optional Server-side)
```javascript
// pages/api/waitlist.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const response = await fetch('https://tradelynk-api-t598w.ondigitalocean.app/api/v1/waitlist', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email.trim(),
        source: 'go.tradelynk.app'
      })
    });

    const data = await response.json();
    
    if (data.success) {
      res.status(response.status).json(data);
    } else {
      res.status(400).json(data);
    }
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
}
```

## Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| 201 | Created (new email) | Show success message, clear form |
| 200 | OK (duplicate email) | Show friendly "already signed up" message |
| 400 | Bad Request | Show validation error message |
| 500 | Server Error | Show "try again later" message |

## Error Handling

### Invalid Email Format
```json
{
  "success": false,
  "message": "Email must be a valid email address"
}
```

### Missing Email
```json
{
  "success": false,
  "message": "Email is required"
}
```

### Server Error
```json
{
  "success": false,
  "message": "Error processing signup - please try again later"
}
```

## Important Notes

1. **Email normalization**: Backend automatically lowercases and trims the email
2. **Duplicate detection**: Case-insensitive (TEST@EMAIL.COM = test@email.com)
3. **Safe retries**: Can safely retry the request - duplicates won't cause errors
4. **No auth required**: Public endpoint, no authentication header needed
5. **CORS enabled**: Requests from go.tradelynk.app and tradelynk.app will work
6. **Source tracking**: Leave `source` empty to use default "go.tradelynk.app" or set custom value for campaign tracking

## Testing in Browser Console

```javascript
// Test new email
fetch('https://tradelynk-api-t598w.ondigitalocean.app/api/v1/waitlist', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'test@example.com' })
}).then(r => r.json()).then(console.log);

// Test duplicate
fetch('https://tradelynk-api-t598w.ondigitalocean.app/api/v1/waitlist', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'test@example.com' })
}).then(r => r.json()).then(console.log);

// Check health
fetch('https://tradelynk-api-t598w.ondigitalocean.app/api/v1/waitlist/health')
  .then(r => r.json()).then(console.log);
```

## Production Best Practices

1. ✅ Always validate email on client-side first (better UX)
2. ✅ Show loading state while request is in progress
3. ✅ Handle all possible response statuses
4. ✅ Add retry logic for network failures
5. ✅ Don't expose internal error messages to users
6. ✅ Clear form after successful signup (even if duplicate)
7. ✅ Log errors in client-side monitoring (Sentry, LogRocket, etc.)
8. ✅ Add analytics event tracking for signups

## Campaign Tracking

To track signups from different campaigns, set the `source` parameter:

```javascript
// Twitter campaign
fetch('https://tradelynk-api-t598w.ondigitalocean.app/api/v1/waitlist', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    email: 'user@example.com',
    source: 'twitter-launch'
  })
});

// Email campaign
fetch('https://tradelynk-api-t598w.ondigitalocean.app/api/v1/waitlist', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    email: 'user@example.com',
    source: 'email-newsletter'
  })
});

// Influencer campaign
fetch('https://tradelynk-api-t598w.ondigitalocean.app/api/v1/waitlist', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    email: 'user@example.com',
    source: 'influencer-promo'
  })
});
```

Then query the backend to see which campaigns perform best.

