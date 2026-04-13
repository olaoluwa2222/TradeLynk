# Waitlist Implementation - Deployment Checklist

## Pre-Deployment

- [ ] Review all 9 files created:
  - [ ] V14__create_waitlist_table.sql (migration)
  - [ ] Waitlist.java (entity)
  - [ ] WaitlistRepository.java (repository)
  - [ ] WaitlistRequest.java (DTO)
  - [ ] WaitlistResponse.java (DTO)
  - [ ] WaitlistService.java (service)
  - [ ] WaitlistController.java (controller)
  - [ ] WaitlistServiceTest.java (unit test)
  - [ ] WaitlistControllerIntegrationTest.java (integration test)

- [ ] Verify file locations:
  - [ ] Migration in: src/main/resources/db/migration/
  - [ ] Entity in: src/main/java/com/codewithola/tradelynkapi/entity/
  - [ ] Repository in: src/main/java/com/codewithola/tradelynkapi/repositories/
  - [ ] DTOs in: src/main/java/com/codewithola/tradelynkapi/dtos/
  - [ ] Service in: src/main/java/com/codewithola/tradelynkapi/services/
  - [ ] Controller in: src/main/java/com/codewithola/tradelynkapi/controller/
  - [ ] Tests in: src/test/java/com/codewithola/tradelynkapi/

- [ ] Local compilation test:
  ```bash
  mvn clean compile -DskipTests
  ```

- [ ] Local test run:
  ```bash
  mvn clean test
  ```

- [ ] Run all integration tests:
  ```bash
  mvn test
  ```

## Local Testing (Before Deployment)

### Start Local Application
```bash
mvn spring-boot:run
```

### Test New Email Signup
```bash
curl -X POST http://localhost:8080/api/v1/waitlist \
  -H "Content-Type: application/json" \
  -d '{"email": "test1@example.com", "source": "local-test"}'
```
Expected: 201 Created, isDuplicate: false

### Test Duplicate Email
```bash
curl -X POST http://localhost:8080/api/v1/waitlist \
  -H "Content-Type: application/json" \
  -d '{"email": "test1@example.com", "source": "local-test"}'
```
Expected: 200 OK, isDuplicate: true

### Test Invalid Email
```bash
curl -X POST http://localhost:8080/api/v1/waitlist \
  -H "Content-Type: application/json" \
  -d '{"email": "invalid-email", "source": "local-test"}'
```
Expected: 400 Bad Request

### Test Health Check
```bash
curl http://localhost:8080/api/v1/waitlist/health
```
Expected: 200 OK with signup count

### Verify Database
```sql
-- Connect to local PostgreSQL
SELECT COUNT(*) FROM waitlist;
SELECT * FROM waitlist;
```

- [ ] New email creates record
- [ ] Duplicate email not created
- [ ] Email stored as lowercase
- [ ] Whitespace trimmed
- [ ] Default source applied
- [ ] Timestamps working
- [ ] Health endpoint shows count

## Git Commit

```bash
cd C:\Users\isaia\OneDrive\Desktop\TradeLynk\backend\tradeLynkApi

# Add all waitlist files
git add src/main/resources/db/migration/V14__create_waitlist_table.sql
git add src/main/java/com/codewithola/tradelynkapi/entity/Waitlist.java
git add src/main/java/com/codewithola/tradelynkapi/repositories/WaitlistRepository.java
git add src/main/java/com/codewithola/tradelynkapi/dtos/requests/WaitlistRequest.java
git add src/main/java/com/codewithola/tradelynkapi/dtos/response/WaitlistResponse.java
git add src/main/java/com/codewithola/tradelynkapi/services/WaitlistService.java
git add src/main/java/com/codewithola/tradelynkapi/controller/WaitlistController.java
git add src/test/java/com/codewithola/tradelynkapi/services/WaitlistServiceTest.java
git add src/test/java/com/codewithola/tradelynkapi/controller/WaitlistControllerIntegrationTest.java
git add WAITLIST_IMPLEMENTATION.md
git add WAITLIST_FRONTEND_INTEGRATION.md
git add WAITLIST_SUMMARY.md

# Commit with descriptive message
git commit -m "feat: add waitlist capture for marketing landing page

- Add waitlist table with email, source, created_at
- Implement email normalization (lowercase, trim)
- Add duplicate detection with safe handling (200 OK)
- Create POST /api/v1/waitlist endpoint
- Add GET /api/v1/waitlist/health health check
- Configure CORS for go.tradelynk.app and tradelynk.app
- Add comprehensive unit and integration tests
- Bean validation for email format
- Transactional operations with error handling
- Auto-executed Flyway migration"

git push origin main
```

