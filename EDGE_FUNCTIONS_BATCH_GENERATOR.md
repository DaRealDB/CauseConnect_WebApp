# 🚀 Edge Functions Batch Generator Guide

## Overview

This guide shows how to quickly generate all 87 Edge Functions needed for the migration.

---

## 📋 FUNCTION LIST TO GENERATE

### Authentication (6 functions)
```bash
./supabase/functions/generate-template.sh auth-register POST true
./supabase/functions/generate-template.sh auth-login POST false
./supabase/functions/generate-template.sh auth-refresh POST true
./supabase/functions/generate-template.sh auth-logout POST true
./supabase/functions/generate-template.sh auth-verify-email POST false
./supabase/functions/generate-template.sh auth-reset-password POST false
```

### Users (5 more functions - 3 already done)
```bash
./supabase/functions/generate-template.sh user-update PUT true
./supabase/functions/generate-template.sh user-avatar POST true
./supabase/functions/generate-template.sh user-cover POST true
./supabase/functions/generate-template.sh user-follow POST true
./supabase/functions/generate-template.sh user-activity GET false
```

### Events (8 more functions - 2 already done)
```bash
./supabase/functions/generate-template.sh event-create POST true
./supabase/functions/generate-template.sh event-update PUT true
./supabase/functions/generate-template.sh event-delete DELETE true
./supabase/functions/generate-template.sh event-support POST true
./supabase/functions/generate-template.sh event-unsupport DELETE true
./supabase/functions/generate-template.sh event-bookmark POST true
./supabase/functions/generate-template.sh event-unbookmark DELETE true
./supabase/functions/generate-template.sh event-bookmarked GET true
```

### Posts (7 functions)
```bash
./supabase/functions/generate-template.sh post-list GET false
./supabase/functions/generate-template.sh post-detail GET false
./supabase/functions/generate-template.sh post-create POST true
./supabase/functions/generate-template.sh post-like POST true
./supabase/functions/generate-template.sh post-unlike DELETE true
./supabase/functions/generate-template.sh post-bookmark POST true
./supabase/functions/generate-template.sh post-participate POST true
```

### Comments (6 functions)
```bash
./supabase/functions/generate-template.sh comment-list GET false
./supabase/functions/generate-template.sh comment-create POST true
./supabase/functions/generate-template.sh comment-like POST true
./supabase/functions/generate-template.sh comment-dislike POST true
./supabase/functions/generate-template.sh comment-award POST true
./supabase/functions/generate-template.sh comment-save POST true
```

### Donations (3 functions)
```bash
./supabase/functions/generate-template.sh donation-create POST true
./supabase/functions/generate-template.sh donation-list GET true
./supabase/functions/generate-template.sh donation-history GET true
```

### Payments (6 functions)
```bash
./supabase/functions/generate-template.sh payment-intent POST true
./supabase/functions/generate-template.sh payment-confirm POST true
./supabase/functions/generate-template.sh payment-webhook POST false
./supabase/functions/generate-template.sh payment-methods GET true
./supabase/functions/generate-template.sh payment-recurring GET true
./supabase/functions/generate-template.sh payment-paypal POST true
```

### Squads (15 functions)
```bash
./supabase/functions/generate-template.sh squad-list GET true
./supabase/functions/generate-template.sh squad-detail GET true
./supabase/functions/generate-template.sh squad-create POST true
./supabase/functions/generate-template.sh squad-update PATCH true
./supabase/functions/generate-template.sh squad-delete DELETE true
./supabase/functions/generate-template.sh squad-search GET true
./supabase/functions/generate-template.sh squad-join POST true
./supabase/functions/generate-template.sh squad-leave DELETE true
./supabase/functions/generate-template.sh squad-members GET true
./supabase/functions/generate-template.sh squad-posts GET true
./supabase/functions/generate-template.sh squad-post-create POST true
./supabase/functions/generate-template.sh squad-comments GET true
./supabase/functions/generate-template.sh squad-comment-create POST true
./supabase/functions/generate-template.sh squad-reaction POST true
./supabase/functions/generate-template.sh squad-manage-member PATCH true
```

### Settings (4 more functions - 1 already done)
```bash
./supabase/functions/generate-template.sh settings-update PUT true
./supabase/functions/generate-template.sh settings-impact GET true
./supabase/functions/generate-template.sh settings-export GET true
./supabase/functions/generate-template.sh settings-blocked-users GET true
```

### Notifications (4 functions)
```bash
./supabase/functions/generate-template.sh notification-list GET true
./supabase/functions/generate-template.sh notification-read PATCH true
./supabase/functions/generate-template.sh notification-read-all PATCH true
./supabase/functions/generate-template.sh notification-unread-count GET true
```

### Tags (2 functions)
```bash
./supabase/functions/generate-template.sh tag-list GET false
./supabase/functions/generate-template.sh tag-create-or-find POST true
```

### Explore (1 function)
```bash
./supabase/functions/generate-template.sh explore-content GET false
```

### Custom Feeds (4 functions)
```bash
./supabase/functions/generate-template.sh custom-feed-list GET true
./supabase/functions/generate-template.sh custom-feed-create POST true
./supabase/functions/generate-template.sh custom-feed-update PUT true
./supabase/functions/generate-template.sh custom-feed-delete DELETE true
```

### Chat (2 more functions - 1 already done)
```bash
./supabase/functions/generate-template.sh chat-block-user POST true
./supabase/functions/generate-template.sh chat-unblock-user DELETE true
```

**Total: 80 more functions to generate**

---

## 🚀 QUICK GENERATE ALL

Run this script to generate all templates:

```bash
# Make script executable
chmod +x supabase/functions/generate-template.sh

# Generate all functions
./generate-all-functions.sh
```

---

## 📝 NEXT STEPS AFTER GENERATION

1. **Review each function** - Add actual implementation logic
2. **Test functions** - Deploy and test individually
3. **Update services** - Route to new functions
4. **Deploy to Supabase** - Deploy all functions

---

## ✅ COMPLETED FUNCTIONS (Don't regenerate)

- ✅ `health`
- ✅ `user-profile`
- ✅ `user-search`
- ✅ `event-list`
- ✅ `event-detail`
- ✅ `settings-get`
- ✅ `chat-user-profile`

---

**Note:** After generating templates, you'll need to implement the actual logic in each function based on the Express backend service files.


