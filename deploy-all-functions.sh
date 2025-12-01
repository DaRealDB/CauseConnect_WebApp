#!/bin/bash

# Complete Edge Functions Deployment Script
# Deploys all 91 Edge Functions to Supabase

echo "🚀 Starting deployment of all Edge Functions..."
echo ""

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# List of all 91 functions to deploy
FUNCTIONS=(
  # System
  "health"
  
  # Auth (11 functions)
  "auth-login"
  "auth-register"
  "auth-me"
  "auth-refresh"
  "auth-logout"
  "auth-send-verification"
  "auth-verify-email"
  "auth-forgot-password"
  "auth-verify-reset"
  "auth-reset-password"
  
  # Users (5 functions)
  "user-profile"
  "user-search"
  "user-update"
  "user-follow"
  "user-activity"
  
  # Events (12 functions)
  "event-list"
  "event-detail"
  "event-create"
  "event-update"
  "event-delete"
  "event-support"
  "event-unsupport"
  "event-bookmark"
  "event-unbookmark"
  "event-bookmarked"
  "event-participants"
  "event-analytics"
  
  # Posts (11 functions)
  "post-list"
  "post-detail"
  "post-create"
  "post-like"
  "post-unlike"
  "post-bookmark"
  "post-unbookmark"
  "post-bookmarked"
  "post-participate"
  "post-participants"
  "storage-upload"
  
  # Comments (5 functions)
  "comment-list"
  "comment-create"
  "comment-like"
  "comment-award"
  "comment-save"
  
  # Donations (3 functions)
  "donation-create"
  "donation-list"
  "donation-history"
  
  # Payments (6 functions)
  "payment-intent"
  "payment-confirm"
  "payment-methods"
  "payment-recurring-create"
  "payment-recurring-list"
  "payment-recurring-cancel"
  
  # Notifications (4 functions)
  "notification-list"
  "notification-unread-count"
  "notification-read"
  "notification-read-all"
  
  # Settings (9 functions)
  "settings-get"
  "settings-update"
  "settings-block-user"
  "settings-unblock-user"
  "settings-blocked-users"
  "settings-export-data"
  "settings-impact"
  "settings-login-activity"
  "settings-revoke-session"
  
  # Squads (15 functions)
  "squad-list"
  "squad-detail"
  "squad-create"
  "squad-update"
  "squad-delete"
  "squad-join"
  "squad-leave"
  "squad-search"
  "squad-members"
  "squad-posts"
  "squad-post-create"
  "squad-comments"
  "squad-comment-create"
  "squad-reaction"
  "squad-manage-member"
  
  # Custom Feeds (5 functions)
  "custom-feed-create"
  "custom-feed-list"
  "custom-feed-detail"
  "custom-feed-update"
  "custom-feed-delete"
  
  # Chat (3 functions)
  "chat-user-profile"
  "chat-block-user"
  "chat-unblock-user"
  
  # Explore & Tags (2 functions)
  "tag-list"
  "explore-content"
)

# Counters
TOTAL=${#FUNCTIONS[@]}
SUCCESS=0
FAILED=0
SKIPPED=0

echo "📦 Total functions to deploy: $TOTAL"
echo ""

# Deploy each function
for func in "${FUNCTIONS[@]}"; do
  echo -n "Deploying $func... "
  
  # Check if function directory exists
  if [ ! -d "supabase/functions/$func" ]; then
    echo -e "${YELLOW}SKIPPED${NC} (directory not found)"
    ((SKIPPED++))
    continue
  fi
  
  # Deploy function
  if supabase functions deploy "$func" --no-verify-jwt 2>&1 | grep -q "Deployed Functions"; then
    echo -e "${GREEN}✅ SUCCESS${NC}"
    ((SUCCESS++))
  else
    echo -e "${RED}❌ FAILED${NC}"
    ((FAILED++))
  fi
  
  # Small delay to avoid rate limiting
  sleep 1
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Deployment Summary:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Successfully deployed: $SUCCESS"
echo "❌ Failed: $FAILED"
echo "⏭️  Skipped: $SKIPPED"
echo "📦 Total: $TOTAL"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}🎉 All functions deployed successfully!${NC}"
  exit 0
else
  echo -e "${RED}⚠️  Some functions failed to deploy. Check errors above.${NC}"
  exit 1
fi
