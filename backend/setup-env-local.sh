#!/bin/bash
# Quick script to help set up .env.local

echo "🔐 Supabase .env.local Setup Helper"
echo ""
echo "This will help you create .env.local with Supabase keys."
echo ""

# Check if .env.local already exists
if [ -f .env.local ]; then
    echo "⚠️  .env.local already exists!"
    read -p "Do you want to overwrite it? (y/N): " overwrite
    if [ "$overwrite" != "y" ] && [ "$overwrite" != "Y" ]; then
        echo "Cancelled. Edit .env.local manually."
        exit 0
    fi
fi

echo "📋 You'll need to get these from Supabase Dashboard:"
echo "   1. Settings → API → Project URL"
echo "   2. Settings → API → anon public key"
echo "   3. Settings → API → service_role secret key"
echo "   4. Settings → Database → Connection string (URI)"
echo ""

read -p "Enter your Supabase Project URL: " supabase_url
read -p "Enter your Supabase Anon Key: " supabase_anon_key
read -p "Enter your Supabase Service Role Key: " supabase_service_key
read -p "Enter your Database URL (full connection string): " database_url

# Create .env.local file
cat > .env.local << ENVFILE
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=$supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=$supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=$supabase_service_key
DATABASE_URL=$database_url

# Copy your existing Firebase and other config from .env file below
# NEXT_PUBLIC_FIREBASE_API_KEY=...
# NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
ENVFILE

echo ""
echo "✅ .env.local created successfully!"
echo ""
echo "⚠️  Don't forget to:"
echo "   1. Copy your existing Firebase config from .env to .env.local"
echo "   2. Restart your dev server (npm run dev)"
echo ""