- [ ] Changes committed
- [ ] Push to main branch
- [ ] Verify in GitHub

## DigitalOcean Deployment

- [ ] Verify GitHub integration connected to DigitalOcean
- [ ] Check DigitalOcean App Platform settings
- [ ] Ensure database connection configured (Supabase)
- [ ] Verify Dockerfile builds successfully

### Trigger Deployment
1. Push to main branch
2. DigitalOcean App Platform automatically detects
3. Builds Docker image
4. Deploys to production
5. Flyway runs migrations automatically

### Monitor Deployment
- [ ] Check build logs in DigitalOcean Console
- [ ] Verify no compilation errors
- [ ] Confirm migrations executed
- [ ] Check application started successfully

### Post-Deployment Verification

#### Test Production Endpoint
```bash
# New signup
curl -X POST https://tradelynk-api-t598w.ondigitalocean.app/api/v1/waitlist \
  -H "Content-Type: application/json" \
  -d '{"email": "prod-test-1@example.com"}'

# Should return 201 Created

# Duplicate check
curl -X POST https://tradelynk-api-t598w.ondigitalocean.app/api/v1/waitlist \
  -H "Content-Type: application/json" \
  -d '{"email": "prod-test-1@example.com"}'

# Should return 200 OK with isDuplicate: true

# Health check
curl https://tradelynk-api-t598w.ondigitalocean.app/api/v1/waitlist/health

# Should show total signup count
```

- [ ] POST endpoint working
- [ ] Duplicate handling working
- [ ] Health endpoint working
- [ ] Status code 201 for new emails
- [ ] Status code 200 for duplicates
- [ ] Emails stored in database
- [ ] Database connection stable

#### Database Verification (Supabase)
1. Open Supabase Dashboard
2. Select TradeLynk database
3. Check "waitlist" table exists
4. Verify data in table:
   ```sql
   SELECT * FROM waitlist;
   ```

- [ ] Table created
- [ ] Data inserted
- [ ] Indexes created
- [ ] Constraints applied
- [ ] No errors in logs

#### Check Application Logs
1. Open DigitalOcean App Platform
2. Go to Logs tab
3. Check for:
   - No "cannot find symbol" errors
   - No "class not found" errors
   - Flyway migration success
   - Application started successfully

- [ ] No compilation errors in logs
- [ ] No runtime errors
- [ ] Flyway migrations applied successfully
- [ ] Application listening on port 8080

## Frontend Integration

### Update Frontend Code
- [ ] Add waitlist form to go.tradelynk.app
- [ ] Use POST https://tradelynk-api-t598w.ondigitalocean.app/api/v1/waitlist
- [ ] Handle success response (201 and 200)
- [ ] Handle error response (400, 500)
- [ ] Show loading state
- [ ] Clear form on success
- [ ] Handle duplicate gracefully

### Test Frontend Integration
- [ ] Test from https://go.tradelynk.app
- [ ] Test from https://tradelynk.app
- [ ] CORS headers present
- [ ] Form submission works
- [ ] Success message displays
- [ ] Duplicate message displays
- [ ] Error message displays
- [ ] Can retry duplicate email

