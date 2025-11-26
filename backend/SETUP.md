# CauseConnect Backend Setup Guide

## Complete Setup Instructions

### Step 1: Install Dependencies

```bash
cd backend
npm install
```

### Step 2: Configure Environment

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and set the following:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/causeconnect?schema=public"
   JWT_ACCESS_SECRET="your-random-secret-here-min-32-chars"
   JWT_REFRESH_SECRET="your-random-refresh-secret-here-min-32-chars"
   ```

   **Generate secure secrets:**
   ```bash
   # On Linux/Mac
   openssl rand -base64 32
   
   # Or use Node.js
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```

### Step 3: Set Up PostgreSQL Database

1. **Install PostgreSQL** (if not already installed):
   - macOS: `brew install postgresql`
   - Ubuntu: `sudo apt-get install postgresql`
   - Windows: Download from postgresql.org

2. **Create database:**
   ```bash
   # Connect to PostgreSQL
   psql -U postgres
   
   # Create database
   CREATE DATABASE causeconnect;
   
   # Create user (optional)
   CREATE USER causeconnect_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE causeconnect TO causeconnect_user;
   ```

3. **Update DATABASE_URL in .env:**
   ```env
   DATABASE_URL="postgresql://causeconnect_user:your_password@localhost:5432/causeconnect?schema=public"
   ```

### Step 4: Initialize Prisma

```bash
# Generate Prisma Client
npm run prisma:generate

# Create and run migrations
npm run prisma:migrate

# (Optional) Open Prisma Studio to view database
npm run prisma:studio
```

### Step 5: Start Development Server

```bash
npm run dev
```

The server should start on `http://localhost:3001`

### Step 6: Test the API

1. **Health Check:**
   ```bash
   curl http://localhost:3001/health
   ```

2. **Import Postman Collection:**
   - Open Postman
   - Import `postman_collection.json`
   - Start testing endpoints

## Common Issues

### Database Connection Error
- Verify PostgreSQL is running: `pg_isready`
- Check DATABASE_URL format in `.env`
- Ensure database exists: `psql -l | grep causeconnect`

### Prisma Migration Errors
- Reset database: `npx prisma migrate reset` (WARNING: deletes all data)
- Check schema syntax: `npx prisma validate`

### Port Already in Use
- Change PORT in `.env` to a different port (e.g., 3002)
- Or kill the process using port 3001

## Next Steps

1. Test authentication endpoints (register, login)
2. Create test events
3. Test donation flow
4. Verify frontend integration

## Production Deployment

See `README.md` for production deployment instructions.










