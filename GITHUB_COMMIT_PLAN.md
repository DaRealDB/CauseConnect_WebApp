# GitHub Commit Plan

This document outlines the recommended commit strategy for preparing CauseConnect for GitHub release.

## Initial Repository Setup

### Commit 1: Initial Project Structure
```bash
git add .gitignore LICENSE
git commit -m "chore: add .gitignore and MIT license"
```

### Commit 2: Environment Configuration Examples
```bash
git add .env.example backend/.env.example
git commit -m "chore: add environment variable examples"
```

### Commit 3: Documentation Foundation
```bash
git add README.md CONTRIBUTING.md
git commit -m "docs: add comprehensive README and contributing guidelines"
```

## Backend Setup

### Commit 4: Backend Core Structure
```bash
git add backend/src/ backend/package.json backend/tsconfig.json
git commit -m "feat(backend): initial Express.js backend setup"
```

### Commit 5: Database Schema
```bash
git add backend/prisma/schema.prisma
git commit -m "feat(db): Prisma schema with complete data models"
```

### Commit 6: Database Migrations
```bash
git add backend/prisma/migrations/
git commit -m "feat(db): initial database migrations"
```

### Commit 7: Authentication System
```bash
git add backend/src/services/auth.service.ts backend/src/services/verification.service.ts backend/src/services/passwordReset.service.ts
git add backend/src/controllers/auth.controller.ts backend/src/routes/auth.routes.ts
git add backend/src/middleware/auth.ts backend/src/middleware/emailVerification.ts
git add backend/src/utils/jwt.ts backend/src/utils/password.ts backend/src/utils/email.ts backend/src/utils/otp.ts
git commit -m "feat(auth): implement JWT authentication with email verification"
```

### Commit 8: User Management
```bash
git add backend/src/services/user.service.ts backend/src/controllers/user.controller.ts backend/src/routes/user.routes.ts
git commit -m "feat(users): user profile management and settings"
```

### Commit 9: Event System
```bash
git add backend/src/services/event.service.ts backend/src/controllers/event.controller.ts backend/src/routes/event.routes.ts
git commit -m "feat(events): event creation and management system"
```

### Commit 10: Post System
```bash
git add backend/src/services/post.service.ts backend/src/controllers/post.controller.ts backend/src/routes/post.routes.ts
git commit -m "feat(posts): post creation and interaction system"
```

### Commit 11: Comment System
```bash
git add backend/src/services/comment.service.ts backend/src/controllers/comment.controller.ts backend/src/routes/comment.routes.ts
git commit -m "feat(comments): comment system with reactions and awards"
```

### Commit 12: Squad System
```bash
git add backend/src/services/squad.service.ts backend/src/controllers/squad.controller.ts backend/src/routes/squad.routes.ts
git commit -m "feat(squads): community squad creation and management"
```

### Commit 13: Payment Integration
```bash
git add backend/src/services/payment.service.ts backend/src/controllers/payment.controller.ts backend/src/routes/payment.routes.ts
git add backend/src/config/stripe.ts
git commit -m "feat(payments): Stripe integration for donations and subscriptions"
```

### Commit 14: Notification System
```bash
git add backend/src/services/notification.service.ts backend/src/controllers/notification.controller.ts backend/src/routes/notification.routes.ts
git add backend/src/utils/notifications.ts
git commit -m "feat(notifications): real-time notification system"
```

### Commit 15: Additional Features
```bash
git add backend/src/services/donation.service.ts backend/src/controllers/donation.controller.ts backend/src/routes/donation.routes.ts
git add backend/src/services/settings.service.ts backend/src/controllers/settings.controller.ts backend/src/routes/settings.routes.ts
git add backend/src/services/tag.service.ts backend/src/controllers/tag.controller.ts backend/src/routes/tag.routes.ts
git add backend/src/services/customFeed.service.ts backend/src/controllers/customFeed.controller.ts backend/src/routes/customFeed.routes.ts
git add backend/src/services/explore.service.ts backend/src/controllers/explore.controller.ts backend/src/routes/explore.routes.ts
git commit -m "feat: additional features (donations, settings, tags, feeds, explore)"
```

### Commit 16: Server Configuration
```bash
git add backend/src/server.ts backend/src/config/ backend/src/middleware/errorHandler.ts backend/src/middleware/upload.ts
git add backend/start-dev.sh
git commit -m "feat(backend): server configuration and middleware setup"
```

