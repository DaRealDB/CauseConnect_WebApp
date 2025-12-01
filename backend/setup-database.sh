#!/bin/bash

# Database setup script for CauseConnect
# This script creates the database and user for the application

echo "🔧 Setting up CauseConnect database..."

# Database configuration
DB_NAME="causeconnect"
DB_USER="causeconnect_user"
DB_PASSWORD=$(openssl rand -base64 12 | tr -d "=+/" | cut -c1-16)

# Create database and user
sudo -u postgres psql << EOF
-- Create user if not exists
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_user WHERE usename = '$DB_USER') THEN
        CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
    END IF;
END
\$\$;

-- Create database if not exists
SELECT 'CREATE DATABASE $DB_NAME'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$DB_NAME')\gexec

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
ALTER DATABASE $DB_NAME OWNER TO $DB_USER;
EOF

if [ $? -eq 0 ]; then
    echo "✅ Database and user created successfully!"
    echo ""
    echo "📝 Database credentials:"
    echo "   Database: $DB_NAME"
    echo "   User: $DB_USER"
    echo "   Password: $DB_PASSWORD"
    echo ""
    echo "🔗 Connection string:"
    echo "   postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME?schema=public"
    echo ""
    echo "⚠️  IMPORTANT: Copy the connection string above and update your .env file!"
    echo ""
    echo "Next steps:"
    echo "1. Update backend/.env with the DATABASE_URL above"
    echo "2. Run: npm run prisma:generate"
    echo "3. Run: npm run prisma:migrate"
else
    echo "❌ Database setup failed. Please check PostgreSQL is running."
    exit 1
fi

















