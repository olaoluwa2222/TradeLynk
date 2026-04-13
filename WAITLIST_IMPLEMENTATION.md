# Waitlist Capture Implementation - TradeLynk Backend

## Overview
This implementation adds a production-ready waitlist capture endpoint for the TradeLynk marketing landing page (go.tradelynk.app).

## Files Created

### 1. Database Migration
**File**: `src/main/resources/db/migration/V14__create_waitlist_table.sql`

Creates the `waitlist` table with:
- UUID primary key
- Unique lowercase email constraint
- Source tracking (defaults to "go.tradelynk.app")
- Timestamp with timezone for created_at
- Indexes on email, source, and created_at for optimal query performance

### 2. Entity
**File**: `src/main/java/com/codewithola/tradelynkapi/entity/Waitlist.java`

JPA entity with:
- UUID primary key (auto-generated)
- Email field (unique, not null)
- Source field with default value
- CreationTimestamp auto-populated

### 3. Repository
**File**: `src/main/java/com/codewithola/tradelynkapi/repositories/WaitlistRepository.java`

JpaRepository with custom queries:
- `findByEmailIgnoreCase()` - case-insensitive email lookup
- `existsByEmailIgnoreCase()` - efficient duplicate check
- `findByEmail()` - exact email match

### 4. DTOs
**Request**: `src/main/java/com/codewithola/tradelynkapi/dtos/requests/WaitlistRequest.java`
- email (required, validated as valid email format)
- source (optional)

**Response**: `src/main/java/com/codewithola/tradelynkapi/dtos/response/WaitlistResponse.java`
- id (UUID)
- email (normalized lowercase)
- source
- createdAt
- isDuplicate (boolean flag)

### 5. Service
**File**: `src/main/java/com/codewithola/tradelynkapi/services/WaitlistService.java`

Business logic:
- Email normalization (lowercase + trim)
- Duplicate detection (case-insensitive)
- Safe error handling with logging
- Transactional operations

### 6. Controller
**File**: `src/main/java/com/codewithola/tradelynkapi/controller/WaitlistController.java`

REST endpoints:
- `POST /api/v1/waitlist` - Add email to waitlist
- `GET /api/v1/waitlist/health` - Health check with stats

CORS configured for:
- https://go.tradelynk.app
- https://tradelynk.app

### 7. Tests
**Unit Test**: `src/test/java/com/codewithola/tradelynkapi/services/WaitlistServiceTest.java`
- New email signup
- Duplicate email handling
- Email normalization (lowercase, trim)
- Default source assignment
- Email existence checks
- Count queries

**Integration Test**: `src/test/java/com/codewithola/tradelynkapi/controller/WaitlistControllerIntegrationTest.java`
- Full HTTP request flow
- Database persistence
- Duplicate detection end-to-end
- Email validation (400 on invalid format)
- Case-insensitivity
- Whitespace trimming
- Default source handling
- Health check endpoint
- CORS headers

## API Endpoint Documentation

### POST /api/v1/waitlist

**Request:**
```json
{
  "email": "user@example.com",
  "source": "go.tradelynk.app"
}
```

**Response (201 Created - New Signup):**
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
  },
  "timestamp": "2026-04-13T10:30:00"
}
```

**Response (200 OK - Duplicate Email):**
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
  },
  "timestamp": "2026-04-13T10:30:00"
}
```

**Response (400 Bad Request - Invalid Email):**
```json
{
  "success": false,
  "message": "Email must be a valid email address",
  "data": null,
  "timestamp": "2026-04-13T10:30:00"
}
```

**Response (500 Internal Server Error):**
```json
{
  "success": false,
  "message": "Error processing signup - please try again later",
  "data": null,
  "timestamp": "2026-04-13T10:30:00"
}
```

## Manual Testing with cURL

### Test 1: New Email Signup
```bash
curl -X POST https://tradelynk-api-t598w.ondigitalocean.app/api/v1/waitlist \
  -H "Content-Type: application/json" \
  -H "Origin: https://go.tradelynk.app" \
  -d '{
    "email": "newuser@example.com",
    "source": "go.tradelynk.app"
  }'
```