### Commit 17: Backend Documentation
```bash
git add backend/README.md backend/SETUP.md backend/DATABASE_SETUP.md backend/POSTMAN_TESTING_GUIDE.md
git add backend/postman_collection.json
git commit -m "docs(backend): backend documentation and API testing guide"
```

## Frontend Setup

### Commit 18: Next.js Core Setup
```bash
git add package.json next.config.mjs tsconfig.json tailwind.config.js postcss.config.mjs
git add next-env.d.ts
git commit -m "feat(frontend): Next.js 15 project setup with TypeScript and Tailwind"
```

### Commit 19: UI Components Library
```bash
git add components/ui/
git commit -m "feat(ui): comprehensive UI component library"
```

### Commit 20: Core Components
```bash
git add components/event-card.tsx components/comment-system.tsx components/user-post.tsx components/squad-card.tsx
git add components/payment-methods.tsx components/donation-history.tsx components/recurring-donations.tsx
git add components/interest-tags.tsx components/feed-header.tsx components/admin-event-panel.tsx components/image-cropper.tsx
git commit -m "feat(components): core feature components"
```

### Commit 21: Context Providers
```bash
git add contexts/ components/providers.tsx components/theme-provider.tsx
git commit -m "feat(context): authentication, theme, and currency context providers"
```

### Commit 22: API Client
```bash
git add lib/api/
git commit -m "feat(api): API client with JWT token management"
```

### Commit 23: Utilities
```bash
git add lib/utils.ts lib/utils/ hooks/
git commit -m "feat(utils): utility functions and custom hooks"
```

### Commit 24: Authentication Pages
```bash
git add app/login/ app/register/ app/forgot-password/
git commit -m "feat(auth): authentication pages with email verification"
```

### Commit 25: Main Application Pages
```bash
git add app/page.tsx app/feed/ app/discover/ app/explore/
git commit -m "feat(pages): main feed and discovery pages"
```

### Commit 26: Event Pages
```bash
git add app/event/ app/donate/ app/create/
git commit -m "feat(events): event pages with donation functionality"
```

### Commit 27: Profile and Settings
```bash
git add app/profile/ app/settings/
git commit -m "feat(profile): user profile and settings pages"
```

### Commit 28: Social Features
```bash
git add app/squads/ app/network/ app/notifications/
git commit -m "feat(social): squads, network, and notifications"
```

### Commit 29: Additional Pages
```bash
git add app/onboarding/ app/bookmarks/ app/history/ app/my-causes/ app/custom-feeds/
git add app/images/ app/chat/ app/saved-events/
git commit -m "feat(pages): onboarding, bookmarks, history, and additional pages"
```

### Commit 30: Styling
```bash
git add app/globals.css styles/globals.css
git commit -m "style: global styles and theme configuration"
```

### Commit 31: Public Assets
```bash
git add public/
git commit -m "chore: public assets and images"
```

## Cleanup and Finalization

### Commit 32: Remove Temporary Files
```bash
# Remove all temporary markdown files (use the cleanup script)
./CLEANUP_TEMP_FILES.sh
git add -u
git commit -m "chore: remove temporary documentation files"
```

### Commit 33: Cleanup Script
```bash
git add CLEANUP_TEMP_FILES.sh
git commit -m "chore: add cleanup script for temporary files"
```

### Commit 34: GitHub Workflows (Optional)
```bash
git add .github/
git commit -m "ci: add GitHub Actions workflows"
```

### Commit 35: Final Documentation
```bash
git add GITHUB_COMMIT_PLAN.md
git commit -m "docs: add GitHub commit plan documentation"
```

## Tagging for Release

After all commits are done:

```bash
# Tag the initial release
git tag -a v1.0.0 -m "Initial release: CauseConnect v1.0.0"
git push origin main --tags
```

## Alternative: Fewer, Larger Commits

If you prefer fewer commits, you can group related changes:

1. `chore: initial project setup and configuration`
2. `feat(backend): complete backend implementation`
3. `feat(frontend): complete frontend implementation`
4. `docs: add comprehensive documentation`
5. `chore: cleanup and prepare for release`

Choose the approach that best fits your workflow!

