# Database Setup Guide

## Quick Setup (Manual)

You need to set up PostgreSQL database before the API will work. Here are the steps:

### Option 1: Using psql (Recommended)

1. **Connect to PostgreSQL:**
   ```bash
   sudo -u postgres psql
   ```

2. **Create database and user:**
   ```sql
   -- Create user
   CREATE USER causeconnect_user WITH PASSWORD 'your_secure_password_here';
   
   -- Create database
   CREATE DATABASE causeconnect;
   
   -- Grant privileges
   GRANT ALL PRIVILEGES ON DATABASE causeconnect TO causeconnect_user;
   ALTER DATABASE causeconnect OWNER TO causeconnect_user;
   
   -- Exit
   \q
   ```

3. **Update .env file:**
   ```bash
   cd backend
   nano .env  # or use your preferred editor
   ```
   
   Update the DATABASE_URL:
   ```env
   DATABASE_URL="postgresql://causeconnect_user:your_secure_password_here@localhost:5432/causeconnect?schema=public"
   ```

4. **Generate Prisma Client:**
   ```bash
   npm run prisma:generate
   ```

5. **Run migrations:**
   ```bash
   npm run prisma:migrate
   ```

6. **Restart the backend server:**
   ```bash
   npm run dev
   ```

### Option 2: Using Your Current PostgreSQL User

If you have a PostgreSQL user already set up:

1. **Create database:**
   ```bash
   createdb causeconnect
   ```

2. **Update .env:**
   ```env
   DATABASE_URL="postgresql://your_username@localhost:5432/causeconnect?schema=public"
   ```
   
   Or if you have a password:
   ```env
   DATABASE_URL="postgresql://your_username:your_password@localhost:5432/causeconnect?schema=public"
   ```

3. **Continue with steps 4-6 from Option 1**

### Option 3: Quick Test (Use Default Postgres User)

For quick testing only (not recommended for production):

1. **Update .env:**
   ```env
   DATABASE_URL="postgresql://postgres:your_postgres_password@localhost:5432/causeconnect?schema=public"
   ```

2. **Create database:**
   ```bash
   sudo -u postgres createdb causeconnect
   ```

3. **Continue with Prisma steps**

## Verify Connection

Test the connection:
```bash
cd backend
npm run prisma:generate
npm run prisma:migrate
```

If successful, you should see:
```
✔ Generated Prisma Client
✔ Applied migration
```

## Troubleshooting

### "Authentication failed"
- Check your PostgreSQL password is correct
- Verify the user exists: `sudo -u postgres psql -c "\du"`
- Try resetting password: `sudo -u postgres psql -c "ALTER USER causeconnect_user WITH PASSWORD 'new_password';"`

### "Database does not exist"
- Create it: `sudo -u postgres createdb causeconnect`

### "Permission denied"
- Grant privileges: `sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE causeconnect TO causeconnect_user;"`

### "Connection refused"
- Check PostgreSQL is running: `sudo systemctl status postgresql`
- Start it: `sudo systemctl start postgresql`

## After Setup

Once the database is set up:
1. Restart your backend server
2. Test registration in Postman
3. You should be able to create users, events, etc.















