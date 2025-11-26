#!/bin/bash
# Script to remove temporary markdown files

echo "Cleaning up temporary files..."

# List of temporary files to remove (excluding README, CONTRIBUTING, LICENSE)
TEMP_FILES=(
  "BACKEND_FIX_SUMMARY.md"
  "BACKEND_LOG_CHECK.md"
  "BACKEND_RESTART_REQUIRED.md"
  "CHECK_BACKEND_LOGS.md"
  "COMPLETION_SUMMARY.md"
  "CRITICAL_FIX.md"
  "DEBUG_STEPS.md"
  "DIAGNOSTIC_QUERY.md"
  "FINAL_FIX_INSTRUCTIONS.md"
  "FINAL_IMPLEMENTATION_STATUS.md"
  "FIXED_TAGS_ISSUE.md"
  "FIXES_SUMMARY.md"
  "IMMEDIATE_ACTION.md"
  "IMPLEMENTATION_PROGRESS.md"
  "INTEGRATION_GUIDE.md"
  "ONBOARDING_TAGS_FIX.md"
  "PAYMENT_SYSTEM_IMPLEMENTATION.md"
  "QUICK_FIX.md"
  "REMAINING_TASKS.md"
  "ROOT_CAUSE_FOUND.md"
  "STRIPE_SETUP_INSTRUCTIONS.md"
  "TAGS_DEBUG_GUIDE.md"
  "TAGS_FIX_UPDATE.md"
  "TAG_SYSTEM_ANALYSIS.md"
  "TAG_SYSTEM_FIXES.md"
  "TAG_SYSTEM_IMPLEMENTATION.md"
  "URGENT_CHECK_BACKEND_LOGS.md"
)

for file in "${TEMP_FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "Removing: $file"
    rm "$file"
  fi
done

echo "Cleanup complete!"