**Expected Response**: 201 Created with isDuplicate: false

### Test 2: Duplicate Email
```bash
curl -X POST https://tradelynk-api-t598w.ondigitalocean.app/api/v1/waitlist \
  -H "Content-Type: application/json" \
  -H "Origin: https://go.tradelynk.app" \
  -d '{
    "email": "newuser@example.com",
    "source": "go.tradelynk.app"
  }'
```

**Expected Response**: 200 OK with isDuplicate: true

### Test 3: Case-Insensitive Duplicate
```bash
curl -X POST https://tradelynk-api-t598w.ondigitalocean.app/api/v1/waitlist \
  -H "Content-Type: application/json" \
  -H "Origin: https://go.tradelynk.app" \
  -d '{
    "email": "NEWUSER@EXAMPLE.COM",
    "source": "go.tradelynk.app"
  }'
```

**Expected Response**: 200 OK with isDuplicate: true (treated as duplicate)

### Test 4: Invalid Email Format
```bash
curl -X POST https://tradelynk-api-t598w.ondigitalocean.app/api/v1/waitlist \
  -H "Content-Type: application/json" \
  -H "Origin: https://go.tradelynk.app" \
  -d '{
    "email": "not-an-email",
    "source": "go.tradelynk.app"
  }'
```

**Expected Response**: 400 Bad Request

### Test 5: Missing Email
```bash
curl -X POST https://tradelynk-api-t598w.ondigitalocean.app/api/v1/waitlist \
  -H "Content-Type: application/json" \
  -H "Origin: https://go.tradelynk.app" \
  -d '{
    "source": "go.tradelynk.app"
  }'
```

**Expected Response**: 400 Bad Request

### Test 6: Health Check
```bash
curl -X GET https://tradelynk-api-t598w.ondigitalocean.app/api/v1/waitlist/health \
  -H "Origin: https://go.tradelynk.app"
```

**Expected Response**: 200 OK with total signup count

### Test 7: Email with Whitespace (Should be trimmed)
```bash
curl -X POST https://tradelynk-api-t598w.ondigitalocean.app/api/v1/waitlist \
  -H "Content-Type: application/json" \
  -H "Origin: https://go.tradelynk.app" \
  -d '{
    "email": "  trimmed@example.com  ",
    "source": "go.tradelynk.app"
  }'
```

**Expected Response**: 201 Created with email stored as "trimmed@example.com"

### Test 8: Missing Source (Should use default)
```bash
curl -X POST https://tradelynk-api-t598w.ondigitalocean.app/api/v1/waitlist \
  -H "Content-Type: application/json" \
  -H "Origin: https://go.tradelynk.app" \
  -d '{
    "email": "nosource@example.com"
  }'
```

**Expected Response**: 201 Created with source: "go.tradelynk.app"

### Test 9: Custom Source
```bash
curl -X POST https://tradelynk-api-t598w.ondigitalocean.app/api/v1/waitlist \
  -H "Content-Type: application/json" \
  -H "Origin: https://go.tradelynk.app" \
  -d '{
    "email": "customsource@example.com",
    "source": "twitter-campaign"
  }'
```

**Expected Response**: 201 Created with source: "twitter-campaign"

## Frontend Integration Example

### JavaScript/React
```javascript
async function addToWaitlist(email, source = 'go.tradelynk.app') {
  try {
    const response = await fetch('https://tradelynk-api-t598w.ondigitalocean.app/api/v1/waitlist', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email.trim(),
        source: source
      })
    });

    const data = await response.json();

    if (data.success) {
      if (data.data.isDuplicate) {
        console.log('Email already on waitlist');
      } else {
        console.log('Successfully added to waitlist!');
      }
      return { success: true, isDuplicate: data.data.isDuplicate };
    } else {
      console.error('Error:', data.message);
      return { success: false, error: data.message };
    }
  } catch (error) {
    console.error('Network error:', error);
    return { success: false, error: 'Network error' };
  }
}
```

