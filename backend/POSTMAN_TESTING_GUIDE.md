# Postman Testing Guide

## 📥 Importing the Collection

### Method 1: Import from File

1. **Open Postman** (download from [postman.com](https://www.postman.com/downloads/) if needed)

2. **Click "Import"** button (top left)

3. **Select "File"** tab

4. **Choose the collection file:**
   - Navigate to: `backend/postman_collection.json`
   - Click "Open"

5. **The collection will appear** in your Postman sidebar under "Collections"

### Method 2: Import from URL (if hosted)

1. Click "Import"
2. Select "Link" tab
3. Paste the URL to the collection JSON file
4. Click "Continue" → "Import"

## 🔧 Setting Up Environment Variables

The collection uses variables that need to be configured:

### Step 1: Create/Edit Collection Variables

1. **Right-click** on "CauseConnect API" collection
2. Select **"Edit"**
3. Go to **"Variables"** tab
4. You'll see these variables:

| Variable | Initial Value | Current Value | Description |
|----------|---------------|---------------|-------------|
| `baseUrl` | `http://localhost:3001/api` | `http://localhost:3001/api` | API base URL |
| `accessToken` | (empty) | (auto-filled) | JWT access token |
| `refreshToken` | (empty) | (auto-filled) | JWT refresh token |

5. **Update `baseUrl`** if your backend runs on a different port
6. **Leave `accessToken` and `refreshToken` empty** - they'll be auto-filled after login

### Step 2: Verify Backend is Running

Before testing, ensure your backend server is running:

```bash
cd backend
npm run dev
```

You should see:
```
🚀 Server running on http://localhost:3001
📡 API available at http://localhost:3001/api
```

## 🧪 Testing Workflow

### Step 1: Test Health Endpoint (Optional)

1. Create a new request or use a simple GET:
   ```
   GET http://localhost:3001/health
   ```
2. Click **"Send"**
3. Should return: `{"status":"ok","timestamp":"..."}`

### Step 2: Register a New User

1. **Open** "Authentication" → "Register"
2. **Check the request body** - it should have:
   ```json
   {
     "firstName": "John",
     "lastName": "Doe",
     "email": "john@example.com",
     "username": "johndoe",
     "password": "password123",
     "confirmPassword": "password123"
   }
   ```
3. **Click "Send"**
4. **Expected Response (201):**
   ```json
   {
     "user": {
       "id": "...",
       "email": "john@example.com",
       "username": "johndoe",
       ...
     },
     "token": "eyJhbGc...",
     "refreshToken": "eyJhbGc..."
   }
   ```
5. **Copy the `token` and `refreshToken`** from response
6. **Update collection variables:**
   - Go to collection → Variables tab
   - Paste `token` into `accessToken` current value
   - Paste `refreshToken` into `refreshToken` current value

### Step 3: Login (Alternative to Register)

1. **Open** "Authentication" → "Login"
2. **Check the request body:**
   ```json
   {
     "emailOrUsername": "john@example.com",
     "password": "password123"
   }
   ```
3. **Click "Send"**
4. **The Login request has an auto-script** that saves tokens automatically!
   - Check the "Tests" tab in the Login request
   - It automatically sets `accessToken` and `refreshToken` variables
5. **After login**, tokens are automatically saved to collection variables

### Step 4: Test Protected Endpoints

Now that you have tokens, test protected routes:

#### Get Current User
1. **Open** "Authentication" → "Get Current User"
2. **Check headers** - should have:
   ```
   Authorization: Bearer {{accessToken}}
   ```
3. **Click "Send"**
4. Should return your user profile

#### Create an Event
1. **Open** "Events" → "Create Event"
2. **Check headers** - should have Authorization header
3. **Body** is form-data with:
   - `title`: "Test Event"
   - `description`: "Test description"
   - `location`: "Test Location"
   - `goalAmount`: "10000"
   - `tags`: "Education,Health"
   - `images`: (optional file upload)
4. **Click "Send"**
5. **Copy the event ID** from response for later tests

#### Support an Event
1. **Open** "Events" → "Support Event"
2. **Update the `:id` variable** in the URL:
   - Click on the URL
   - Replace `:id` with actual event ID (e.g., `clx123abc`)
3. **Click "Send"**
4. Should return: `{"message": "Event supported successfully"}`

#### Create a Donation
1. **Open** "Donations" → "Create Donation"
2. **Update request body:**
   ```json
   {
     "eventId": "your-event-id-here",
     "amount": 50,
     "paymentMethod": "card",
     "isRecurring": false,
     "isAnonymous": false,
     "message": "Great cause!",
     "email": "donor@example.com",
     "name": "John Doe"
   }
   ```
3. **Click "Send"**
4. Should return donation details with transaction ID

## 🔄 Token Refresh Flow

### When Access Token Expires

1. **Open** "Authentication" → "Refresh Token"
2. **Request body** should have:
   ```json
   {
     "refreshToken": "{{refreshToken}}"
   }
   ```
3. **Click "Send"**
4. **Get new `token`** from response
5. **Update `accessToken`** variable with new token

## 📝 Tips & Best Practices

### 1. Use Collection Variables
- Always use `{{baseUrl}}` instead of hardcoding URLs
- Tokens are auto-managed by the Login request script

### 2. Test in Order
Recommended testing order:
1. Register/Login (get tokens)
2. Get Current User (verify auth works)
3. Create Event
4. Get Events (verify it appears)
5. Support Event
6. Create Comment
7. Create Donation
8. Get Notifications (should see donation notification)

### 3. Update Variables Dynamically
- After Login, tokens are auto-saved
- After creating resources, copy IDs for use in other requests

### 4. Check Response Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid/missing token)
- `404` - Not Found
- `500` - Server Error

### 5. View Response in Pretty Format
- Postman automatically formats JSON responses
- Use the "Pretty" tab for readable JSON
- Use "Raw" tab to see exact response

### 6. Save Responses as Examples
1. After a successful request, click **"Save Response"**
2. Select **"Save as Example"**
3. This creates example responses for documentation

## 🐛 Troubleshooting

### "Invalid token" Error
- **Solution:** Re-login to get fresh tokens
- Or use "Refresh Token" endpoint

### "Route not found" (404)
- **Check:** Is the backend server running?
- **Check:** Is the URL correct? Should be `/api/...`
- **Check:** Collection variable `baseUrl` is set correctly

### "Connection refused"
- **Check:** Backend server is running on port 3001
- **Check:** No firewall blocking the connection
- **Try:** `curl http://localhost:3001/health`

### Variables Not Updating
- **Check:** Collection variables (not environment variables)
- **Check:** Login request has the auto-save script
- **Manual fix:** Copy tokens from response and paste into variables

### CORS Errors
- **Check:** Backend CORS is configured for your origin
- **Check:** `.env` has correct `CORS_ORIGINS`

## 📊 Testing Checklist

Use this checklist to verify all features:

- [ ] Health check works
- [ ] User registration
- [ ] User login (tokens auto-saved)
- [ ] Get current user profile
- [ ] Create event
- [ ] List events
- [ ] Get event by ID
- [ ] Support event
- [ ] Pass/unsupport event
- [ ] Bookmark event
- [ ] Create post
- [ ] Like post
- [ ] Create comment
- [ ] Award comment
- [ ] Create donation
- [ ] Get donations
- [ ] Get notifications
- [ ] Mark notification as read
- [ ] Get user settings
- [ ] Update settings
- [ ] Follow user
- [ ] Create squad
- [ ] Join squad

## 🎯 Quick Test Script

Here's a quick test sequence:

1. **Register** → Save user ID
2. **Login** → Tokens auto-saved
3. **Get Current User** → Verify auth
4. **Create Event** → Save event ID
5. **Support Event** → Use saved event ID
6. **Create Comment** → Use saved event ID
7. **Create Donation** → Use saved event ID
8. **Get Notifications** → Should see donation notification

## 💡 Pro Tips

1. **Create a Postman Environment** for different stages:
   - Development: `http://localhost:3001/api`
   - Staging: `https://api-staging.causeconnect.com/api`
   - Production: `https://api.causeconnect.com/api`

2. **Use Pre-request Scripts** to auto-generate test data:
   ```javascript
   pm.variables.set("randomEmail", `test${Date.now()}@example.com`);
   ```

3. **Use Tests Tab** to verify responses:
   ```javascript
   pm.test("Status code is 200", function () {
       pm.response.to.have.status(200);
   });
   ```

4. **Export Collection** after adding your own requests for team sharing

## 📚 Additional Resources

- [Postman Documentation](https://learning.postman.com/docs/)
- [Postman Variables Guide](https://learning.postman.com/docs/sending-requests/variables/)
- [Postman Scripts](https://learning.postman.com/docs/writing-scripts/intro-to-scripts/)

Happy Testing! 🚀














