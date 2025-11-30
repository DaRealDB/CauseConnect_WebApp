#!/bin/bash
# Generate all Edge Function templates
# This creates template files for all 87 functions

cd "$(dirname "$0")"
chmod +x supabase/functions/generate-template.sh

echo "🚀 Generating all Edge Function templates..."

# Authentication
./supabase/functions/generate-template.sh auth-register POST true
./supabase/functions/generate-template.sh auth-login POST false
./supabase/functions/generate-template.sh auth-refresh POST true
./supabase/functions/generate-template.sh auth-logout POST true
./supabase/functions/generate-template.sh auth-verify-email POST false
./supabase/functions/generate-template.sh auth-reset-password POST false

# Users (skip already created)
# ./supabase/functions/generate-template.sh user-profile GET false  # Already created
# ./supabase/functions/generate-template.sh user-search GET false   # Already created
./supabase/functions/generate-template.sh user-update PUT true
./supabase/functions/generate-template.sh user-avatar POST true
./supabase/functions/generate-template.sh user-cover POST true
./supabase/functions/generate-template.sh user-follow POST true
./supabase/functions/generate-template.sh user-activity GET false

# Events (skip already created)
# ./supabase/functions/generate-template.sh event-list GET false     # Already created
# ./supabase/functions/generate-template.sh event-detail GET false   # Already created
./supabase/functions/generate-template.sh event-create POST true
./supabase/functions/generate-template.sh event-update PUT true
./supabase/functions/generate-template.sh event-delete DELETE true
./supabase/functions/generate-template.sh event-support POST true
./supabase/functions/generate-template.sh event-unsupport DELETE true
./supabase/functions/generate-template.sh event-bookmark POST true
./supabase/functions/generate-template.sh event-unbookmark DELETE true
./supabase/functions/generate-template.sh event-bookmarked GET true

# Posts
./supabase/functions/generate-template.sh post-list GET false
./supabase/functions/generate-template.sh post-detail GET false
./supabase/functions/generate-template.sh post-create POST true
./supabase/functions/generate-template.sh post-like POST true
./supabase/functions/generate-template.sh post-unlike DELETE true
./supabase/functions/generate-template.sh post-bookmark POST true
./supabase/functions/generate-template.sh post-participate POST true

# Comments
./supabase/functions/generate-template.sh comment-list GET false
./supabase/functions/generate-template.sh comment-create POST true
./supabase/functions/generate-template.sh comment-like POST true
./supabase/functions/generate-template.sh comment-dislike POST true
./supabase/functions/generate-template.sh comment-award POST true
./supabase/functions/generate-template.sh comment-save POST true

# Donations
./supabase/functions/generate-template.sh donation-create POST true
./supabase/functions/generate-template.sh donation-list GET true
./supabase/functions/generate-template.sh donation-history GET true

# Payments
./supabase/functions/generate-template.sh payment-intent POST true
./supabase/functions/generate-template.sh payment-confirm POST true
./supabase/functions/generate-template.sh payment-webhook POST false
./supabase/functions/generate-template.sh payment-methods GET true
./supabase/functions/generate-template.sh payment-recurring GET true
./supabase/functions/generate-template.sh payment-paypal POST true

# Squads
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

# Settings (skip already created)
# ./supabase/functions/generate-template.sh settings-get GET true    # Already created
./supabase/functions/generate-template.sh settings-update PUT true
./supabase/functions/generate-template.sh settings-impact GET true
./supabase/functions/generate-template.sh settings-export GET true
./supabase/functions/generate-template.sh settings-blocked-users GET true

# Notifications
./supabase/functions/generate-template.sh notification-list GET true
./supabase/functions/generate-template.sh notification-read PATCH true
./supabase/functions/generate-template.sh notification-read-all PATCH true
./supabase/functions/generate-template.sh notification-unread-count GET true

# Tags
./supabase/functions/generate-template.sh tag-list GET false
./supabase/functions/generate-template.sh tag-create-or-find POST true

# Explore
./supabase/functions/generate-template.sh explore-content GET false

# Custom Feeds
./supabase/functions/generate-template.sh custom-feed-list GET true
./supabase/functions/generate-template.sh custom-feed-create POST true
./supabase/functions/generate-template.sh custom-feed-update PUT true
./supabase/functions/generate-template.sh custom-feed-delete DELETE true

# Chat (skip already created)
# ./supabase/functions/generate-template.sh chat-user-profile GET true  # Already created
./supabase/functions/generate-template.sh chat-block-user POST true
./supabase/functions/generate-template.sh chat-unblock-user DELETE true

echo ""
echo "✅ All function templates generated!"
echo "📝 Next: Implement logic in each function based on Express backend services"
echo "📚 See COMPREHENSIVE_EDGE_FUNCTIONS_GENERATOR.md for implementation patterns"