## Database Setup - Automatic with Flyway

When you deploy the application to DigitalOcean:

1. **Flyway will automatically execute** the migration file `V14__create_waitlist_table.sql`
2. No manual database setup needed
3. The table will be created with all indexes and constraints
4. This happens automatically on application startup

### If Running Locally

The migration will execute automatically when Spring Boot starts if you have:
- PostgreSQL configured in `application.yml`
- Flyway dependency (already in pom.xml)
- Migration file in `src/main/resources/db/migration/`

## Important Notes

### Email Normalization
- All emails are stored as **lowercase**
- Leading/trailing whitespace is **trimmed**
- This ensures case-insensitive duplicate detection

### Duplicate Handling
- Duplicates return **200 OK** (not 409), with `isDuplicate: true`
- Frontend can safely retry the same request
- No error is thrown for duplicates (safe for user experience)

### Security
- No authentication required (public endpoint)
- Email validation via Bean Validation
- Logs sanitized (do not log full payloads)
- CORS restricted to allowed domains

### CORS Configuration
Currently configured for:
- `https://go.tradelynk.app`
- `https://tradelynk.app`

If you need to add more origins, update in `WaitlistController`:
```java
@CrossOrigin(origins = {"https://go.tradelynk.app", "https://tradelynk.app", "https://your-new-domain.app"})
```

## Production Deployment Checklist

- [ ] Migration file created (V14__create_waitlist_table.sql)
- [ ] All Java files compiled without errors
- [ ] Tests pass locally
- [ ] Application deployed to DigitalOcean
- [ ] Flyway migration runs automatically on startup
- [ ] POST /api/v1/waitlist endpoint works
- [ ] GET /api/v1/waitlist/health returns 200
- [ ] CORS headers present in responses
- [ ] Database table created with indexes
- [ ] Duplicate emails are handled correctly
- [ ] Email validation enforced (400 on invalid emails)

## Database Query Examples

### Check Waitlist Count
```sql
SELECT COUNT(*) as total_signups FROM waitlist;
```

### Get All Signups by Source
```sql
SELECT source, COUNT(*) as count FROM waitlist GROUP BY source;
```

### Get Recent Signups (Last 7 Days)
```sql
SELECT email, source, created_at FROM waitlist 
WHERE created_at >= NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;
```

### Export Waitlist to CSV
```sql
COPY (
  SELECT email, source, created_at FROM waitlist 
  ORDER BY created_at DESC
) TO '/tmp/waitlist.csv' WITH CSV HEADER;
```

## Monitoring

### Application Logs
Look for:
```
INFO  - Processing waitlist signup - source: go.tradelynk.app
INFO  - Successfully added email to waitlist - source: go.tradelynk.app
INFO  - Duplicate waitlist signup attempt - source: go.tradelynk.app
```

### Errors
If migrations fail:
```
org.flywaydb.core.api.exception.FlywayException: Unable to execute migration
```

If database connection fails:
```
org.springframework.beans.factory.UnsatisfiedDependencyException: Cannot resolve reference to bean 'entityManagerFactory'
```

## Rate Limiting (Future Enhancement)

Currently no rate limiting is implemented. To add rate limiting in the future:

1. Add Spring Boot Rate Limiting starter to pom.xml
2. Configure rate limit policy in application.yml
3. Add `@RateLimiter` annotation to controller method

Example:
```java
@PostMapping
@RateLimiter(limit = "10", window = "1m")
public ResponseEntity<ApiResponse<WaitlistResponse>> addToWaitlist(...)
```

---

## Summary

✅ Production-ready waitlist capture system
✅ Duplicate detection with safe handling
✅ Email normalization and validation
✅ CORS configured for marketing domains
✅ Comprehensive test coverage (unit + integration)
✅ Flyway migration for automatic database setup
✅ No manual database configuration needed
✅ Safe logging without exposing sensitive data
✅ Clear error messages for frontend
✅ Health check endpoint for monitoring

