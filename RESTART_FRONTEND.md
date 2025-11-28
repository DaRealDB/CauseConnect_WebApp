# Restart Next.js Frontend Server

## ⚠️ IMPORTANT: Restart Required

Your Firebase environment variables are set, but the Next.js dev server was started **before** they were added. You must restart it for the variables to be loaded.

## Steps to Restart

1. **Find the terminal where Next.js is running**
   - Look for a terminal showing `next dev` or `next-server`
   - This is usually a different terminal from your backend server

2. **Stop the server**
   - Press `Ctrl+C` in that terminal

3. **Restart the server**
   ```bash
   npm run dev
   ```

4. **Verify Firebase is working**
   - Navigate to `/chat` page
   - You should see the chat interface (not the setup screen)
   - Check browser console for: `[Firebase] Firebase initialized successfully`

## Additional Requirement: Enable Firestore

After restarting, you may still need to enable Firestore Database in Firebase Console:

1. Go to: https://console.firebase.google.com/project/causeconnect-49d35/firestore
2. Click "Create database"
3. Choose "Start in test mode" (for development)
4. Select your database location
5. Click "Enable"

Once both are done (server restarted + Firestore enabled), your chat system should work!


