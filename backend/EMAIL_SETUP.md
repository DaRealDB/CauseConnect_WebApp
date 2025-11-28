# Email Configuration Setup

## Issue Found

The email service requires `SMTP_USER` to be set in your `.env` file, but it's currently missing.

## Required Configuration

Add the following to your `backend/.env` file:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=hrurtqscyboboxnh
```

## Steps to Configure

1. **Get your Gmail address**: The email address that generated the app password
   - This should be the same Gmail account where you created the app password

2. **Add to `.env` file**:
   ```bash
   cd backend
   # Edit .env and add:
   SMTP_USER=your-email@gmail.com
   ```

3. **Verify the complete SMTP configuration**:
   ```bash
   grep SMTP .env
   ```
   
   Should show:
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=hrurtqscyboboxnh
   ```

4. **Restart the backend server** for changes to take effect

## Testing Email Sending

After configuration, when you:
- Register a new user → Verification code will be sent via email
- Request password reset → Reset code will be sent via email

Check the backend logs for email sending status:
- ✅ Success: `[Email] ✅ Email sent successfully to...`
- ❌ Failure: `[Email] ❌ Failed to send email:...` (with error details)

## Troubleshooting

If emails still don't send after setting `SMTP_USER`:

1. **Verify app password is correct**: The app password should be 16 characters without spaces
   - Current value: `hrurtqscyboboxnh`
   - Make sure there are no extra spaces or characters

2. **Check Gmail settings**:
   - Ensure "Less secure app access" is enabled (if using older Gmail)
   - OR ensure you're using an App Password (recommended)
   - App passwords are required if 2FA is enabled

3. **Check backend logs**: Look for detailed error messages in the console

4. **Test SMTP connection**: The backend will automatically verify the SMTP connection when sending emails