### Example Tests
```javascript
// Test from browser console at https://go.tradelynk.app

// Test 1: New email
fetch('https://tradelynk-api-t598w.ondigitalocean.app/api/v1/waitlist', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'frontend-test@example.com' })
}).then(r => r.json()).then(d => console.log('New email:', d.data.isDuplicate));

// Test 2: Duplicate
fetch('https://tradelynk-api-t598w.ondigitalocean.app/api/v1/waitlist', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'frontend-test@example.com' })
}).then(r => r.json()).then(d => console.log('Duplicate:', d.data.isDuplicate));
```

- [ ] Frontend can reach endpoint
- [ ] CORS working (no CORS errors)
- [ ] Request sends successfully
- [ ] Response received
- [ ] Form works end-to-end

## Production Verification

### 24-Hour Monitoring
- [ ] Monitor error rates
- [ ] Check response times
- [ ] Verify no database connection issues
- [ ] Monitor logs for any errors
- [ ] Collect real user feedback

### Success Metrics
- [ ] All signups persisted to database
- [ ] No duplicate emails created
- [ ] Emails normalized correctly
- [ ] Response times < 500ms
- [ ] No 500 errors
- [ ] 100% uptime

## Post-Deployment Documentation

- [ ] Share endpoint with frontend team: `/api/v1/waitlist`
- [ ] Share integration guide: `WAITLIST_FRONTEND_INTEGRATION.md`
- [ ] Share cURL examples for testing
- [ ] Share database query examples for analytics
- [ ] Explain duplicate handling (200 OK response)
- [ ] Explain email normalization behavior
- [ ] Document rate limiting (if added)

## Troubleshooting

### If Deployment Fails

#### Compilation Error
```
ERROR: cannot find symbol: class Waitlist
```
Solution: 
- Verify all files are in correct directories
- Run `mvn clean compile` locally
- Check for typos in class names

#### Migration Error
```
FlywayValidateException: Validate failed: Migrations have failed validation
```
Solution:
- Check V14__create_waitlist_table.sql syntax
- Verify migration not already applied
- Check database connection

#### Database Connection Error
```
Cannot resolve reference to bean 'jpaSharedEM_entityManagerFactory'
```
Solution:
- Verify Supabase credentials in application.yml
- Check database is accessible
- Verify PostgreSQL connection string

#### CORS Error
```
Access to XMLHttpRequest has been blocked by CORS policy
```
Solution:
- Verify origin in @CrossOrigin matches frontend domain
- Add domain to CorsConfig if needed
- Clear browser cache

### If Tests Fail Locally

```bash
# Run with verbose output
mvn test -DskipTests=false -X

# Run specific test
mvn test -Dtest=WaitlistServiceTest

# See full error stack
mvn test -e
```

- [ ] Read error message carefully
- [ ] Check test file has correct annotations
- [ ] Verify mock setup correct
- [ ] Check assertion logic

---

## Final Checklist

- [ ] All 9 files created and in correct locations
- [ ] Local compilation successful (mvn clean compile)
- [ ] All tests passing (mvn test)
- [ ] Git changes committed and pushed
- [ ] DigitalOcean deployment triggered
- [ ] Application started without errors
- [ ] Flyway migration executed
- [ ] Database table created
- [ ] POST /api/v1/waitlist endpoint working
- [ ] GET /api/v1/waitlist/health working
- [ ] Duplicate emails handled correctly (200 OK)
- [ ] Email validation working (400 on invalid)
- [ ] CORS headers present
- [ ] Frontend can reach endpoint
- [ ] Data persisting to database
- [ ] Frontend form integrated
- [ ] End-to-end testing completed
- [ ] Documentation shared with team
- [ ] Monitoring verified
- [ ] Ready for production! ✅

---

**Status**: Ready for deployment
**Estimated Time**: 30 minutes for local testing + 5 minutes for deployment
**Risk Level**: Low (isolated feature, comprehensive tests, no breaking changes)

Good luck! 🚀

