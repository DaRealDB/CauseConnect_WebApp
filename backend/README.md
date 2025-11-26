# CauseConnect Backend API

Express.js backend server for the CauseConnect charity platform.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- PostgreSQL 14+
- Git

### Installation

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and configure:
   - `DATABASE_URL` - PostgreSQL connection string
   - `JWT_ACCESS_SECRET` - Random secret for access tokens
   - `JWT_REFRESH_SECRET` - Random secret for refresh tokens

3. **Set up Prisma:**
   ```bash
   # Generate Prisma Client
   npm run prisma:generate
   
   # Run database migrations
   npm run prisma:migrate
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:3001` and the API will be available at `http://localhost:3001/api`.

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/    # Route controllers
│   ├── middleware/      # Express middleware
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── utils/           # Utility functions
│   └── server.ts        # Entry point
├── prisma/
│   └── schema.prisma    # Database schema
├── uploads/             # Uploaded files (created automatically)
└── dist/                # Compiled JavaScript (created on build)
```

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication:

- **Access Token**: Short-lived (15 minutes), sent in `Authorization: Bearer <token>` header
- **Refresh Token**: Long-lived (7 days), stored in database, used to get new access tokens

### Protected Routes

Most routes require authentication. Include the access token in the request header:

```
Authorization: Bearer <access_token>
```

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user

### Users
- `GET /api/users/:username` - Get user profile
- `PUT /api/users/profile` - Update profile (protected)
- `POST /api/users/avatar` - Upload avatar (protected)
- `POST /api/users/cover` - Upload cover image (protected)
- `POST /api/users/:id/follow` - Follow user (protected)
- `DELETE /api/users/:id/follow` - Unfollow user (protected)

### Events
- `GET /api/events` - List events (query: page, limit, filter, tags)
- `GET /api/events/:id` - Get event details
- `POST /api/events` - Create event (protected)
- `POST /api/events/:id/support` - Support event (protected)
- `DELETE /api/events/:id/support` - Pass/unsupport event (protected)
- `POST /api/events/:id/bookmark` - Bookmark event (protected)
- `DELETE /api/events/:id/bookmark` - Unbookmark event (protected)

### Posts
- `GET /api/posts` - List posts (query: page, limit, userId)
- `POST /api/posts` - Create post (protected)
- `POST /api/posts/:id/like` - Like post (protected)
- `DELETE /api/posts/:id/like` - Unlike post (protected)
- `POST /api/posts/:id/bookmark` - Bookmark post (protected)
- `DELETE /api/posts/:id/bookmark` - Unbookmark post (protected)

### Comments
- `GET /api/comments/events/:eventId/comments` - Get comments for event
- `POST /api/comments/events/:eventId/comments` - Create comment (protected)
- `POST /api/comments/:id/like` - Like comment (protected)
- `POST /api/comments/:id/dislike` - Dislike comment (protected)
- `POST /api/comments/:id/award` - Award comment (protected)
- `POST /api/comments/:id/save` - Save comment (protected)

### Donations
- `POST /api/donations` - Create donation (protected)
- `GET /api/donations` - Get user donations (protected)
- `GET /api/donations/user/:userId` - Get donations by user
- `GET /api/donations/event/:eventId` - Get donations for event

### Squads
- `GET /api/squads` - Get user's squads (protected)
- `POST /api/squads` - Create squad (protected)
- `POST /api/squads/:id/join` - Join squad (protected)
- `DELETE /api/squads/:id/join` - Leave squad (protected)

### Settings
- `GET /api/settings` - Get user settings (protected)
- `PUT /api/settings` - Update settings (protected)

### Notifications
- `GET /api/notifications` - Get notifications (protected, query: page, limit, type)
- `PATCH /api/notifications/:id/read` - Mark as read (protected)
- `PATCH /api/notifications/read-all` - Mark all as read (protected)
- `DELETE /api/notifications/:id` - Delete notification (protected)
- `GET /api/notifications/unread-count` - Get unread count (protected)

## 🗄️ Database

### Prisma Commands

```bash
# Generate Prisma Client
npm run prisma:generate

# Create and run migrations
npm run prisma:migrate

# Open Prisma Studio (database GUI)
npm run prisma:studio

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

### Database Schema

The database includes the following main models:
- `User` - User accounts
- `Event` - Charity events/campaigns
- `Post` - User posts
- `Comment` - Comments on events/posts
- `Donation` - Donations to events
- `Squad` - User groups/communities
- `Notification` - User notifications
- `UserSettings` - User preferences
- And more...

See `prisma/schema.prisma` for the complete schema.

## 🔧 Development

### Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Type check without building

### Environment Variables

See `.env.example` for all required environment variables.

## 🚢 Production

1. **Build the project:**
   ```bash
   npm run build
   ```

2. **Set production environment variables:**
   - Update `.env` with production values
   - Use strong, random secrets for JWT tokens
   - Configure production database URL

3. **Run migrations:**
   ```bash
   npm run prisma:migrate
   ```

4. **Start the server:**
   ```bash
   npm start
   ```

## 📝 API Response Format

### Success Response
```json
{
  "data": {...},
  "message": "Success message"
}
```

### Error Response
```json
{
  "message": "Error message",
  "errors": {
    "field": ["Error details"]
  }
}
```

## 🔒 Security

- Passwords are hashed using bcrypt
- JWT tokens are signed with secrets
- CORS is configured for allowed origins
- File uploads are validated (images only, size limits)
- Input validation using express-validator

## 📦 File Uploads

Uploaded files are stored in the `uploads/` directory and served at `/uploads/:filename`.

Supported formats: Images only (JPEG, PNG, GIF, etc.)
Max file size: 5MB (configurable via `MAX_FILE_SIZE`)

## 🧪 Testing

Use the provided Postman collection (`postman_collection.json`) to test all endpoints.

## 📄 License

ISC

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📞 Support

For issues or questions, please open an issue on the repository.










